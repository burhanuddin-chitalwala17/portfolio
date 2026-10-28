/**
 * A row of mutually exclusive options shown as tabs, e.g. "Upload files | Write or paste text".
 * @param {{ options: [value: string, label: string][], value: string, onChange: (value: string) => void, label: string }} props
 */
export default function SegmentedControl({ options, value, onChange, label, className = "" }) {
  return (
    <div role="tablist" aria-label={label} className={`inline-flex w-fit rounded-full border border-fg/15 p-1 text-sm ${className}`}>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          role="tab"
          aria-selected={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={`rounded-full px-4 py-1.5 font-medium transition ${
            value === optionValue ? "bg-fg text-inverse" : "text-fg/70 hover:text-fg"
          }`}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  );
}
