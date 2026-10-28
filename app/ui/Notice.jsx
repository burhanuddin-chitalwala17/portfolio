import { TONE_SURFACE } from "./tones";

/**
 * A highlighted block of information: setup hints, warnings, errors. Errors are announced
 * immediately (role="alert"); everything else politely (role="status").
 */
export default function Notice({ tone = "neutral", title, children, className = "" }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${TONE_SURFACE[tone]} ${className}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
    </div>
  );
}
