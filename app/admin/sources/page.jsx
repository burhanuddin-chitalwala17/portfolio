import GithubSource from "../_components/GithubSource";
import LeetcodeSource from "../_components/LeetcodeSource";
import LinkedinImport from "../_components/LinkedinImport";
import LoadError from "../_components/LoadError";
import SetupNotice from "../_components/SetupNotice";
import { isDatabaseConfigured, readWithRetry, describeDatabaseError } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";
import { getPublishedContent } from "../../services/content/siteContent";
import { getGithubSettings, getGithubTokenStatus } from "../../services/github/settings";
import { getLeetcodeSettings, usernameFromProfileLink } from "../../services/leetcode/settings";
import { canStoreSecrets } from "../../services/settings/secrets";

export default async function SourcesPage() {
  const databaseReady = isDatabaseConfigured();
  const storageReady = isStorageConfigured();
  const { content } = await getPublishedContent();
  let loaded = null;
  let loadError = null;
  try {
    const [github, tokenStatus, leetcode] = await readWithRetry(
      () => Promise.all([getGithubSettings(), getGithubTokenStatus(), getLeetcodeSettings()]),
      { label: "Loading sources" }
    );
    loaded = { github, tokenStatus, leetcode };
  } catch (error) {
    console.error("Loading sources failed:", error);
    loadError = { message: "Sources couldn't be loaded. Check the database connection.", detail: describeDatabaseError(error) };
  }

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={storageReady} />
      <div>
        <h2 className="text-lg font-semibold text-fg">Sources</h2>
        <p className="text-sm text-fg/60">
          Where the portfolio chat can look beyond your site and documents: your code on GitHub, live LeetCode stats and
          your LinkedIn profile.
        </p>
      </div>
      {loadError ? (
        <LoadError {...loadError} />
      ) : (
        <>
          <GithubSource
            initialSettings={{
              ...loaded.github,
              username: loaded.github.username || content.profile.links.github.split("github.com/")[1]?.split("/")[0] || "",
            }}
            tokenStatus={loaded.tokenStatus}
            enabled={databaseReady}
            canSaveToken={databaseReady && canStoreSecrets()}
          />
          <LeetcodeSource
            initialSettings={{
              ...loaded.leetcode,
              username: loaded.leetcode.username || usernameFromProfileLink(content.profile.links.leetcode),
            }}
            enabled={databaseReady}
          />
          <LinkedinImport enabled={databaseReady && storageReady} profileUrl={content.profile.links.linkedin} />
        </>
      )}
    </div>
  );
}
