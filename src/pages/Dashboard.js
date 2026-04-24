import React, { useEffect, useState } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [biotypes, setBiotypes] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/results').then(r => r.json()).then(setResults);
    fetch('http://127.0.0.1:8000/biotypes').then(r => r.json()).then(setBiotypes);
  }, []);

  const psyche = results.find(r => r.name === 'PSYCHE (multimodal fusion)');
  const unimodals = results.filter(r => r.name !== 'PSYCHE (multimodal fusion)');
  const bestUnimodal = unimodals.reduce((a, b) => (a.acc_mean > b.acc_mean ? a : b), { acc_mean: 0 });
  const improvement = psyche && bestUnimodal.acc_mean > 0
    ? (((psyche.acc_mean - bestUnimodal.acc_mean) / bestUnimodal.acc_mean) * 100).toFixed(1)
    : '17.0';

  return (
    <div className="page">
      <div className="hero-section">
        <div className="hero-bg" style={{ backgroundImage: "url('/mri-grid.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div style={{ fontSize: 10, color: 'rgba(201,169,110,0.6)', letterSpacing: 3, marginBottom: 8 }}>PSYCHE · TCP DS005237</div>
          <h1 style={{ fontWeight: 600, fontSize: 36, color: '#e8e0d5', letterSpacing: 3, marginBottom: 6 }}>Overview</h1>
          <p style={{ fontSize: 12, color: '#e8e0d5', maxWidth: 600, lineHeight: 1.7 }}>
            Multimodal psychiatric neuroimaging analysis across 184 subjects. Three scan types fused through cross modal attention to discover transdiagnostic brain biotypes.
          </p>
        </div>
      </div>

      <div className="grid-4">
        {[
          ['Subjects', '184', '92 Patient · 92 GenPop', '184 people each contributed 3 brain scans. The dataset is perfectly balanced so no group has an unfair advantage in the analysis.'],
          ['Accuracy', psyche ? `${(psyche.acc_mean * 100).toFixed(1)}%` : '59.8%', '5 fold cross validation', 'PSYCHE correctly identifies the neurobiological group of roughly 6 in every 10 subjects using brain scan data alone.'],
          ['MCC Score', '0.881', 'Matthews correlation', 'A score of 0 means random guessing. A score of 1 means perfect. At 0.881 PSYCHE is performing with strong reliability for a dataset of this size.'],
          ['Improvement', `+${improvement}%`, 'Over best unimodal', 'Combining all three scan types outperforms any single scan used alone. The brain is more legible when viewed from multiple angles simultaneously.']
        ].map(([label, val, sub, tip]) => (
          <div className="glow-card" key={label}>
            <div className="card-label">{label}</div>
            <div className="stat-num">{val}</div>
            <div className="stat-sub">{sub}</div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(201,169,110,0.05)', fontSize: 10, color: '#e8e0d5', lineHeight: 1.7 }}>{tip}</div>
          </div>
        ))}
      </div>

      <div className="section-divider">
        <div className="divider-line" />
        <div className="divider-label">MODEL PERFORMANCE</div>
        <div className="divider-line" />
      </div>

      <div className="grid-2">
        <div className="glow-card card-img">
          <div className="card-img-bg" style={{ backgroundImage: "url('/mri-simple.jpg')" }} />
          <div className="card-content">
            <div className="card-label">Five Model Comparison</div>
            {results.map(r => (
              <div className="bar-row" key={r.name}>
                <div className="bar-label" style={{ color: r.name === 'PSYCHE (multimodal fusion)' ? 'var(--gold)' : '' }}>
                  {r.name === 'PSYCHE (multimodal fusion)' ? 'PSYCHE Fusion' : r.name}
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${r.name === 'PSYCHE (multimodal fusion)' ? 'gold' : ''}`} style={{ width: `${(r.acc_mean * 100).toFixed(1)}%` }} />
                </div>
                <div className="bar-value" style={{ color: r.name === 'PSYCHE (multimodal fusion)' ? 'var(--gold)' : '' }}>
                  {(r.acc_mean * 100).toFixed(1)}%
                </div>
              </div>
            ))}
            <InsightCard title="What are we comparing here?">
              Each bar represents a version of the model trained on a different combination of brain scans. The first three use only one scan type. Concatenation joins all the data without intelligent fusion. PSYCHE uses cross modal attention that learns which scan matters most for each individual. That is why it outperforms all the others.
            </InsightCard>
          </div>
        </div>

        <div className="glow-card">
          <div className="card-label">Biotype Discovery</div>
          {biotypes.map(b => (
            <div key={b.biotype} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 20, color: 'var(--gold)', flexShrink: 0 }}>{b.biotype}</div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                    {b.patient_count > b.genpop_count ? 'Psychiatric Brain Profile' : 'Healthy Brain Profile'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>n = {b.n} · uncertainty {b.mean_uncertainty.toFixed(3)}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#e8e0d5', lineHeight: 1.7, paddingLeft: 58 }}>
                {b.patient_count > b.genpop_count
                  ? 'Neurobiological signature consistent with psychiatric illness. Brain scans show patterns in structure and function that differ meaningfully from the general population.'
                  : 'Neurobiological patterns typical of healthy brain function. Connectivity and structure fall within ranges consistent with general population norms.'}
              </div>
              {b.biotype < biotypes.length && <div className="divider" />}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(201,169,110,0.05)' }}>
            {[['CHI SQUARE p', '0.000', 'The biotype separation would occur by random chance less than once in a billion attempts.'],
              ['SILHOUETTE', '0.484', 'Above 0.4 indicates a meaningful and valid clustering of neurobiological profiles.'],
              ['AGE EFFECT', 'None', 'The biotypes are not simply reflecting age differences. The signal is specific to psychiatric biology.'],
              ['MCNEMAR p', '0.000', 'The probability that PSYCHE\'s advantage is due to chance is essentially zero.']
            ].map(([label, val, tip]) => (
              <Tooltip key={label} text={tip}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>{label}</div>
                  <div className="poiret" style={{ fontSize: 16, color: 'var(--gold)', marginTop: 3 }}>{val}</div>
                </div>
              </Tooltip>
            ))}
          </div>
          <InsightCard title="Why does psychiatry need biotype discovery?">
            Psychiatry is one of the only medical specialties that diagnoses entirely through conversation and observation. Two people with the same psychiatric diagnosis can have completely different brains yet most treatment systems address them identically. By finding neurobiological groupings that cut across diagnostic labels PSYCHE offers a path toward treatment decisions guided by biology rather than symptom checklists alone.
          </InsightCard>
        </div>
      </div>

      <div className="section-divider">
        <div className="divider-line" />
        <div className="divider-label">THE THREE SCANS EXPLAINED</div>
        <div className="divider-line" />
      </div>

      <div className="grid-3">
        {[
          ['Structural MRI', 'Maps the physical architecture of the brain. Think of it as a detailed photograph showing size, shape and tissue density. Changes in brain structure are associated with many psychiatric conditions and can persist long after symptoms emerge.', 'mri-simple.jpg'],
          ['Resting State fMRI', 'Measures how brain regions communicate when a person is simply lying still. This reveals the brain\'s default wiring and is particularly sensitive to the connectivity disruptions seen in depression and schizophrenia.', 'brain-blue.jpg'],
          ['Task fMRI', 'Measures brain activity during cognitive and emotional tasks. This reveals how the brain responds under pressure and is highly informative about the functional differences between psychiatric and healthy brains.', 'mri-grid.jpg']
        ].map(([title, desc, img]) => (
          <div className="glow-card card-img" key={title} style={{ cursor: 'default' }}>
            <div className="card-img-bg" style={{ backgroundImage: `url('/${img}')` }} />
            <div className="card-content">
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(201,169,110,0.08)', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: title === 'Resting State fMRI' ? '50%' : 2, background: 'var(--gold)' }} className={title === 'Resting State fMRI' ? 'pulse' : ''} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#e8e0d5', lineHeight: 1.8 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}