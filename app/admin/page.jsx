import LoadError from "./_components/LoadError";
import DocumentList from "./_components/DocumentList";
import FileUploadPanel from "./_components/FileUploadPanel";
import SetupNotice from "./_components/SetupNotice";
import Tile from "../ui/Tile";
import { getDocuments } from "../services/documents/getDocuments";
import { isDatabaseConfigured, readWithRetry, describeDatabaseError } from "../services/db/client";
import { isStorageConfigured } from "../services/storage/storage";
import { countConversationsThisWeek } from "../services/chat/history";
import { listVisitorQueries, QUERY_STATUSES } from "../services/queries/visitorQueries";

export default async function AdminPage() {
  const databaseReady = isDatabaseConfigured();
  const storageReady = isStorageConfigured();
  let documents = [];
  let chatsThisWeek = 0;
  let openQuestions = 0;
  let loadError = null;
  try {
    const [loadedDocuments, conversations, queries] = await readWithRetry(
      () => Promise.all([getDocuments(), countConversationsThisWeek(), listVisitorQueries()]),
      { label: "Loading documents" }
    );
    documents = loadedDocuments;
    chatsThisWeek = conversations;
    openQuestions = queries.filter((query) => query.status === QUERY_STATUSES.OPEN).length;
  } catch (error) {
    console.error("Loading documents failed:", error);
    loadError = { message: "The document library couldn't be loaded. Check the database connection.", detail: describeDatabaseError(error) };
  }

  const chatDocuments = documents.filter((document) => document.useInChat);
  const chatTokens = Math.round(chatDocuments.reduce((total, document) => total + (document.characters ?? 0), 0) / 4);

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={storageReady} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Documents" value={documents.length} helper="Uploaded files and notes" />
        <Tile
          label="Used by chat"
          value={chatDocuments.length}
          helper={`About ${chatTokens.toLocaleString("en")} tokens, plus the site content`}
        />
        <Tile label="Chats this week" value={chatsThisWeek} helper="Conversations started" />
        <Tile label="Open questions" value={openQuestions} helper="Waiting in the inbox" />
      </section>

      <FileUploadPanel enabled={databaseReady && storageReady} />

      {loadError ? (
        <LoadError {...loadError} />
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
