import React from 'react';

export default function Tooltip({ text, children }) {
  return (
    <div className="tooltip-wrap">
      {children}
      <div className="tooltip-icon">?</div>
      <div className="tooltip-box">{text}</div>
    </div>
  );
}