// components/ui/Tooltip.jsx
// The (i) icon with hover tooltip for formula descriptions.

import { useState } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text, className = '' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} className={className}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', display: 'flex', alignItems: 'center' }}
        aria-label="Formula information"
      >
        <Info size={14} />
      </button>
      {visible && (
        <>
          {/* backdrop to dismiss on mobile tap-outside */}
          <div
            onClick={() => setVisible(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          />
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            background: '#0f1e18',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#9ca3af',
            zIndex: 99,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            {text}
          </div>
        </>
      )}
    </div>
  );
}