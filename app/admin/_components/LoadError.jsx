/** A failed-to-load notice for admin pages, with the underlying error for troubleshooting. */
export default function LoadError({ message, detail }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4 text-sm text-danger">
      <p>{message}</p>
      {detail && <p className="mt-2 break-words font-mono text-xs text-danger/80">Details: {detail}</p>}
    </div>
  );
}
