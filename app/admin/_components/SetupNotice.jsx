import Notice from "../../ui/Notice";

export default function SetupNotice({ databaseReady, storageReady }) {
  if (databaseReady && storageReady) return null;

  const missing = [
    !databaseReady && "DATABASE_URL",
    !storageReady && "S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET",
  ].filter(Boolean);

  return (
    <Notice tone="warning" title="Storage isn't connected yet">
      Uploads and the inbox switch on once these are set in Vercel → Settings → Environment Variables:{" "}
      <span className="font-mono text-xs">{missing.join(", ")}</span>. The resume on the site keeps working meanwhile.
    </Notice>
  );
}
