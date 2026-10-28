import { TONE_TEXT } from "./tones";

/** A one-line result such as "Saved." or an error, announced to screen readers. `message`: { tone, text } */
export default function StatusMessage({ message, className = "text-sm" }) {
  if (!message) return null;
  return (
    <p role="status" className={`${TONE_TEXT[message.tone] ?? TONE_TEXT.neutral} ${className}`}>
      {message.text}
    </p>
  );
}
