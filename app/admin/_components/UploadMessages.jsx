/** Results of an upload: successes in green, problems in red. */
export default function UploadMessages({ messages }) {
  if (!messages.items.length) return null;
  return (
    <ul
      role="status"
      className={`mt-4 space-y-1 rounded-xl px-4 py-3 text-sm ${
        messages.tone === "error" ? "bg-danger/5 text-danger" : "bg-success/5 text-success"
      }`}
    >
      {messages.items.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
