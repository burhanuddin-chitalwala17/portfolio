export default function SetupNotice({ databaseReady, storageReady }) {
  if (databaseReady && storageReady) return null;

  const missing = [
    !databaseReady && "DATABASE_URL",
    !storageReady && "S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET",
  ].filter(Boolean);

  return (
    <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      <p className="font-semibold">Storage isn&apos;t connected yet</p>
      <p className="mt-1">
        Uploads and the inbox switch on once these are set in Vercel → Settings → Environment Variables:{" "}
        <span className="font-mono text-xs">{missing.join(", ")}</span>. The resume on the site keeps working meanwhile.
      </p>
    </div>
  );
}
