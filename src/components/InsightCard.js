import React, { useState } from 'react';

export default function InsightCard({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="insight-card" style={{ marginTop: 16 }}>
      <div className="insight-header" onClick={() => setOpen(!open)}>
        <span className="insight-title">{title}</span>
        <div className="insight-toggle" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>+</div>
      </div>
      <div className={`insight-body ${open ? 'open' : ''}`}>{children}</div>
    </div>
  );
}