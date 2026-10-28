/*
 * Form controls. They share one look (CONTROL) and keep text at 16px (text-input) so phones
 * don't zoom in on focus.
 */

export const CONTROL =
  "w-full rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input text-fg placeholder:text-fg/40 focus:border-fg/50 focus:outline-none disabled:opacity-50";

/** A label above its control, with optional hint text below. */
export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-fg/80 ${className}`}>
      {label}
      {children}
      {hint && <span className="text-xs text-fg/50">{hint}</span>}
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return <input className={`${CONTROL} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`${CONTROL} leading-relaxed ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${CONTROL} ${className}`} {...props}>
      {children}
    </select>
  );
}

/** A checkbox with its label. Pass `ref` through for indeterminate state. */
export function Checkbox({ label, className = "", ref, ...props }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 text-sm text-fg/80 ${className}`}>
      <input ref={ref} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-fg" {...props} />
      <span>{label}</span>
    </label>
  );
}
