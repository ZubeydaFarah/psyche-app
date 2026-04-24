import React, { useEffect, useState, useRef } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Biotypes() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState({ group: 'all', biotype: 'all', uncertainty: 'all' });
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('https://unglazed-kitchen-buggy.ngrok-free.dev/subjects').then(r => r.json()).then(setSubjects);
  }, []);

  const filtered = subjects.filter(s => {
    if (filter.group !== 'all' && s.group !== filter.group) return false;
    if (filter.biotype !== 'all' && s.biotype !== parseInt(filter.biotype)) return false;
    if (filter.uncertainty === 'low' && s.uncertainty >= 0.05) return false;
    if (filter.uncertainty === 'high' && s.uncertainty < 0.15) return false;
    return true;
  });

  useEffect(() => {
    if (!subjects.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const u1 = subjects.map(s => s.umap_1), u2 = subjects.map(s => s.umap_2);
    const minU1 = Math.min(...u1), maxU1 = Math.max(...u1);
    const minU2 = Math.min(...u2), maxU2 = Math.max(...u2);
    const pad = 40;
    const px = v => pad + ((v - minU1) / (maxU1 - minU1)) * (W - pad * 2);
    const py = v => H - pad - ((v - minU2) / (maxU2 - minU2)) * (H - pad * 2);
    filtered.forEach(s => {
      const x = px(s.umap_1), y = py(s.umap_2);
      ctx.beginPath();
      ctx.arc(x, y, selected?.participant_id === s.participant_id ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = s.group === 'Patient' ? 'rgba(224,123,106,0.8)' : 'rgba(122,184,138,0.8)';
      ctx.fill();
      if (s.uncertainty > 0.15) {
        ctx.strokeStyle = 'rgba(201,169,110,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      let closest = null, minD = 14;
      filtered.forEach(s => {
        const d = Math.hypot(px(s.umap_1) - mx, py(s.umap_2) - my);
        if (d < minD) { minD = d; closest = s; }
      });
      setSelected(closest);
    };
  }, [subjects, filtered, selected]);

  const uncertaintyLabel = u => u < 0.05 ? 'Low' : u < 0.15 ? 'Moderate' : 'High';
  const dominantModality = s => s.attn_task > s.attn_smri && s.attn_task > s.attn_rsfmri ? 'task fMRI' : s.attn_rsfmri > s.attn_smri ? 'rs fMRI' : 'sMRI';

  return (
    <div className="page">
      <div className="hero-section" style={{ minHeight: 140 }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/valley.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 style={{ fontWeight: 600, fontSize: 32, color: '#e8e0d5', letterSpacing: 3, marginBottom: 4 }}>Transdiagnostic Explorer</h1>
          <p style={{ fontSize: 10, color: '#e8e0d5', letterSpacing: 1.5 }}>INTERACTIVE UMAP EMBEDDING SPACE · CLICK ANY SUBJECT TO REVEAL THEIR PROFILE</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glow-card">
            <div className="card-label">Filters</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['GROUP', ['all', 'Patient', 'GenPop'], 'group'],
                ['BIOTYPE', ['all', '1', '2'], 'biotype']].map(([label, opts, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {opts.map(o => (
                      <button key={o} onClick={() => setFilter(f => ({ ...f, [key]: o }))}
                        style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: '1px solid', fontSize: 10, cursor: 'pointer', fontFamily: 'Raleway', borderColor: filter[key] === o ? 'var(--gold)' : 'var(--border)', background: filter[key] === o ? 'rgba(201,169,110,0.1)' : 'transparent', color: filter[key] === o ? 'var(--gold)' : 'var(--text-dim)', transition: 'all 0.2s' }}>
                        {o === 'all' ? 'All' : key === 'biotype' ? `B${o}` : o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>UNCERTAINTY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[['all', 'All subjects'], ['low', 'Low only'], ['high', 'High only']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(f => ({ ...f, uncertainty: val }))}
                      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid', fontSize: 10, cursor: 'pointer', fontFamily: 'Raleway', textAlign: 'left', borderColor: filter.uncertainty === val ? 'var(--gold)' : 'var(--border)', background: filter.uncertainty === val ? 'rgba(201,169,110,0.1)' : 'transparent', color: filter.uncertainty === val ? 'var(--gold)' : 'var(--text-dim)', transition: 'all 0.2s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divider" />
              {[['var(--patient)', 'Patient'], ['var(--genpop)', 'GenPop']].map(([col, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--gold)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>High uncertainty</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{filtered.length} subjects shown</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glow-card" style={{ padding: 20 }}>
            <div className="card-label">UMAP Embedding Space · {filtered.length} Subjects · Click Any Dot</div>
            <canvas ref={canvasRef} width={800} height={420} style={{ width: '100%', height: 'auto', borderRadius: 8, cursor: 'crosshair', background: 'rgba(12,10,8,0.6)' }} />
            <InsightCard title="How to read this map">
              Each dot is a person. Their position was calculated entirely from their brain scan data. People whose brains work similarly end up near each other. The two clusters were not programmed in. PSYCHE discovered them by learning from the biology. The separation between red and green dots shows that psychiatric illness leaves a detectable neurobiological signature even without using any diagnostic labels. Gold ringed dots are subjects where PSYCHE was uncertain. These boundary cases are among the most scientifically interesting subjects in the dataset.
            </InsightCard>
          </div>

          {selected && (
            <div className="glow-card card-img">
              <div className="card-img-bg" style={{ backgroundImage: "url('/brain-blue.jpg')" }} />
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="card-label">Selected Subject</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', letterSpacing: 1 }}>{selected.participant_id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${selected.group.toLowerCase()}`}>{selected.group}</span>
                    <span className={`badge badge-b${selected.biotype}`}>Biotype {selected.biotype}</span>
                    <span className={`badge badge-${uncertaintyLabel(selected.uncertainty).toLowerCase()}`}>{uncertaintyLabel(selected.uncertainty)} Uncertainty</span>
                  </div>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  <Tooltip text="How likely PSYCHE thinks this person belongs to the psychiatric patient group.">
                    <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>PATIENT PROBABILITY</div><div className="poiret" style={{ fontSize: 22, color: 'var(--patient)', marginTop: 3 }}>{(selected.prob_patient * 100).toFixed(1)}%</div></div>
                  </Tooltip>
                  <Tooltip text="How likely PSYCHE thinks this person belongs to the general population group.">
                    <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>GENPOP PROBABILITY</div><div className="poiret" style={{ fontSize: 22, color: 'var(--genpop)', marginTop: 3 }}>{(selected.prob_genpop * 100).toFixed(1)}%</div></div>
                  </Tooltip>
                  <Tooltip text="How variable PSYCHE's predictions were. Lower means more confident.">
                    <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>UNCERTAINTY</div><div className="poiret" style={{ fontSize: 22, color: 'var(--gold)', marginTop: 3 }}>{selected.uncertainty.toFixed(4)}</div></div>
                  </Tooltip>
                  <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>DOMINANT MODALITY</div><div className="poiret" style={{ fontSize: 22, color: 'var(--gold)', marginTop: 3 }}>{dominantModality(selected)}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}