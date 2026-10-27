"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function VersionHistory({ versions }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const restore = async (version) => {
    if (!window.confirm("Make this version live again? The current version stays in the history.")) return;
    setBusyId(version.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/content/${version.id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Couldn't restore that version. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface shadow-sm">
      <header className="border-b border-fg/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-fg">Version history</h2>
        <p className="text-sm text-fg/60">
          Every published version is kept. Restore one to roll the site back.
        </p>
      </header>
      {error && (
        <p role="alert" className="border-b border-fg/10 bg-danger/5 px-5 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {versions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-fg/60">
          Nothing published from here yet. The site is showing its built-in content.
        </p>
      ) : (
        <ul className="divide-y divide-fg/5">
          {versions.map((version) => {
            const live = version.status === "published";
            return (
              <li key={version.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        live ? "bg-success/10 text-success" : "bg-fg/5 text-fg/60"
                      }`}
                    >
                      {live ? "Live" : "Previous"}
                    </span>
                    <span className="text-sm text-fg/60">
                      {dateFormatter.format(new Date(version.publishedAt ?? version.createdAt))}
                    </span>
                  </div>
                  {version.summary && <p className="mt-2 text-sm text-fg/80">{version.summary}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/preview/${version.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-fg/20 px-3 py-1.5 text-xs font-semibold text-fg/70 transition hover:border-fg"
                  >
                    Preview ↗
                  </a>
                  {!live && (
                    <button
                      type="button"
                      onClick={() => restore(version)}
                      disabled={busyId !== null}
                      className="rounded-full bg-fg px-3 py-1.5 text-xs font-semibold text-inverse transition hover:bg-fg/80 disabled:opacity-50"
                    >
                      {busyId === version.id ? "Restoring…" : "Restore"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
