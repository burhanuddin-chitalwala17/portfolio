"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DocumentTypeBadge from "./DocumentTypeBadge";

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatFileSize(bytes = 0) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export default function DocumentList({
  documents = [],
  emptyStateMessage = "No documents uploaded yet.",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChatToggle = async (document) => {
    const turningOn = !document.useInChat;
    let acknowledgedRisks = false;
    if (turningOn && document.sensitiveFindings.length) {
      const kinds = document.sensitiveFindings
        .map((finding) => finding.label.toLowerCase())
        .join(", ");
      acknowledgedRisks = window.confirm(
        `"${document.name}" looks like it contains: ${kinds}.\n\nVisitors may be able to get the chat to repeat what's in this file. Detected items stay hidden from the chat, but anything the scan missed won't be.\n\nLet the chat use it anyway?`,
      );
      if (!acknowledgedRisks) return;
    }
    setDeletingId(document.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useInChat: turningOn, acknowledgedRisks }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      router.refresh();
    } catch (toggleError) {
      setError(
        toggleError.message ||
          `Couldn't update "${document.name}". Please try again.`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete "${document.name}"? This can't be undone.`))
      return;
    setDeletingId(document.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/documents/${document.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError(`Couldn't delete "${document.name}". Please try again.`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments = useMemo(() => {
    const trimmedQuery = searchTerm.trim().toLowerCase();
    if (!trimmedQuery) {
      return documents;
    }

    return documents.filter((document) => {
      const haystack = [document.name, document.type, document.id]
        .join(" ")
        .toLowerCase();

      return haystack.includes(trimmedQuery);
    });
  }, [documents, searchTerm]);

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface shadow-sm">
      <header className="flex flex-col gap-3 border-b border-fg/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">
            Document library
          </h2>
          <p className="text-sm text-fg/60">Search by name or type.</p>
        </div>

        <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-fg/10 bg-surface px-4 py-2 text-sm text-fg/60 focus-within:border-fg/40">
          <span className="text-fg/40">🔍</span>
          <input
            type="search"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-fg/80 outline-none"
          />
        </label>
      </header>

      {error && (
        <p
          role="alert"
          className="border-b border-fg/10 bg-danger/5 px-5 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {filteredDocuments.length ? (
        <>
          <ul className="divide-y divide-fg/5 md:hidden">
            {filteredDocuments.map((document) => (
              <li key={document.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-fg">
                      {document.name}
                    </p>
                    <SensitiveBadge findings={document.sensitiveFindings} />
                    <p className="mt-0.5 text-xs text-fg/60">
                      {formatFileSize(document.sizeInBytes)} ·{" "}
                      {dateFormatter.format(new Date(document.updatedAt))}
                    </p>
                  </div>
                  <DocumentTypeBadge type={document.type} />
                </div>
                <DocumentActions
                  document={document}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                  onChatToggle={handleChatToggle}
                />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-fg/10 text-left">
              <thead className="bg-canvas text-sm uppercase tracking-wide text-fg/60">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Size
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Updated
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fg/5 text-sm text-fg/70">
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-fg">
                          {document.name}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-fg/40">
                          {document.source === "upload"
                            ? "Uploaded"
                            : "Ships with the site"}
                        </span>
                        <SensitiveBadge findings={document.sensitiveFindings} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <DocumentTypeBadge type={document.type} />
                    </td>
                    <td className="px-3 py-3">
                      {formatFileSize(document.sizeInBytes)}
                    </td>
                    <td className="px-3 py-3">
                      {dateFormatter.format(new Date(document.updatedAt))}
                    </td>
                    <td className="px-3 py-3">
                      <DocumentActions
                        document={document}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                        onChatToggle={handleChatToggle}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-fg/60">
          {emptyStateMessage}
        </div>
      )}
    </section>
  );
}

function DocumentActions({ document, deletingId, onDelete, onChatToggle }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={document.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-fg/10 px-3 py-1 text-xs font-semibold text-fg/70 transition hover:border-fg/20 hover:text-fg/80"
      >
        Preview
      </a>
      <a
        href={document.downloadUrl}
        download
        className="rounded-full bg-fg px-3 py-1 text-xs font-semibold text-surface transition hover:bg-fg/80"
      >
        Download
      </a>
      {document.source === "upload" && document.hasText && (
        <button
          type="button"
          onClick={() => onChatToggle(document)}
          disabled={deletingId === document.id}
          aria-pressed={document.useInChat}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
            document.useInChat
              ? "bg-success/10 text-success hover:bg-success/20"
              : "border border-fg/10 text-fg/60 hover:border-fg/40"
          }`}
        >
          {document.useInChat ? "Used by chat ✓" : "Not in chat"}
        </button>
      )}
      {document.source === "upload" && (
        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={deletingId === document.id}
          className="rounded-full border border-danger/20 px-3 py-1 text-xs font-semibold text-danger transition hover:border-danger/40 disabled:opacity-50"
        >
          {deletingId === document.id ? "Deleting…" : "Delete"}
        </button>
      )}
    </div>
  );
}

function SensitiveBadge({ findings = [] }) {
  if (!findings.length) return null;
  return (
    <span
      className="mt-1 inline-flex w-fit items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"
      title={findings
        .map((finding) => `${finding.label} ×${finding.count}`)
        .join(", ")}
    >
      ⚠ Sensitive:{" "}
      {findings.map((finding) => finding.label.toLowerCase()).join(", ")}
    </span>
  );
}
