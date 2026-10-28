import DocumentList from "./_components/DocumentList";
import FileUploadPanel from "./_components/FileUploadPanel";
import SetupNotice from "./_components/SetupNotice";
import Tile from "../ui/Tile";
import { getDocuments } from "../services/documents/getDocuments";
import { isDatabaseConfigured, withTimeout } from "../services/db/client";
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
    const [loadedDocuments, conversations, queries] = await withTimeout(
      Promise.all([getDocuments(), countConversationsThisWeek(), listVisitorQueries()]),
      8000
    );
    documents = loadedDocuments;
    chatsThisWeek = conversations;
    openQuestions = queries.filter((query) => query.status === QUERY_STATUSES.OPEN).length;
  } catch (error) {
    console.error("Loading documents failed:", error);
    loadError = "The document library couldn't be loaded. Check the database connection.";
  }

  const chatDocuments = documents.filter((document) => document.useInChat);
  const chatTokens = Math.round(chatDocuments.reduce((total, document) => total + (document.characters ?? 0), 0) / 4);

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={storageReady} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Documents" value={documents.length} helper="Including the resume on the site" />
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
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4 text-sm text-danger">
          {loadError}
        </p>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
