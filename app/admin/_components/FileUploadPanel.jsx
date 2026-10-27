"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export default function FileUploadPanel({
  enabled = false,
  acceptedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/*",
    "text/plain",
    "text/markdown",
  ],
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState({ state: "idle", messages: [] });
  const router = useRouter();

  const uploadFiles = useCallback(
    async (files) => {
      const tooLarge = files.filter((file) => file.size > MAX_UPLOAD_BYTES);
      const toSend = files.filter((file) => file.size <= MAX_UPLOAD_BYTES);
      const skipped = tooLarge.map((file) => `${file.name}: files must be 4 MB or smaller.`);
      if (!toSend.length) {
        setStatus({ state: "error", messages: skipped });
        return;
      }

      setStatus({ state: "uploading", messages: [] });
      const formData = new FormData();
      toSend.forEach((file) => formData.append("files", file));
      try {
        const response = await fetch("/api/admin/documents", { method: "POST", body: formData });
        const data = await response.json().catch(() => ({}));
        const errors = [...skipped, ...(data.errors ?? []), ...(data.error ? [data.error] : [])];
        const uploadedCount = data.uploaded?.length ?? 0;
        if (uploadedCount) router.refresh();
        setStatus({
          state: errors.length ? "error" : "done",
          messages: uploadedCount
            ? [`Uploaded ${uploadedCount} file${uploadedCount === 1 ? "" : "s"}.`, ...errors]
            : errors.length
              ? errors
              : ["Upload failed. Please try again."],
        });
        if (!errors.length) setSelectedFiles([]);
      } catch {
        setStatus({ state: "error", messages: ["Network error. Check your connection and try again."] });
      }
    },
    [router]
  );

  const handleFilesSelected = useCallback(
    (filesList) => {
      const files = Array.from(filesList ?? []);
      if (!files.length) return;

      setSelectedFiles(files);
      if (enabled) uploadFiles(files);
    },
    [enabled, uploadFiles]
  );

  const handleChange = useCallback(
    (event) => {
      handleFilesSelected(event.target.files);
      event.target.value = "";
    },
    [handleFilesSelected]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      handleFilesSelected(event.dataTransfer.files);
    },
    [handleFilesSelected]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleBrowseClick();
      }
    },
    [handleBrowseClick]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Upload documents
          </h2>
          <p className="text-sm text-slate-500">
            Select a file or drag and drop it into the area below. Supports PDF,
            Word, images, and text.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center transition ${
          isDragging ? "bg-slate-100 border-slate-400" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Select a file or drop it here to upload"
      >
        <p className="px-6 text-sm text-slate-600">
          {status.state === "uploading"
            ? "Uploading…"
            : "Tap to choose files, or drag & drop them here. Up to 4 MB each."}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={handleChange}
      />

      {status.messages.length > 0 && (
        <ul
          role="status"
          className={`mt-4 space-y-1 rounded-xl px-4 py-3 text-sm ${
            status.state === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {status.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {selectedFiles.length ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-100/60 p-4">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">
            Selected
          </h3>
          {!enabled && (
            <p className="mt-1 text-xs text-amber-700">
              Uploading switches on once storage is connected. These files stay
              on your device for now.
            </p>
          )}
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {selectedFiles.map((file) => (
              <li
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between gap-4 rounded-lg bg-white px-3 py-2 shadow-sm"
              >
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

