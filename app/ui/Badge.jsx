import { TONE_PILL } from "./tones";

/** A small rounded label, such as "Private" or "Text". */
export default function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_PILL[tone]} ${className}`}>
      {children}
    </span>
  );
}
