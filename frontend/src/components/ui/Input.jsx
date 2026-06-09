export function Input({
  label,
  error,
  hint,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.3)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(16,185,129,0.15)',
          color: '#f0fdf4',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          colorScheme: 'dark',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(16,185,129,0.5)';
          e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.15)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {hint && !error && (
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  required = false,
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.3)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(16,185,129,0.15)',
          color: '#f0fdf4',
          outline: 'none',
        }}
        {...props}
      >
        <option value="" style={{ background: '#0f1e18' }}>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#0f1e18' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  required = false,
  rows = 3,
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.3)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(16,185,129,0.15)',
          color: '#f0fdf4',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
        }}
        {...props}
      />
      {hint && !error && <p style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export default Input;