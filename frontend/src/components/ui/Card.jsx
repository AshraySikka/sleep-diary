// components/ui/Card.jsx

export default function Card({
  children,
  className = '',
  padding = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800 border border-slate-700 rounded-2xl
        ${padding ? 'p-5' : ''}
        ${onClick ? 'cursor-pointer hover:border-indigo-500 transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}