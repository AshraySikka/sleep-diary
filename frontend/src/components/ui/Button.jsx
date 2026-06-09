// components/ui/Button.jsx
// Reusable button component with variants and loading state.

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const base = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
    focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    outline: 'border border-slate-600 hover:border-indigo-500 bg-transparent text-slate-300 hover:text-indigo-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}