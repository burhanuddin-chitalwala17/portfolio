import LoadError from "../_components/LoadError";
import Link from "next/link";
import ContentGenerator from "../_components/ContentGenerator";
import DraftReview from "../_components/DraftReview";
import VersionHistory from "../_components/VersionHistory";
import SetupNotice from "../_components/SetupNotice";
import { diffContent } from "../../services/content/diff";
import { CONTENT_STATUSES, getPublishedContent, listContentVersions } from "../../services/content/siteContent";
import { getDocuments } from "../../services/documents/getDocuments";
import { isDatabaseConfigured, readWithRetry, describeDatabaseError } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";
import { resolveAiTask } from "../../services/ai";

export default async function ContentPage() {
  const databaseReady = isDatabaseConfigured();
  const storageReady = isStorageConfigured();
  const aiReady = Boolean(await resolveAiTask("content").catch(() => null));

  let versions = [];
  let resumeOptions = [];
  let loadError = null;
  try {
    const [loadedVersions, documents] = await readWithRetry(() => Promise.all([listContentVersions(), getDocuments()]), {
      label: "Loading content versions",
    });
    versions = loadedVersions;
    resumeOptions = documents
      .filter((document) => document.source === "upload" && document.hasText)
      .map((document) => ({ id: document.id, name: document.name }));
  } catch (error) {
    console.error("Loading content versions failed:", error);
    loadError = { message: "Content versions couldn't be loaded. Check the database connection.", detail: describeDatabaseError(error) };
  }
  const { content: liveContent } = await getPublishedContent();
  const drafts = versions.filter((version) => version.status === CONTENT_STATUSES.DRAFT);
  const history = versions.filter((version) => version.status !== CONTENT_STATUSES.DRAFT);

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={storageReady} />
      {databaseReady && !aiReady && (
        <p role="status" className="rounded-2xl border border-warning/20 bg-warning/5 px-5 py-4 text-sm text-warning">
          Choose a provider, model and API key for resume drafts in{" "}
          <Link href="/admin/ai" className="font-semibold underline">
            AI settings
          </Link>{" "}
          to generate drafts from a resume. Editing by hand works without it.
        </p>
      )}

      <ContentGenerator
        enabled={databaseReady && storageReady && aiReady}
        manualEditEnabled={databaseReady}
        resumeOptions={resumeOptions}
      />

      {loadError && (
        <LoadError {...loadError} />
      )}

      {drafts.map((draft) => (
        <DraftReview
          key={draft.id}
          draft={{
            id: draft.id,
            summary: draft.summary,
            createdAt: draft.createdAt.toISOString(),
            content: draft.content,
          }}
          changes={diffContent(liveContent, draft.content)}
        />
      ))}

      <VersionHistory
        versions={history.map((version) => ({
          id: version.id,
          status: version.status,
          summary: version.summary,
          createdAt: version.createdAt.toISOString(),
          publishedAt: version.publishedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
