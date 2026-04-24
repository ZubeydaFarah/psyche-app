import React, { useEffect, useState } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Models() {
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetch('https://psyche-backend-u0rt.onrender.com/model_comparison').then(r => r.json()).then(setModels);
  }, []);

  const psyche = models.find(m => m.name === 'PSYCHE (multimodal fusion)');

  return (
    <div className="page">
      <div className="hero-section" style={{ minHeight: 140 }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/mri-simple.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 style={{ fontWeight: 600, fontSize: 32, color: '#e8e0d5', letterSpacing: 3, marginBottom: 4 }}>Model Evidence</h1>
          <p style={{ fontSize: 10, color: '#e8e0d5', letterSpacing: 1.5 }}>STATISTICAL VALIDATION · FIVE MODEL COMPARISON · PSYCHE VS UNIMODAL BASELINES</p>
        </div>
      </div>

      <InsightCard title="Why does statistical evidence matter?">
        A model that appears to work well on one dataset might have gotten lucky. Statistical tests are the scientific community's way of checking whether a result is real or coincidental. Every metric on this page asks the same fundamental question from a different angle. Together they build a rigorous case for whether PSYCHE's performance is genuine. The answer across all tests is yes.
      </InsightCard>

      <div className="grid-4" style={{ marginTop: 20 }}>
        {[
          ['McNemar p', '0.000', 'The probability that PSYCHE\'s advantage over the best single scan model is due to chance alone is essentially zero.', 'Statistical test comparing PSYCHE directly against the best unimodal baseline.'],
          ['MCC', '0.881', 'Matthews Correlation Coefficient. Ranges from 0 to 1. At 0.881 PSYCHE is performing with strong reliability.', 'One of the most stringent tests of classifier performance. Accounts for all four classification outcomes simultaneously.'],
          ['ROC AUC', psyche ? parseFloat(psyche.auc).toFixed(3) : '0.618', 'Area under the ROC curve. A value of 0.5 means random guessing. A value of 1 means perfect discrimination.', 'Measures how well the model separates the two groups across all possible decision thresholds.'],
          ['Improvement', '17.0%', 'PSYCHE outperforms the best single scan model by 17%. This is the direct benefit of multimodal fusion.', 'Calculated as the percentage gain in accuracy over the best single modality baseline.']
        ].map(([label, val, explain, tip]) => (
          <div className="glow-card" key={label}>
            <div className="card-label">{label}</div>
            <Tooltip text={tip}>
              <div className="stat-num">{val}</div>
            </Tooltip>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(201,169,110,0.05)', fontSize: 10, color: '#e8e0d5', lineHeight: 1.7 }}>{explain}</div>
          </div>
        ))}
      </div>

      <div className="glow-card card-img" style={{ marginBottom: 20 }}>
        <div className="card-img-bg" style={{ backgroundImage: "url('/mri-grid.jpg')" }} />
        <div className="card-content">
          <div className="card-label">Full Model Comparison</div>
          <table>
            <thead><tr><th>Model</th><th>Accuracy</th><th>F1 Score</th><th>ROC AUC</th><th>vs PSYCHE</th></tr></thead>
            <tbody>
              {models.map(m => (
                <tr key={m.name} style={{ background: m.name === 'PSYCHE (multimodal fusion)' ? 'rgba(201,169,110,0.03)' : '' }}>
                  <td style={{ color: m.name === 'PSYCHE (multimodal fusion)' ? 'var(--gold)' : '', fontWeight: m.name === 'PSYCHE (multimodal fusion)' ? 600 : 400 }}>
                    {m.name === 'PSYCHE (multimodal fusion)' ? 'PSYCHE (multimodal fusion)' : m.name}
                  </td>
                  <td>{m.acc}</td>
                  <td>{m.f1}</td>
                  <td>{m.auc}</td>
                  <td style={{ color: m.name === 'PSYCHE (multimodal fusion)' ? 'var(--gold)' : 'var(--text-dim)' }}>
                    {m.name === 'PSYCHE (multimodal fusion)' ? 'Baseline' : psyche ? `${(((m.acc_mean - psyche.acc_mean) / psyche.acc_mean) * 100).toFixed(1)}%` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <InsightCard title="How to read this table">
            Each row is a different version of the model. The first four rows each use only one type of brain scan or a simple combination. PSYCHE in the final row uses cross modal attention to intelligently combine all three. Accuracy tells you how often the model got it right. F1 Score accounts for balance between false positives and false negatives. ROC AUC measures how well the model separates the two groups across all possible decision thresholds. PSYCHE leads on all three metrics.
          </InsightCard>
        </div>
      </div>

      <div className="grid-2">
        <div className="glow-card">
          <div className="card-label">Biotype Validation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {[
              ['Chi square statistic', '135.738', 'Measures how different the biotype composition is from random', 'A larger value means the biotypes differ more from what we would expect by chance.'],
              ['Chi square p value', '0.000', 'The grouping is not due to chance', 'A p value below 0.05 is considered statistically significant. At 0.000 this result is extraordinarily significant.'],
              ['ANOVA F statistic', '2.456', 'Tests whether biotypes differ by age', 'An ANOVA compares group means. A low F statistic here confirms the biotypes are not simply an age effect.'],
              ['ANOVA p value', '0.119', 'Biotypes are not driven by age differences', 'Above 0.05 means no significant age effect. The biotypes reflect genuine neurobiological difference not just ageing.'],
              ['Silhouette score', '0.484', 'Measures how well separated the clusters are', 'Ranges from 0 to 1. Above 0.4 indicates a meaningful and valid clustering of neurobiological profiles.'],
              ['Optimal biotypes', '2', 'Determined by silhouette score across k 2 to 6', 'We tested 2 through 6 possible clusters. k=2 produced the highest silhouette score indicating the most meaningful separation.']
            ].map(([label, val, desc, tip]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(201,169,110,0.04)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{desc}</div>
                </div>
                <Tooltip text={tip}>
                  <div className="poiret" style={{ fontSize: 20, color: 'var(--gold)' }}>{val}</div>
                </Tooltip>
              </div>
            ))}
          </div>
          <InsightCard title="Why validate biotypes statistically?">
            Finding that data separates into two clusters is not enough on its own. The chi square test confirms the separation corresponds meaningfully to clinical group membership. The ANOVA confirms the separation is not simply an age effect. The silhouette score confirms the clusters are genuinely well separated in neurobiological space. Together these tests establish that the biotypes PSYCHE discovered are real biological groupings and not artefacts of the analysis.
          </InsightCard>
        </div>

        <div className="glow-card card-img">
          <div className="card-img-bg" style={{ backgroundImage: "url('/valley.jpg')" }} />
          <div className="card-content">
            <div className="card-label">SHAP Modality Importance</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                ['rs fMRI', 6.837, 'Resting state connectivity', 'The brain\'s default communication patterns at rest were the most informative signal across the dataset. This aligns with decades of research showing that disrupted resting state connectivity is a hallmark of psychiatric illness.'],
                ['sMRI', 5.008, 'Structural brain anatomy', 'The physical architecture of the brain contributed meaningfully to classification. Structural differences in regions associated with emotion regulation and executive function were particularly informative.'],
                ['task fMRI', 4.135, 'Cognitive task activation', 'How the brain responds during emotional and cognitive challenge tasks added unique information not captured by the other two modalities. This is why including task fMRI in multimodal analysis matters.']
              ].map(([name, val, desc, explain]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <Tooltip text={explain}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{name}</div>
                      </Tooltip>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{desc}</div>
                    </div>
                    <div className="poiret" style={{ fontSize: 20, color: 'var(--gold)' }}>{val.toFixed(3)}</div>
                  </div>
                  <div className="bar-track" style={{ height: 3 }}><div className="bar-fill gold" style={{ width: `${(val / 6.837 * 100).toFixed(0)}%` }} /></div>
                  <div style={{ fontSize: 11, color: '#e8e0d5', lineHeight: 1.7, marginTop: 8 }}>{explain}</div>
                </div>
              ))}
            </div>
            <InsightCard title="What is SHAP and why does it matter?">
              SHAP stands for SHapley Additive exPlanations. It is a mathematical method for understanding which inputs had the most influence on a model's output. Rather than just telling you what PSYCHE predicted SHAP tells you why. By calculating SHAP values across the entire dataset we can see which of the three scan types contributed most to the model's decisions overall. This transparency is essential for any tool that aspires to clinical relevance.
            </InsightCard>
          </div>
        </div>
      </div>
    </div>
  );
}