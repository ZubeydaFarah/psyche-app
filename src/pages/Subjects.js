import React, { useEffect, useState } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('https://psyche-backend-u0rt.onrender.com/subjects').then(r => r.json()).then(data => {
      setSubjects(data);
      setSelected(data[0]);
    });
  }, []);

  const filtered = subjects.filter(s =>
    s.participant_id.toLowerCase().includes(search.toLowerCase())
  );

  const similar = selected ? subjects
    .filter(s => s.participant_id !== selected.participant_id)
    .map(s => ({ ...s, dist: Math.abs(s.umap_1 - selected.umap_1) + Math.abs(s.umap_2 - selected.umap_2) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3) : [];

  const uncertaintyLabel = u => u < 0.05 ? 'Low' : u < 0.15 ? 'Moderate' : 'High';
  const dominantModality = s => s.attn_task > s.attn_smri && s.attn_task > s.attn_rsfmri ? 'task fMRI' : s.attn_rsfmri > s.attn_smri ? 'rs fMRI' : 'sMRI';

  if (!subjects.length) return <div className="loading">LOADING SUBJECTS</div>;

  return (
    <div className="page">
      <div className="hero-section" style={{ minHeight: 140 }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/brain-blue.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 style={{ fontWeight: 600, fontSize: 32, color: '#e8e0d5', letterSpacing: 3, marginBottom: 4 }}>Subject Profiler</h1>
          <p style={{ fontSize: 10, color: '#e8e0d5', letterSpacing: 1.5 }}>SELECT ANY SUBJECT TO REVEAL THEIR COMPLETE NEUROBIOLOGICAL PROFILE</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <div className="glow-card" style={{ padding: 16, height: 'fit-content' }}>
          <div className="card-label">Select Subject</div>
          <input
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-muted)', fontSize: 11, outline: 'none', width: '100%', fontFamily: 'Raleway', marginBottom: 10 }}
            placeholder="Search by ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filtered.map(s => (
              <div key={s.participant_id} onClick={() => setSelected(s)}
                style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 10, background: selected?.participant_id === s.participant_id ? 'rgba(201,169,110,0.08)' : 'transparent', color: selected?.participant_id === s.participant_id ? 'var(--gold)' : 'var(--text-dim)', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.participant_id.replace('sub-', '')}</span>
                <span style={{ color: s.group === 'Patient' ? 'var(--patient)' : 'var(--genpop)', fontSize: 9 }}>{s.group}</span>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glow-card card-img">
              <div className="card-img-bg" style={{ backgroundImage: "url('/brain-blue.jpg')", opacity: 0.06 }} />
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-label">Subject Profile</div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', letterSpacing: 1 }}>{selected.participant_id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className={`badge badge-${selected.group.toLowerCase()}`}>{selected.group}</span>
                    <span className={`badge badge-b${selected.biotype}`}>Biotype {selected.biotype}</span>
                    <span className={`badge badge-${uncertaintyLabel(selected.uncertainty).toLowerCase()}`}>{uncertaintyLabel(selected.uncertainty)} Uncertainty</span>
                  </div>
                </div>
                <InsightCard title="What does this profile tell us?">
                  This subject has been classified as belonging to the {selected.group === 'Patient' ? 'psychiatric patient' : 'general population'} neurobiological group with {(Math.max(selected.prob_patient, selected.prob_genpop) * 100).toFixed(1)}% confidence. {selected.uncertainty < 0.05 ? 'PSYCHE is highly confident in this classification. The brain scan data is clearly consistent with one neurobiological group.' : selected.uncertainty < 0.15 ? 'PSYCHE has moderate confidence. This subject shows some features of both groups which may indicate a complex or transitional neurobiological profile.' : 'PSYCHE is uncertain about this subject. Their brain profile sits at the boundary between the two groups. This uncertainty is itself clinically meaningful.'} The dominant signal driving this classification came from {dominantModality(selected)}.
                </InsightCard>
              </div>
            </div>

            <div className="grid-2">
              <div className="glow-card">
                <div className="card-label">Classification Probability</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--patient)' }}>Patient</span>
                  <span style={{ fontSize: 10, color: 'var(--genpop)' }}>GenPop</span>
                </div>
                <div className="prob-bar">
                  <div className="prob-patient" style={{ width: `${(selected.prob_patient * 100).toFixed(1)}%` }} />
                  <div className="prob-genpop" style={{ width: `${(selected.prob_genpop * 100).toFixed(1)}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Tooltip text="How likely PSYCHE thinks this person belongs to the psychiatric patient neurobiological group based purely on their brain scans.">
                    <div className="poiret" style={{ fontSize: 28, color: 'var(--patient)' }}>{(selected.prob_patient * 100).toFixed(1)}%</div>
                  </Tooltip>
                  <Tooltip text="How likely PSYCHE thinks this person belongs to the general population neurobiological group based purely on their brain scans.">
                    <div className="poiret" style={{ fontSize: 28, color: 'var(--genpop)' }}>{(selected.prob_genpop * 100).toFixed(1)}%</div>
                  </Tooltip>
                </div>
                <InsightCard title="How to read the probability bar">
                  These two percentages always add up to 100. The larger number shows which group PSYCHE places this person in. A result close to 50 on both sides means the brain profile is ambiguous. A result strongly weighted toward one side means PSYCHE has found clear neurobiological evidence for that classification.
                </InsightCard>
              </div>

              <div className="glow-card">
                <div className="card-label">Modality Attention Weights</div>
                {[['sMRI', selected.attn_smri, 'Structural brain anatomy', 'How much the physical structure of the brain drove this classification decision.'],
                  ['rs fMRI', selected.attn_rsfmri, 'Resting state connectivity', 'How much the brain\'s default communication patterns drove this classification.'],
                  ['task fMRI', selected.attn_task, 'Cognitive task activation', 'How much the brain\'s response to cognitive tasks drove this classification.']
                ].map(([name, val, desc, tip]) => (
                  <div key={name} style={{ marginBottom: 14 }}>
                    <div className="bar-row" style={{ marginBottom: 4 }}>
                      <Tooltip text={tip}>
                        <div className="bar-label">{name}</div>
                      </Tooltip>
                      <div className="bar-track"><div className="bar-fill gold" style={{ width: `${(val * 100).toFixed(1)}%` }} /></div>
                      <div className="bar-value" style={{ color: 'var(--gold)' }}>{(val * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#e8e0d5' }}>{desc}</div>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Tooltip text="How variable PSYCHE's predictions were across 30 repeated runs. Lower is more confident.">
                    <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>UNCERTAINTY</div><div className="poiret" style={{ fontSize: 18, color: 'var(--gold)', marginTop: 3 }}>{selected.uncertainty.toFixed(4)}</div></div>
                  </Tooltip>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>UMAP 1</div><div className="poiret" style={{ fontSize: 18, color: 'var(--gold)', marginTop: 3 }}>{selected.umap_1.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>UMAP 2</div><div className="poiret" style={{ fontSize: 18, color: 'var(--gold)', marginTop: 3 }}>{selected.umap_2.toFixed(2)}</div></div>
                </div>
              </div>
            </div>

            <div className="glow-card">
              <div className="card-label">3 Most Neurobiologically Similar Subjects</div>
              <table>
                <thead><tr><th>Subject ID</th><th>Group</th><th>Biotype</th><th>Uncertainty</th><th>Neurobiological Distance</th></tr></thead>
                <tbody>
                  {similar.map(s => (
                    <tr key={s.participant_id} style={{ cursor: 'pointer' }} onClick={() => setSelected(s)}>
                      <td>{s.participant_id}</td>
                      <td><span className={`badge badge-${s.group.toLowerCase()}`}>{s.group}</span></td>
                      <td><span className={`badge badge-b${s.biotype}`}>Biotype {s.biotype}</span></td>
                      <td><span className={`badge badge-${uncertaintyLabel(s.uncertainty).toLowerCase()}`}>{uncertaintyLabel(s.uncertainty)}</span></td>
                      <td style={{ color: 'var(--gold)' }}>{s.dist.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <InsightCard title="Why does neurobiological similarity matter?">
                These are the three subjects whose brains are most similar to the selected subject in PSYCHE's learned neurobiological space. When two people are close together here it means their brain structure, connectivity and task responses share common patterns. This is the foundation of precision psychiatry. Identifying clusters of neurobiologically similar individuals could one day guide treatment decisions and predict who responds to which interventions.
              </InsightCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}