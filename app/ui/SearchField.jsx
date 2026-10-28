/** A labelled search box. `label` is for screen readers; the placeholder shows visually. */
export default function SearchField({ value, onChange, label, placeholder = "Search…", className = "" }) {
  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-fg/15 bg-surface px-4 py-2 text-fg/60 focus-within:border-fg/40 ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-fg/40" aria-hidden>
        <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m14 14 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-input text-fg/80 outline-none"
      />
    </label>
  );
}
