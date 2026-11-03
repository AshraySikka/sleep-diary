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
        <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--sd-text-body)' }}>
          {label}
          {required && <span style={{ color: 'var(--sd-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'var(--sd-inset-30)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--sd-em-15)',
          color: 'var(--sd-text-strong)',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          colorScheme: 'dark',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--sd-em-50)';
          e.target.style.boxShadow = '0 0 0 3px var(--sd-em-08)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'var(--sd-em-15)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {hint && !error && (
        <p style={{ fontSize: '12px', color: 'var(--sd-text-muted)' }}>{hint}</p>
      )}
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--sd-danger)' }}>{error}</p>
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
        <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--sd-text-body)' }}>
          {label}
          {required && <span style={{ color: 'var(--sd-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'var(--sd-inset-30)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--sd-em-15)',
          color: 'var(--sd-text-strong)',
          outline: 'none',
        }}
        {...props}
      >
        <option value="" style={{ background: 'var(--sd-surface-solid)' }}>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--sd-surface-solid)' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p style={{ fontSize: '12px', color: 'var(--sd-text-muted)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: 'var(--sd-danger)' }}>{error}</p>}
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
        <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--sd-text-body)' }}>
          {label}
          {required && <span style={{ color: 'var(--sd-danger)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          background: 'var(--sd-inset-30)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--sd-em-15)',
          color: 'var(--sd-text-strong)',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
        }}
        {...props}
      />
      {hint && !error && <p style={{ fontSize: '12px', color: 'var(--sd-text-muted)' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: 'var(--sd-danger)' }}>{error}</p>}
    </div>
  );
}

export default Input;