import Link from "next/link";
import ChatProfileEditor from "../_components/chatProfile/ChatProfileEditor";
import ChatTests from "../_components/chatProfile/ChatTests";
import LoadError from "../_components/LoadError";
import SetupNotice from "../_components/SetupNotice";
import Notice from "../../ui/Notice";
import { resolveAiTask } from "../../services/ai";
import { getPublishedContent } from "../../services/content/siteContent";
import { getChatProfile } from "../../services/chatProfile/profile";
import { getEvalResults, getEvalSet } from "../../services/chatProfile/evals";
import { describeDatabaseError, isDatabaseConfigured, readWithRetry } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";

export default async function ChatProfilePage() {
  const databaseReady = isDatabaseConfigured();
  const [{ content }, contentAi, chatAi] = await Promise.all([
    getPublishedContent(),
    resolveAiTask("content").catch(() => null),
    resolveAiTask("chat").catch(() => null),
  ]);

  let loaded = null;
  let loadError = null;
  if (databaseReady) {
    try {
      const [profile, cases, results] = await readWithRetry(
        () => Promise.all([getChatProfile(), getEvalSet(), getEvalResults()]),
        { label: "Loading the chat profile" }
      );
      loaded = { profile, cases, results };
    } catch (error) {
      console.error("Loading the chat profile failed:", error);
      loadError = { message: "The chat profile couldn't be loaded. Check the database connection.", detail: describeDatabaseError(error) };
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={isStorageConfigured()} />
      <div>
        <h2 className="text-lg font-semibold text-fg">Chat profile</h2>
        <p className="max-w-3xl text-sm text-fg/60">
          What the portfolio chat knows about you beyond the site&apos;s bullet points: your pitch, the story behind each
          project, your skills with evidence and your answers to common questions. It&apos;s the chat&apos;s primary source,
          so the more substance here, the better it represents you. Visitors can get the chat to repeat anything here.
        </p>
      </div>
      {databaseReady && !contentAi && (
        <Notice tone="warning">
          The interview, drafts and grading use the drafts model. Choose one in{" "}
          <Link href="/admin/ai" className="font-semibold underline">
            AI settings
          </Link>
          . Editing by hand works without it.
        </Notice>
      )}
      {loadError && <LoadError {...loadError} />}
      {loaded && (
        <>
          <ChatProfileEditor
            initialProfile={loaded.profile}
            projects={content.projects.map(({ id, title, subtitle }) => ({ id, title, subtitle }))}
            enabled={databaseReady}
            aiEnabled={Boolean(contentAi)}
          />
          <ChatTests initialCases={loaded.cases} initialResults={loaded.results} enabled={databaseReady && Boolean(contentAi && chatAi)} />
        </>
      )}
    </div>
  );
}
