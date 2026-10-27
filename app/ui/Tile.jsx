export default function Tile({
  label,
  value,
  helper,
  className = "",
  valueClassName = "",
  children,
}) {
  return (
    <div
      className={`rounded-3xl border border-fg/10 bg-surface px-5 py-6 shadow-sm ${className}`}
    >
      {label ? (
        <p className="text-xs uppercase tracking-widest text-fg/40">
          {label}
        </p>
      ) : null}

      {value !== undefined ? (
        <p
          className={`mt-2 text-3xl font-semibold text-fg ${valueClassName}`}
        >
          {value}
        </p>
      ) : null}

      {helper ? (
        <p className="mt-2 text-sm text-fg/60">{helper}</p>
      ) : null}

      {children}
    </div>
  );
}

