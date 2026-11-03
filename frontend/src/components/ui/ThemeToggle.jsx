// components/ui/ThemeToggle.jsx
// -----------------------------------------------------------------------
// Light / dark mode button. One component, three looks:
//   variant="row"   — full-width row with a switch (desktop sidebar)
//   variant="nav"   — compact icon-only item (mobile bottom bar)
//   variant="icon"  — round floating button (login / register pages)
// -----------------------------------------------------------------------

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ variant = 'icon' }) {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Moon : Sun;
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (variant === 'row') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={label}
        title={label}
        onClick={toggleTheme}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '12px', width: '100%',
          background: 'transparent', border: '1px solid transparent',
          fontSize: '14px', fontWeight: '500', color: 'var(--sd-text-muted)',
          cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--sd-accent)';
          e.currentTarget.style.background = 'var(--sd-em-10)';
          e.currentTarget.style.borderColor = 'var(--sd-em-20)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--sd-text-muted)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <Icon size={17} />
        <span style={{ flex: 1, textAlign: 'left' }}>Dark mode</span>
        {/* Switch track */}
        <span
          aria-hidden="true"
          style={{
            position: 'relative', width: '34px', height: '20px', borderRadius: '10px', flexShrink: 0,
            background: isDark ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--sd-ink-10)',
            transition: 'background 0.2s ease',
          }}
        >
          <span style={{
            position: 'absolute', top: '2px', left: isDark ? '16px' : '2px',
            width: '16px', height: '16px', borderRadius: '50%', background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s ease',
          }} />
        </span>
      </button>
    );
  }

  if (variant === 'nav') {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggleTheme}
        style={{
          // Icon-only and compact so six items still fit on 360px-wide phones
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px 8px', borderRadius: '10px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--sd-text-subtle)',
        }}
      >
        <Icon size={20} />
      </button>
    );
  }

  // Floating round icon button
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        right: '16px',
        zIndex: 50,
        width: '40px', height: '40px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--sd-surface-80)',
        border: '1px solid var(--sd-em-20)',
        color: 'var(--sd-accent)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 14px var(--sd-shadow-50)',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sd-em-15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sd-surface-80)'; }}
    >
      <Icon size={18} />
    </button>
  );
}
