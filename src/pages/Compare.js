import React, { useEffect, useState } from 'react';
import InsightCard from '../components/InsightCard';
import Tooltip from '../components/Tooltip';

export default function Compare() {
  const [subjects, setSubjects] = useState([]);
  const [subjectA, setSubjectA] = useState(null);
  const [subjectB, setSubjectB] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/subjects').then(r => r.json()).then(data => {
      setSubjects(data);
      setSubjectA(data[0]);
      setSubjectB(data[10]);
    });
  }, []);

  const uncertaintyLabel = u => u < 0.05 ? 'Low' : u < 0.15 ? 'Moderate' : 'High';
  const dominantModality = s => s.attn_task > s.attn_smri && s.attn_task > s.attn_rsfmri ? 'task fMRI' : s.attn_rsfmri > s.attn_smri ? 'rs fMRI' : 'sMRI';

  const SubjectCard = ({ subject, label, onChange }) => (
    <div className="glow-card card-img">
      <div className="card-img-bg" style={{ backgroundImage: "url('/mri-grid.jpg')" }} />
      <div className="card-content">
        <div className="card-label">{label}</div>
        <select value={subject?.participant_id || ''} onChange={e => onChange(subjects.find(s => s.participant_id === e.target.value))} style={{ marginBottom: 16 }}>
          {subjects.map(s => <option key={s.participant_id} value={s.participant_id}>{s.participant_id}</option>)}
        </select>
        {subject && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`badge badge-${subject.group.toLowerCase()}`}>{subject.group}</span>
              <span className={`badge badge-b${subject.biotype}`}>Biotype {subject.biotype}</span>
              <span className={`badge badge-${uncertaintyLabel(subject.uncertainty).toLowerCase()}`}>{uncertaintyLabel(subject.uncertainty)}</span>
            </div>
            <div className="divider" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 10 }}>MODALITY ATTENTION</div>
              {[['sMRI', subject.attn_smri], ['rs fMRI', subject.attn_rsfmri], ['task fMRI', subject.attn_task]].map(([name, val]) => (
                <div className="bar-row" key={name}>
                  <div className="bar-label">{name}</div>
                  <div className="bar-track"><div className="bar-fill gold" style={{ width: `${(val * 100).toFixed(1)}%` }} /></div>
                  <div className="bar-value" style={{ color: 'var(--gold)' }}>{(val * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tooltip text="How likely PSYCHE thinks this person belongs to the psychiatric patient neurobiological group.">
                <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>PATIENT</div><div className="poiret" style={{ fontSize: 22, color: 'var(--patient)', marginTop: 3 }}>{(subject.prob_patient * 100).toFixed(1)}%</div></div>
              </Tooltip>
              <Tooltip text="How likely PSYCHE thinks this person belongs to the general population neurobiological group.">
                <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>GENPOP</div><div className="poiret" style={{ fontSize: 22, color: 'var(--genpop)', marginTop: 3 }}>{(subject.prob_genpop * 100).toFixed(1)}%</div></div>
              </Tooltip>
              <Tooltip text="How variable PSYCHE's predictions were across 30 repeated runs. Lower is more confident.">
                <div><div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>UNCERTAINTY</div><div className="poiret" style={{ fontSize: 22, color: 'var(--gold)', marginTop: 3 }}>{subject.uncertainty.toFixed(3)}</div></div>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!subjects.length) return <div className="loading">LOADING</div>;

  const sameGroup = subjectA && subjectB && subjectA.group === subjectB.group;
  const sameBiotype = subjectA && subjectB && subjectA.biotype === subjectB.biotype;
  const umapDist = subjectA && subjectB
    ? (Math.abs(subjectA.umap_1 - subjectB.umap_1) + Math.abs(subjectA.umap_2 - subjectB.umap_2)).toFixed(2)
    : null;

  return (
    <div className="page">
      <div className="hero-section" style={{ minHeight: 140 }}>
        <div className="hero-bg" style={{ backgroundImage: "url('/mri-grid.jpg')" }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 style={{ fontWeight: 600, fontSize: 32, color: '#e8e0d5', letterSpacing: 3, marginBottom: 4 }}>Subject Comparison</h1>
          <p style={{ fontSize: 10, color: '#e8e0d5', letterSpacing: 1.5 }}>SELECT TWO SUBJECTS TO COMPARE THEIR NEUROBIOLOGICAL PROFILES SIDE BY SIDE</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 0, alignItems: 'start' }}>
        <SubjectCard subject={subjectA} label="Subject A" onChange={setSubjectA} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 24 }}>
          <div className="poiret" style={{ fontSize: 20, color: 'var(--text-dim)', letterSpacing: 2 }}>VS</div>
          {subjectA && subjectB && (
            <>
              <Tooltip text="The distance between these two subjects in PSYCHE's neurobiological space. Smaller means more similar brains.">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>DISTANCE</div>
                  <div className="poiret" style={{ fontSize: 16, color: 'var(--gold)', marginTop: 3 }}>{umapDist}</div>
                </div>
              </Tooltip>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>BIOTYPE</div>
                <div className="poiret" style={{ fontSize: 16, color: sameBiotype ? 'var(--genpop)' : 'var(--patient)', marginTop: 3 }}>{sameBiotype ? 'Match' : 'Differ'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>GROUP</div>
                <div className="poiret" style={{ fontSize: 16, color: sameGroup ? 'var(--genpop)' : 'var(--patient)', marginTop: 3 }}>{sameGroup ? 'Match' : 'Differ'}</div>
              </div>
            </>
          )}
        </div>
        <SubjectCard subject={subjectB} label="Subject B" onChange={setSubjectB} />
      </div>

      {subjectA && subjectB && (
        <div className="glow-card" style={{ marginTop: 20 }}>
          <div className="card-label">What This Comparison Tells Us</div>
          <div style={{ fontSize: 12, color: '#e8e0d5', lineHeight: 1.9 }}>
            {sameBiotype && sameGroup
              ? 'These two subjects share the same clinical group and the same neurobiological biotype. Their brains show similar patterns across structure, connectivity and task response. They represent cases where symptom based diagnosis and biological profiling are in agreement.'
              : !sameBiotype && sameGroup
                ? 'These two subjects share the same clinical group but belong to different neurobiological biotypes. This is one of the most important findings PSYCHE can reveal. Two people with the same psychiatric label may have arrived there through different biological pathways. This has direct implications for treatment. What works for one may not work for the other.'
                : sameBiotype && !sameGroup
                  ? 'These two subjects come from different clinical groups but share the same neurobiological biotype. Their brains look more similar to each other than their diagnoses would suggest. This is the essence of transdiagnostic research. Biological similarity can cut across the boundaries of psychiatric diagnosis.'
                  : 'These two subjects differ in both clinical group and neurobiological biotype. They represent opposite ends of the neurobiological spectrum in this dataset. Comparing them illustrates the full range of biological variation that PSYCHE is able to detect across the population.'}
          </div>
          <InsightCard title="Why does biotype matching matter more than diagnosis matching?">
            The most important question in precision psychiatry is not what diagnosis does this person have but how is this person's brain different from someone who does not share their diagnosis and how is it similar to someone who does. When two people share the same diagnosis but land in different biotypes it suggests their illness may have different biological origins and may respond differently to treatment. When two people have different diagnoses but share the same biotype it suggests their brains may actually be more alike than their symptom profiles would suggest.
          </InsightCard>
        </div>
      )}
    </div>
  );
}