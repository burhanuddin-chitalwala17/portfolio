import LoadError from "../_components/LoadError";
import QueryList from "../_components/QueryList";
import SetupNotice from "../_components/SetupNotice";
import { isDatabaseConfigured, withTimeout, describeDatabaseError } from "../../services/db/client";
import { isStorageConfigured } from "../../services/storage/storage";
import { listVisitorQueries } from "../../services/queries/visitorQueries";

export default async function InboxPage() {
  let queries = [];
  let loadError = null;
  try {
    queries = await withTimeout(listVisitorQueries(), 8000);
  } catch (error) {
    console.error("Loading the inbox failed:", error);
    loadError = { message: "The inbox couldn't be loaded. Check the database connection.", detail: describeDatabaseError(error) };
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupNotice databaseReady={isDatabaseConfigured()} storageReady={isStorageConfigured()} />
      <div>
        <h2 className="text-lg font-semibold text-fg">Visitor questions</h2>
        <p className="text-sm text-fg/60">
          Questions the portfolio chat couldn&apos;t answer from your documents land here.
        </p>
      </div>
      {loadError ? (
        <LoadError {...loadError} />
      ) : (
        <QueryList queries={queries} />
      )}
    </div>
  );
}
