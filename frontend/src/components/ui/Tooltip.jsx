// components/ui/Tooltip.jsx
// The (i) icon with hover tooltip for formula descriptions.

import { useState } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text, className = '' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-slate-500 hover:text-indigo-400 transition-colors"
        aria-label="Formula information"
      >
        <Info size={14} />
      </button>
      {visible && (
        <div className="
          absolute z-50 bottom-6 left-1/2 -translate-x-1/2
          w-72 p-3 rounded-xl text-xs text-slate-300
          bg-slate-900 border border-slate-700
          shadow-xl shadow-black/50
        ">
          {text}
          <div className="
            absolute top-full left-1/2 -translate-x-1/2
            border-4 border-transparent border-t-slate-700
          " />
        </div>
      )}
    </div>
  );
}