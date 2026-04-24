from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ModalityEncoder(nn.Module):
    def __init__(self, in_dim, emb=64, drop=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(128, emb), nn.BatchNorm1d(emb), nn.ReLU()
        )
    def forward(self, x): return self.net(x)

class CrossModalAttention(nn.Module):
    def __init__(self, emb=64, n_heads=4, n_mods=3):
        super().__init__()
        self.attention = nn.MultiheadAttention(emb, n_heads, batch_first=True)
        self.norm = nn.LayerNorm(emb)
        self.gate = nn.Sequential(nn.Linear(emb*n_mods, n_mods), nn.Softmax(dim=1))
    def forward(self, embs):
        stack = torch.stack(embs, dim=1)
        attn_out, _ = self.attention(stack, stack, stack)
        attn_out = self.norm(attn_out + stack)
        gates = self.gate(torch.cat(embs, dim=1))
        fused = (attn_out * gates.unsqueeze(2)).sum(dim=1)
        return fused, gates

class PsycheModel(nn.Module):
    def __init__(self, dims, n_classes, emb=64, drop=0.3):
        super().__init__()
        self.encoders = nn.ModuleList([ModalityEncoder(d, emb, drop) for d in dims])
        self.attention = CrossModalAttention(emb, n_heads=4, n_mods=len(dims))
        self.classifier = nn.Sequential(
            nn.Linear(emb, 64), nn.ReLU(), nn.Dropout(drop), nn.Linear(64, n_classes)
        )
        self.projector = nn.Sequential(nn.Linear(emb, 32), nn.ReLU(), nn.Linear(32, 2))
    def forward(self, inputs, return_embeddings=False):
        embs = [enc(x) for enc, x in zip(self.encoders, inputs)]
        fused, gates = self.attention(embs)
        out = {'logits': self.classifier(fused), 'attn': gates}
        if return_embeddings:
            out['emb'] = fused
            out['coords'] = self.projector(fused)
        return out

with open("psyche_outputs/artifacts.pkl", "rb") as f:
    artifacts = pickle.load(f)

biotype_df     = artifacts["biotype_df"]
umap_coords    = artifacts["umap_coords"]
attn_weights   = artifacts["attn_weights"]
uncertainty    = artifacts["uncertainty"]
results        = artifacts["results"]
optimal_k      = artifacts["optimal_k"]
biotype_labels = artifacts["biotype_labels"]
mean_probs     = artifacts["mean_probs"]
embeddings_all = artifacts.get("embeddings", None)
scaler         = artifacts["scaler"]
imputer        = artifacts["imputer"]
selector       = artifacts["selector"]
mask           = artifacts["mask"]
mod_dims       = artifacts["mod_dims"]
mod_indices    = artifacts["modality_indices"]
all_cols       = artifacts["all_cols"]
n_classes      = artifacts["n_classes"]
label_encoder  = artifacts["label_encoder"]

model_comparison = pd.read_csv("psyche_outputs/model_comparison.csv")

device = torch.device("cpu")
model = PsycheModel(mod_dims, n_classes).to(device)
model.load_state_dict(torch.load("psyche_outputs/psyche_model.pt", map_location=device))
model.eval()

@app.get("/")
def root():
    return {"status": "PSYCHE API running"}

@app.get("/results")
def get_results():
    return results

@app.get("/subjects")
def get_subjects():
    subjects = []
    for i, row in biotype_df.iterrows():
        subjects.append({
            "participant_id": row["participant_id"],
            "biotype": int(row["biotype"]) + 1,
            "group": row["group"],
            "uncertainty": float(row["uncertainty"]),
            "prob_patient": float(mean_probs[i][1]),
            "prob_genpop": float(mean_probs[i][0]),
            "umap_1": float(row["umap_1"]),
            "umap_2": float(row["umap_2"]),
            "attn_smri": float(attn_weights[i][0]),
            "attn_rsfmri": float(attn_weights[i][1]),
            "attn_task": float(attn_weights[i][2]),
        })
    return subjects

@app.get("/biotypes")
def get_biotypes():
    biotypes = []
    for b in range(optimal_k):
        mask_b = biotype_labels == b
        group_counts = biotype_df[mask_b]["group"].value_counts().to_dict()
        biotypes.append({
            "biotype": b + 1,
            "n": int(mask_b.sum()),
            "patient_count": int(group_counts.get("Patient", 0)),
            "genpop_count": int(group_counts.get("GenPop", 0)),
            "mean_uncertainty": float(uncertainty[mask_b].mean()),
        })
    return biotypes

@app.get("/model_comparison")
def get_model_comparison():
    return model_comparison.to_dict(orient="records")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        X = df[all_cols].values if all(c in df.columns for c in all_cols) else None
        if X is None:
            return {"error": "CSV missing required columns. Expected sMRI, rs-fMRI and task-fMRI features."}

        X_proc = scaler.transform(selector.transform(imputer.transform(X)))
        cols_kept = [c for c, k in zip(all_cols, mask) if k]
        n_s = sum(1 for c in cols_kept if c.startswith('smri_'))
        n_r = sum(1 for c in cols_kept if c.startswith('rsfmri_'))

        inputs = [
            torch.FloatTensor(X_proc[:, list(mod_indices['sMRI'])]).to(device) if len(mod_indices['sMRI']) > 0 else torch.zeros(len(X_proc), 1).to(device),
            torch.FloatTensor(X_proc[:, list(mod_indices['rs-fMRI'])]).to(device) if len(mod_indices['rs-fMRI']) > 0 else torch.zeros(len(X_proc), 1).to(device),
            torch.FloatTensor(X_proc[:, list(mod_indices['task-fMRI'])]).to(device) if len(mod_indices['task-fMRI']) > 0 else torch.zeros(len(X_proc), 1).to(device),
        ]

        with torch.no_grad():
            out = model(inputs, return_embeddings=True)
            logits = out['logits']
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            attn = out['attn'].cpu().numpy()
            preds = logits.argmax(1).cpu().numpy()

        model.train()
        logits_list = []
        with torch.no_grad():
            for _ in range(30):
                logits_list.append(torch.softmax(model(inputs)['logits'], dim=1))
        model.eval()
        stacked = torch.stack(logits_list)
        unc = stacked.std(0).mean(1).cpu().numpy()

        predictions = []
        for i in range(len(df)):
            predictions.append({
                "subject_id": str(df.iloc[i].get("participant_id", f"Subject_{i+1}")),
                "predicted_group": label_encoder.classes_[int(preds[i])],
                "prob_patient": float(probs[i][1]),
                "prob_genpop": float(probs[i][0]),
                "uncertainty": float(unc[i]),
                "uncertainty_level": "Low" if unc[i] < 0.05 else "Moderate" if unc[i] < 0.15 else "High",
                "attn_smri": float(attn[i][0]),
                "attn_rsfmri": float(attn[i][1]),
                "attn_task": float(attn[i][2]),
            })

        return {
            "n_subjects": len(predictions),
            "predictions": predictions,
            "summary": {
                "patient_count": sum(1 for p in predictions if p["predicted_group"] == "Patient"),
                "genpop_count": sum(1 for p in predictions if p["predicted_group"] == "GenPop"),
                "mean_uncertainty": float(np.mean([p["uncertainty"] for p in predictions])),
                "high_uncertainty_count": sum(1 for p in predictions if p["uncertainty_level"] == "High"),
            }
        }
    except Exception as e:
        return {"error": str(e)}
