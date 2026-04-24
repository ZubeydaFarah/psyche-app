import React, { useState, useRef } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = e => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(''); setResults(null); }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('https://unglazed-kitchen-buggy.ngrok-free.dev/predict', { method: 'POST', body: form });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResults(data);
    } catch {
      setError('Failed to connect to PSYCHE backend.');
    }
    setLoading(false);
  };

  const uncertaintyLabel = u => u < 0.05 ? 'Low' : u < 0.15 ? 'Moderate' : 'High';

  return (
    <div className="page">
      <div className="hero-section" style={{ minHeight: 140 }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/river.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 style={{ fontWeight: 600, fontSize: 32, color: '#e8e0d5', letterSpacing: 3, marginBottom: 4 }}>External Dataset Analysis</h1>
          <p style={{ fontSize: 10, color: '#e8e0d5', letterSpacing: 1.5 }}>UPLOAD A CSV AND PSYCHE WILL RETURN A FULL NEUROBIOLOGICAL PROFILE FOR EACH SUBJECT</p>
        </div>
      </div>

      <InsightCard title="What is this feature and why does it matter?">
        PSYCHE was trained on 184 subjects from the Transdiagnostic Connectome Project. This upload tool allows you to go further. Provide a CSV containing brain scan features from subjects PSYCHE has never seen before and it will apply everything it learned to generate predictions for your new data. This is what turns a research model into a generalisation instrument. If PSYCHE correctly profiles your new subjects it provides evidence that the neurobiological patterns it learned are real and transferable beyond the original dataset. This is the foundation of external validation in machine learning research.
      </InsightCard>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glow-card">
            <div className="card-label">Upload Dataset</div>
            <div className="upload-zone" onClick={() => fileRef.current.click()}>
              <h3>{file ? file.name : 'DROP CSV HERE'}</h3>
              <p>{file ? `${(file.size / 1024).toFixed(1)} KB · Ready to analyse` : 'or click to browse · CSV format required'}</p>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
            </div>
            {file && (
              <button className="action-btn" style={{ marginTop: 16, width: '100%' }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'ANALYSING...' : 'RUN PSYCHE INFERENCE'}
              </button>
            )}
            {error && <p style={{ fontSize: 11, color: 'var(--patient)', marginTop: 8 }}>{error}</p>}
          </div>

          <div className="glow-card">
            <div className="card-label">Required CSV Format</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                ['participant_id', 'Optional. Any identifier for each subject.'],
                ['8 sMRI features', 'smri_mean, smri_std, smri_median, smri_p25, smri_p75, smri_volume, smri_skew, smri_kurtosis'],
                ['7 rs-fMRI features', 'rsfmri_mean_fc, rsfmri_std_fc, rsfmri_max_fc, rsfmri_min_fc, rsfmri_median_fc, rsfmri_ts_mean, rsfmri_ts_std'],
                ['96 task fMRI features', 'task_stroop_[region] x48 and task_hammer_[region] x48 across Harvard Oxford atlas regions']
              ].map(([col, desc]) => (
                <div key={col} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 4, fontWeight: 600 }}>{col}</div>
                  <div style={{ fontSize: 15, color: '#e8e0d5' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {!results && !loading && (
            <div className="glow-card card-img" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div className="card-img-bg" style={{ backgroundImage: "url('/river.jpg')", opacity: 0.06 }} />
              <div className="card-content" style={{ textAlign: 'center' }}>
                <div className="poiret" style={{ fontSize: 22, color: 'var(--text-dim)', letterSpacing: 3 }}>AWAITING DATA</div>
                <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginTop: 8 }}>Upload a CSV to begin analysis</p>
              </div>
            </div>
          )}

          {loading && <div className="loading">RUNNING INFERENCE</div>}

          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="glow-card"><div className="card-label">Subjects Analysed</div><div className="stat-num">{results.n_subjects}</div></div>
                <div className="glow-card">
                  <div className="card-label">Mean Uncertainty</div>
                  <Tooltip text="The average uncertainty across all subjects. Lower means the model is more confident overall.">
                    <div className="stat-num">{results.summary.mean_uncertainty.toFixed(3)}</div>
                  </Tooltip>
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div className="glow-card"><div className="card-label">Predicted Patient</div><div className="stat-num" style={{ color: 'var(--patient)' }}>{results.summary.patient_count}</div></div>
                <div className="glow-card"><div className="card-label">Predicted GenPop</div><div className="stat-num" style={{ color: 'var(--genpop)' }}>{results.summary.genpop_count}</div></div>
              </div>
              <InsightCard title="How to interpret these results">
                Each row represents one subject from your uploaded dataset. The predicted group is PSYCHE's best classification based on their brain scan features. The probability scores show how confident PSYCHE is in that classification. The uncertainty level tells you how much variability there was across 30 repeated predictions. High uncertainty subjects sit at the neurobiological boundary and deserve closer examination. The dominant modality tells you which scan type was most informative for each individual.
              </InsightCard>
              <div className="glow-card">
                <div className="card-label">Individual Predictions</div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Subject</th><th>Prediction</th><th>Patient %</th><th>GenPop %</th><th>Uncertainty</th><th>Dominant Modality</th></tr></thead>
                    <tbody>
                      {results.predictions.map((p, i) => (
                        <tr key={i}>
                          <td>{p.subject_id}</td>
                          <td><span className={`badge badge-${p.predicted_group.toLowerCase()}`}>{p.predicted_group}</span></td>
                          <td style={{ color: 'var(--patient)' }}>{(p.prob_patient * 100).toFixed(1)}%</td>
                          <td style={{ color: 'var(--genpop)' }}>{(p.prob_genpop * 100).toFixed(1)}%</td>
                          <td><span className={`badge badge-${uncertaintyLabel(p.uncertainty).toLowerCase()}`}>{uncertaintyLabel(p.uncertainty)}</span></td>
                          <td style={{ color: 'var(--gold)' }}>{p.attn_task > p.attn_smri && p.attn_task > p.attn_rsfmri ? 'task fMRI' : p.attn_rsfmri > p.attn_smri ? 'rs fMRI' : 'sMRI'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}