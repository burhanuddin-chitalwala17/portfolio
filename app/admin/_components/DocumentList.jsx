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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Document library
          </h2>
          <p className="text-sm text-slate-500">Search by name or type.</p>
        </div>

        <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 focus-within:border-slate-400">
          <span className="text-slate-400">🔍</span>
          <input
            type="search"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-slate-700 outline-none"
          />
        </label>
      </header>

      {error && (
        <p
          role="alert"
          className="border-b border-slate-200 bg-rose-50 px-5 py-3 text-sm text-rose-800"
        >
          {error}
        </p>
      )}

      {filteredDocuments.length ? (
        <>
          <ul className="divide-y divide-slate-100 md:hidden">
            {filteredDocuments.map((document) => (
              <li key={document.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-slate-900">
                      {document.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
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
                />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-sm uppercase tracking-wide text-slate-500">
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
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {document.name}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-slate-400">
                          {document.source === "upload"
                            ? "Uploaded"
                            : "Ships with the site"}
                        </span>
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
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          {emptyStateMessage}
        </div>
      )}
    </section>
  );
}

function DocumentActions({ document, deletingId, onDelete }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={document.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
      >
        Preview
      </a>
      <a
        href={document.downloadUrl}
        download
        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
      >
        Download
      </a>
      {document.source === "upload" && (
        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={deletingId === document.id}
          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 disabled:opacity-50"
        >
          {deletingId === document.id ? "Deleting…" : "Delete"}
        </button>
      )}
    </div>
  );
}
