"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { adminRequest } from "../_lib/adminRequest";

const KIND_STYLES = {
  added: "bg-success/10 text-success",
  removed: "bg-danger/10 text-danger",
  changed: "bg-info/10 text-info",
};

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const VISIBLE_CHANGES = 40;

export default function DraftReview({ draft, changes }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [json, setJson] = useState(() => JSON.stringify(draft.content, null, 2));
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Runs one draft action, refreshing the page on success and listing what went wrong otherwise.
  const call = async (action, request) => {
    setBusy(action);
    setErrors([]);
    try {
      await request();
      router.refresh();
      return true;
    } catch (error) {
      setErrors(error.details ?? [error.message]);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    let content;
    try {
      content = JSON.parse(json);
    } catch (parseError) {
      setErrors([`That isn't valid JSON: ${parseError.message}`]);
      return;
    }
    const saved = await call("save", () => adminRequest(`/api/admin/content/${draft.id}`, { method: "PUT", body: { content } }));
    if (saved) setEditing(false);
  };

  const publish = () => {
    if (!window.confirm("Publish this draft? The live site updates within a few seconds.")) return;
    call("publish", () => adminRequest(`/api/admin/content/${draft.id}/publish`));
  };

  const discard = () => {
    if (!window.confirm("Discard this draft?")) return;
    call("discard", () => adminRequest(`/api/admin/content/${draft.id}`, { method: "DELETE" }));
  };

  const visibleChanges = showAll ? changes : changes.slice(0, VISIBLE_CHANGES);

  return (
    <section className="rounded-2xl border-2 border-accent/60 bg-surface px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-warning">Draft · not live</p>
          <h2 className="mt-1 text-lg font-semibold text-fg">Review changes before publishing</h2>
          <p className="text-xs text-fg/50">Created {dateFormatter.format(new Date(draft.createdAt))}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/preview/${draft.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-fg/20 px-4 py-2 text-sm font-semibold text-fg/80 transition hover:border-fg"
          >
            Preview ↗
          </a>
          <Button
            variant="secondary"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Close editor" : "Edit"}
          </Button>
          <Button
            variant="danger"
            onClick={discard}
            disabled={busy !== null}
          >
            {busy === "discard" ? "Discarding…" : "Discard"}
          </Button>
          <Button
            size="lg"
            onClick={publish}
            disabled={busy !== null || editing}
            title={editing ? "Save or close the editor first" : undefined}
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      {draft.summary && <p className="mt-4 rounded-xl bg-fg/5 px-4 py-3 text-sm text-fg/80">{draft.summary}</p>}

      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-fg/60">
            Edit the content as JSON. It&apos;s checked against the site&apos;s content rules when you save.
          </p>
          <label htmlFor={`draft-json-${draft.id}`} className="sr-only">
            Draft content JSON
          </label>
          <textarea
            id={`draft-json-${draft.id}`}
            value={json}
            onChange={(event) => setJson(event.target.value)}
            spellCheck={false}
            className="h-[60vh] w-full rounded-xl border border-fg/20 bg-canvas p-4 font-mono text-xs leading-relaxed text-fg focus:border-fg focus:outline-none"
          />
          <div>
            <Button
              size="lg"
              onClick={save}
              disabled={busy !== null}
            >
              {busy === "save" ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </div>
      ) : changes.length === 0 ? (
        <p className="mt-4 text-sm text-fg/60">This draft matches the live site. Edit it, or discard it.</p>
      ) : (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-fg">
            {changes.length} change{changes.length === 1 ? "" : "s"} from the live site
          </h3>
          <ul className="mt-3 divide-y divide-fg/5 rounded-xl border border-fg/10">
            {visibleChanges.map((change) => (
              <li key={`${change.section}-${change.path}`} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_STYLES[change.kind]}`}>
                    {change.kind}
                  </span>
                  <span className="text-fg/60">
                    {change.section} › {change.path}
                  </span>
                </div>
                {change.before !== null && <p className="break-words text-fg/50 line-through">{change.before}</p>}
                {change.after !== null && <p className="break-words text-fg">{change.after}</p>}
              </li>
            ))}
          </ul>
          {changes.length > VISIBLE_CHANGES && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-2 text-sm font-semibold text-fg/70 underline underline-offset-2"
            >
              {showAll ? "Show fewer" : `Show all ${changes.length} changes`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
