import ModelSettings from "../_components/ModelSettings";
import ProviderKeys from "../_components/ProviderKeys";
import SetupNotice from "../_components/SetupNotice";
import { isDatabaseConfigured, withTimeout } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";
import { getAiSettings, getKeyStatuses } from "../../services/ai/settings";
import { canStoreSecrets } from "../../services/ai/secrets";

export default async function AiSettingsPage() {
  const databaseReady = isDatabaseConfigured();
  let settings = null;
  let keyStatuses = null;
  let loadError = null;
  try {
    [settings, keyStatuses] = await withTimeout(Promise.all([getAiSettings(), getKeyStatuses()]), 8000);
  } catch (error) {
    console.error("Loading AI settings failed:", error);
    loadError = "AI settings couldn't be loaded. Check the database connection.";
  }

  return (
    <div className="flex flex-col gap-8">
      <SetupNotice databaseReady={databaseReady} storageReady={isStorageConfigured()} />
      <div>
        <h2 className="text-lg font-semibold text-fg">AI providers</h2>
        <p className="text-sm text-fg/60">
          Choose which provider and model power the chat and the resume drafts, and manage their API keys. Changes apply
          straight away, no redeploy needed.
        </p>
      </div>
      {loadError ? (
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4 text-sm text-danger">
          {loadError}
        </p>
      ) : (
        <>
          <ModelSettings initialSettings={settings} keyStatuses={keyStatuses} enabled={databaseReady} />
          <ProviderKeys keyStatuses={keyStatuses} enabled={databaseReady && canStoreSecrets()} />
        </>
      )}
    </div>
  );
}
