import Notice from "../../ui/Notice";

/** A failed-to-load notice for admin pages, with the underlying error for troubleshooting. */
export default function LoadError({ message, detail }) {
  return (
    <Notice tone="danger">
      <p>{message}</p>
      {detail && <p className="mt-2 break-words font-mono text-xs opacity-80">Details: {detail}</p>}
    </Notice>
  );
}
