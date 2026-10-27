import DocumentList from "./_components/DocumentList";
import FileUploadPanel from "./_components/FileUploadPanel";
import SetupNotice from "./_components/SetupNotice";
import Tile from "../ui/Tile";
import { getDocuments } from "../services/documents/getDocuments";
import { isDatabaseConfigured } from "../services/db/client";
import { isStorageConfigured } from "../services/storage/storage";

function formatMegabytes(bytes = 0) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function AdminPage() {
  const databaseReady = isDatabaseConfigured();
  const storageReady = isStorageConfigured();
  let documents = [];
  let loadError = null;
  try {
    documents = await getDocuments();
  } catch (error) {
    console.error("Loading documents failed:", error);
    loadError = "The document library couldn't be loaded. Check the database connection.";
  }

  const uploadedCount = documents.filter((document) => document.source === "upload").length;
  const totalSize = documents.reduce((accumulator, document) => accumulator + document.sizeInBytes, 0);

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={storageReady} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Total documents" value={documents.length} helper="Including the resume on the site" />
        <Tile label="Uploaded" value={uploadedCount} helper="Through this panel" />
        <Tile label="Storage footprint" value={formatMegabytes(totalSize)} helper="Approximate size" />
      </section>

      <FileUploadPanel enabled={databaseReady && storageReady} />

      {loadError ? (
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {loadError}
        </p>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
