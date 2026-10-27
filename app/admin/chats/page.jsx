import SetupNotice from "../_components/SetupNotice";
import { isDatabaseConfigured } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";
import { getTranscripts, listConversations } from "../../services/chat/history";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function ChatsPage() {
  let conversations = [];
  let messagesByConversation = new Map();
  let loadError = null;
  try {
    conversations = await listConversations(50);
    const messages = await getTranscripts(conversations.map((conversation) => conversation.id));
    for (const message of messages) {
      const list = messagesByConversation.get(message.conversationId) ?? [];
      list.push(message);
      messagesByConversation.set(message.conversationId, list);
    }
  } catch (error) {
    console.error("Loading chats failed:", error);
    loadError = "Chats couldn't be loaded. Check the database connection.";
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice databaseReady={isDatabaseConfigured()} storageReady={isStorageConfigured()} />
      <div>
        <h2 className="text-lg font-semibold text-fg">Chat transcripts</h2>
        <p className="text-sm text-fg/60">
          The 50 most recent conversations with the portfolio chat. Visitors are identified only by an anonymous hash.
        </p>
      </div>
      {loadError ? (
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4 text-sm text-danger">
          {loadError}
        </p>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-fg/20 bg-surface px-5 py-10 text-center text-sm text-fg/60">
          No conversations yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((conversation) => {
            const messages = messagesByConversation.get(conversation.id) ?? [];
            const opener = messages.find((message) => message.role === "user")?.content ?? "(no messages)";
            return (
              <li key={conversation.id} className="rounded-2xl border border-fg/10 bg-surface shadow-sm">
                <details>
                  <summary className="flex cursor-pointer list-none flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0 truncate font-medium text-fg">{opener}</span>
                    <span className="shrink-0 text-xs text-fg/50">
                      {conversation.messageCount} messages · {dateFormatter.format(conversation.lastMessageAt)} · visitor{" "}
                      {conversation.ipHash.slice(0, 6)}
                    </span>
                  </summary>
                  <ol className="flex flex-col gap-2 border-t border-fg/10 px-5 py-4">
                    {messages.map((message) => (
                      <li
                        key={message.id}
                        className={`max-w-[90%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                          message.role === "user" ? "self-end bg-fg text-inverse" : "self-start bg-fg/5 text-fg/90"
                        }`}
                      >
                        {message.content}
                      </li>
                    ))}
                  </ol>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
