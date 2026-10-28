"use client";

import { useRef, useState } from "react";
import UploadMessages from "./UploadMessages";
import UploadReview from "./UploadReview";
import { useDocumentUpload } from "./useDocumentUpload";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/*",
  "text/plain",
  "text/markdown",
];

// Pasted text is saved as a .txt document, so it goes through the same scan and review as a file.
const MAX_NOTE_CHARACTERS = 100_000;

export default function FileUploadPanel({ enabled = false }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { stage, review, messages, checkFiles, updateItem, upload, reset, blocked } = useDocumentUpload();
  // "file" to upload files, "text" to write or paste a note
  const [mode, setMode] = useState("file");
  const [note, setNote] = useState({ title: "", text: "" });

  const save = async () => {
    if (mode !== "text") return upload();
    const saved = await upload({ successMessage: () => "Saved. It's in the list below." });
    if (saved) setNote({ title: "", text: "" });
  };

  const handleFilesSelected = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length || !enabled) return;
    checkFiles(files);
  };

  const checkNote = (event) => {
    event.preventDefault();
    const title = note.title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\.txt$/i, "").trim();
    if (!title || !note.text.trim() || !enabled) return;
    checkFiles([new File([note.text.trim()], `${title}.txt`, { type: "text/plain" })]);
  };

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-fg">
          Add documents
        </h2>
        <p className="text-sm text-fg/60">
          Upload PDF, Word (.docx), text or images up to 4 MB each, or write
          and paste text directly. What you allow is what the portfolio chat
          answers from.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
        <p className="font-semibold">Before you upload</p>
        <p className="mt-1">
          Anything the chat can read, a visitor can get it to repeat, so treat
          chat documents as public. Don&apos;t include ID numbers (Aadhaar, PAN,
          passport), bank or card details, passwords or keys, your home address,
          date of birth, salary, or other people&apos;s private details.
        </p>
        <p className="mt-1 text-warning">
          Files and notes themselves stay private to this panel. Everything is
          scanned first, and anything detected as sensitive is removed from
          what the chat sees.
        </p>
      </div>

      {stage === "review" || stage === "uploading" ? (
        <UploadReview
          stage={stage}
          review={review}
          updateItem={updateItem}
          blocked={blocked}
          onSave={save}
          onCancel={reset}
          saveLabel={mode === "text" ? "Save" : "Upload"}
        />
      ) : (
        <>
          <div role="tablist" aria-label="How to add" className="mt-4 inline-flex rounded-full border border-fg/15 p-1 text-sm">
            {[
              ["file", "Upload files"],
              ["text", "Write or paste text"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-full px-4 py-1.5 font-medium transition ${
                  mode === value ? "bg-fg text-surface" : "text-fg/70 hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <form onSubmit={checkNote} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm text-fg/80">
                Title
                <input
                  value={note.title}
                  onChange={(event) => setNote((current) => ({ ...current, title: event.target.value }))}
                  maxLength={80}
                  placeholder="e.g. About me FAQ"
                  disabled={!enabled || stage === "checking"}
                  className="rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-fg/80">
                Text
                <textarea
                  value={note.text}
                  onChange={(event) => setNote((current) => ({ ...current, text: event.target.value }))}
                  maxLength={MAX_NOTE_CHARACTERS}
                  rows={10}
                  placeholder="Write in the first person, the way you'd answer a recruiter. Plain text or Markdown."
                  disabled={!enabled || stage === "checking"}
                  className="min-h-[200px] rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input leading-relaxed disabled:opacity-50"
                />
                <span className="self-end text-xs text-fg/50">
                  {note.text.length.toLocaleString("en")} / {MAX_NOTE_CHARACTERS.toLocaleString("en")}
                </span>
              </label>
              <button
                type="submit"
                disabled={!enabled || stage === "checking" || !note.title.trim() || !note.text.trim()}
                className="w-fit rounded-full bg-fg px-5 py-2 text-sm font-semibold text-surface transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stage === "checking" ? "Checking for sensitive data…" : "Check and save"}
              </button>
              {!enabled && (
                <p className="text-sm text-fg/60">Saving notes switches on once storage is connected.</p>
              )}
            </form>
          ) : (
            <div
              className={`mt-4 flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-fg/20 bg-canvas text-center transition ${
                isDragging ? "border-fg/40 bg-fg/5" : ""
              } ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFilesSelected(event.dataTransfer.files);
              }}
              onClick={() => enabled && stage === "idle" && fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (enabled && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={enabled ? 0 : -1}
              aria-disabled={!enabled}
              aria-label="Select a file or drop it here to upload"
            >
              <p className="px-6 text-sm text-fg/70">
                {!enabled
                  ? "Uploading switches on once storage is connected."
                  : stage === "checking"
                    ? "Checking files for sensitive data…"
                    : "Tap to choose files, or drag & drop them here. Each file is checked before upload."}
              </p>
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          handleFilesSelected(event.target.files);
          event.target.value = "";
        }}
      />

      <UploadMessages messages={messages} />
    </section>
  );
}
