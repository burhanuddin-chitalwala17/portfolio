"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DocumentTypeBadge from "./DocumentTypeBadge";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import SearchField from "../../ui/SearchField";
import { filterByQuery } from "../_lib/search";
import { adminRequest } from "../_lib/adminRequest";

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
  // The document an action is running on, and which action: { id, action } or null.
  const [busy, setBusy] = useState(null);
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
    setBusy({ id: document.id, action: "chat" });
    setError("");
    try {
      await adminRequest(`/api/admin/documents/${document.id}`, {
        method: "PATCH",
        body: { useInChat: turningOn, acknowledgedRisks },
      });
      router.refresh();
    } catch (toggleError) {
      setError(
        toggleError.message ||
          `Couldn't update "${document.name}". Please try again.`,
      );
    } finally {
      setBusy(null);
    }
  };

  const handleResumeToggle = async (document) => {
    setBusy({ id: document.id, action: "resume" });
    setError("");
    try {
      await adminRequest(`/api/admin/documents/${document.id}/site-resume`, {
        method: document.isSiteResume ? "DELETE" : "PUT",
      });
      router.refresh();
    } catch (resumeError) {
      setError(resumeError.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (document) => {
    const warning = document.isSiteResume
      ? `"${document.name}" is the resume visitors see. Deleting it removes the Resume buttons from the site until you choose another. Delete it?`
      : `Delete "${document.name}"? This can't be undone.`;
    if (!window.confirm(warning)) return;
    setBusy({ id: document.id, action: "delete" });
    setError("");
    try {
      await adminRequest(`/api/admin/documents/${document.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setError(`Couldn't delete "${document.name}". Please try again.`);
    } finally {
      setBusy(null);
    }
  };

  const filteredDocuments = useMemo(
    () => filterByQuery(documents, searchTerm, (document) => [document.name, document.type]),
    [documents, searchTerm],
  );

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface shadow-sm">
      <header className="flex flex-col gap-3 border-b border-fg/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">
            Document library
          </h2>
          <p className="text-sm text-fg/60">Search by name or type.</p>
        </div>

        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          label="Search documents"
          placeholder="Search documents…"
          className="w-full max-w-xs"
        />
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
                    {document.isSiteResume && <Badge tone="success" className="mt-1">Site resume</Badge>}
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
                  busy={busy}
                  onDelete={handleDelete}
                  onChatToggle={handleChatToggle}
                  onResumeToggle={handleResumeToggle}
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
                        {document.isSiteResume && <Badge tone="success" className="mt-1">Site resume</Badge>}
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
                        busy={busy}
                        onDelete={handleDelete}
                        onChatToggle={handleChatToggle}
                        onResumeToggle={handleResumeToggle}
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

function DocumentActions({ document, busy, onDelete, onChatToggle, onResumeToggle }) {
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
      {document.hasText && (
        <button
          type="button"
          onClick={() => onChatToggle(document)}
          disabled={busy?.id === document.id}
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
      {document.canBeSiteResume && (
        <button
          type="button"
          onClick={() => onResumeToggle(document)}
          disabled={busy?.id === document.id}
          aria-pressed={document.isSiteResume}
          title={document.isSiteResume ? "Visitors see this PDF when they open your resume" : "Show this PDF to visitors as your resume"}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
            document.isSiteResume
              ? "bg-success/10 text-success hover:bg-success/20"
              : "border border-fg/10 text-fg/60 hover:border-fg/40"
          }`}
        >
          {document.isSiteResume ? "Site resume ✓" : "Use as site resume"}
        </button>
      )}
      <Button variant="danger" size="sm" onClick={() => onDelete(document)} disabled={busy?.id === document.id}>
        {busy?.id === document.id && busy.action === "delete" ? "Deleting…" : "Delete"}
      </Button>
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
