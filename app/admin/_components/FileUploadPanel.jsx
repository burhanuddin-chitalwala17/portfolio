"use client";

import { useCallback, useRef, useState } from "react";

export default function FileUploadPanel({
  acceptedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/*",
    "text/plain",
  ],
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFilesSelected = useCallback((filesList) => {
    const files = Array.from(filesList ?? []);
    if (!files.length) return;

    setSelectedFiles(files);
    // TODO: Send the files to storage once it's connected.
  }, []);

  const handleChange = useCallback(
    (event) => {
      handleFilesSelected(event.target.files);
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
          Select a file or drag &amp; drop it here to stage for upload.
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

      {selectedFiles.length ? (
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-100/60 p-4">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">
            Selected
          </h3>
          <p className="mt-1 text-xs text-amber-700">
            Uploading isn&apos;t switched on yet: it needs file storage to be
            connected. These files stay on your device for now.
          </p>
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

