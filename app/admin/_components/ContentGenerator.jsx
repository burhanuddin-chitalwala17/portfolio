"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContentGenerator({ enabled, manualEditEnabled, resumeOptions }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const generate = async (event) => {
    event.preventDefault();
    if (!file && !documentId) {
      setError("Choose a resume file or one you've already uploaded.");
      return;
    }
    setBusy("generate");
    setError("");
    const formData = new FormData();
    if (file) formData.append("file", file);
    else formData.append("documentId", documentId);
    try {
      const response = await fetch("/api/admin/content/generate", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setFile(null);
      setDocumentId("");
      router.refresh();
    } catch (generateError) {
      setError(generateError.message || "Generating the draft failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const startManualEdit = async () => {
    setBusy("manual");
    setError("");
    try {
      const response = await fetch("/api/admin/content", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.errors?.join("; "));
      router.refresh();
    } catch (manualError) {
      setError(manualError.message || "Couldn't start a draft. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm">
      <h2 className="text-lg font-semibold text-fg">Update the site</h2>
      <p className="mt-1 text-sm text-fg/60">
        Upload a new resume and Claude drafts updated content for every section. Nothing changes on the site until you
        review the draft and publish it.
      </p>

      <form onSubmit={generate} className="mt-4 flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            New resume (PDF or .docx)
            <input
              type="file"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={!enabled || busy !== null}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setDocumentId("");
              }}
              className="rounded-lg border border-fg/20 bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-fg/5 file:px-3 file:py-1 file:text-sm disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-fg/80">
            …or one you&apos;ve uploaded
            <select
              value={documentId}
              disabled={!enabled || busy !== null || !resumeOptions.length}
              onChange={(event) => {
                setDocumentId(event.target.value);
                setFile(null);
              }}
              className="rounded-lg border border-fg/20 bg-surface px-3 py-2.5 text-sm disabled:opacity-50"
            >
              <option value="">{resumeOptions.length ? "Choose a document" : "No uploaded documents yet"}</option>
              {resumeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-fg/50">
          A new resume is stored privately and kept out of the chat. The draft never includes your phone number,
          address or other personal details, and it&apos;s privacy-checked before you see it.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!enabled || busy !== null}
            className="rounded-full bg-fg px-5 py-2 text-sm font-semibold text-inverse transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "generate" ? "Reading the resume… (up to a minute)" : "Generate draft"}
          </button>
          <button
            type="button"
            onClick={startManualEdit}
            disabled={!manualEditEnabled || busy !== null}
            className="rounded-full border border-fg/20 px-5 py-2 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "manual" ? "Starting…" : "Edit by hand instead"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
