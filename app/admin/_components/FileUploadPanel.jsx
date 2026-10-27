"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/*",
  "text/plain",
  "text/markdown",
];

const SEVERITY_STYLES = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
};

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function FileUploadPanel({ enabled = false }) {
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  // idle → checking → review → uploading → idle
  const [stage, setStage] = useState("idle");
  const [review, setReview] = useState([]);
  const [messages, setMessages] = useState({ tone: "success", items: [] });

  const reset = () => {
    setReview([]);
    setStage("idle");
  };

  const checkFiles = useCallback(async (files) => {
    const tooLarge = files.filter((file) => file.size > MAX_UPLOAD_BYTES);
    const candidates = files.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const sizeErrors = tooLarge.map(
      (file) => `${file.name}: files must be 4 MB or smaller.`,
    );
    setMessages({ tone: "error", items: sizeErrors });
    if (!candidates.length) return;

    setStage("checking");
    const formData = new FormData();
    candidates.forEach((file) => formData.append("files", file));
    try {
      const response = await fetch("/api/admin/documents/scan", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReview(
        candidates.map((file, index) => {
          const result = data.results[index];
          const risky = result.findings.length > 0;
          return {
            file,
            ...result,
            useInChat: result.ok && result.hasText && !risky,
            acknowledgedRisks: false,
          };
        }),
      );
      setStage("review");
    } catch (error) {
      setMessages({
        tone: "error",
        items: [
          ...sizeErrors,
          error.message || "Couldn't check the files. Try again.",
        ],
      });
      setStage("idle");
    }
  }, []);

  const updateItem = (index, changes) => {
    setReview((items) =>
      items.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    );
  };

  const upload = async () => {
    const items = review.filter((item) => item.ok);
    if (!items.length) {
      reset();
      return;
    }
    setStage("uploading");
    const formData = new FormData();
    items.forEach((item) => formData.append("files", item.file));
    formData.append(
      "options",
      JSON.stringify(
        items.map((item) => ({
          useInChat: item.useInChat,
          acknowledgedRisks: item.acknowledgedRisks,
        })),
      ),
    );
    try {
      const response = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      const errors = [
        ...(data.errors ?? []),
        ...(data.error ? [data.error] : []),
      ];
      const uploadedCount = data.uploaded?.length ?? 0;
      if (uploadedCount) router.refresh();
      setMessages({
        tone: errors.length ? "error" : "success",
        items: uploadedCount
          ? [
              `Uploaded ${uploadedCount} file${uploadedCount === 1 ? "" : "s"}.`,
              ...errors,
            ]
          : errors.length
            ? errors
            : ["Upload failed. Please try again."],
      });
      reset();
    } catch {
      setMessages({
        tone: "error",
        items: ["Network error. Check your connection and try again."],
      });
      setStage("review");
    }
  };

  const handleFilesSelected = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length || !enabled) return;
    checkFiles(files);
  };

  const blocked = review.some(
    (item) =>
      item.ok &&
      item.useInChat &&
      item.findings.length &&
      !item.acknowledgedRisks,
  );

  return (
    <section className="rounded-2xl border border-fg/10 bg-surface px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-fg">
          Upload documents
        </h2>
        <p className="text-sm text-fg/60">
          PDF, Word (.docx), text or images, up to 4 MB each. Text from files
          you allow is what the portfolio chat answers from.
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
          Files themselves stay private to this panel. Each upload is scanned
          first, and anything detected as sensitive is removed from what the
          chat sees.
        </p>
      </div>

      {stage === "review" || stage === "uploading" ? (
        <div className="mt-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-fg">
            Check before uploading
          </h3>
          <ul className="flex flex-col gap-3">
            {review.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className="rounded-xl border border-fg/10 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="break-all font-medium text-fg">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-fg/60">
                    {formatSize(item.file.size)}
                  </span>
                </div>

                {!item.ok ? (
                  <p className="mt-2 text-sm text-danger">{item.error}</p>
                ) : (
                  <>
                    {item.findings.length > 0 ? (
                      <div className="mt-3 rounded-lg bg-danger/5 p-3">
                        <p className="text-sm font-semibold text-danger">
                          ⚠ This file looks like it contains sensitive
                          information
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {item.findings.map((finding) => (
                            <li
                              key={finding.kind}
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_STYLES[finding.severity]}`}
                            >
                              {finding.label} ×{finding.count}{" "}
                              <span className="font-mono">
                                ({finding.example})
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-danger">
                          It will be stored privately and kept out of the chat
                          unless you choose otherwise below. Consider removing
                          these details and uploading a clean copy instead.
                        </p>
                      </div>
                    ) : item.hasText ? (
                      <p className="mt-2 text-sm text-success">
                        No sensitive data detected.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-fg/60">
                        No readable text, so the chat can&apos;t use this file.
                      </p>
                    )}

                    {item.hasText && (
                      <label className="mt-3 flex items-start gap-2 text-sm text-fg/80">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4"
                          checked={item.useInChat}
                          disabled={stage === "uploading"}
                          onChange={(event) =>
                            updateItem(index, {
                              useInChat: event.target.checked,
                              acknowledgedRisks: false,
                            })
                          }
                        />
                        Let the portfolio chat use this file
                      </label>
                    )}

                    {item.useInChat && item.findings.length > 0 && (
                      <label className="mt-2 flex items-start gap-2 rounded-lg bg-danger/5 p-3 text-sm text-danger">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4"
                          checked={item.acknowledgedRisks}
                          disabled={stage === "uploading"}
                          onChange={(event) =>
                            updateItem(index, {
                              acknowledgedRisks: event.target.checked,
                            })
                          }
                        />
                        I understand visitors may be able to see what&apos;s in
                        this file. The detected items above will still be hidden
                        from the chat, but anything the scan missed won&apos;t
                        be.
                      </label>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={upload}
              disabled={stage === "uploading" || blocked}
              className="rounded-full bg-fg px-5 py-2 text-sm font-semibold text-surface transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stage === "uploading" ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={stage === "uploading"}
              className="rounded-full border border-fg/20 px-5 py-2 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          {blocked && (
            <p className="text-sm text-danger">
              Confirm the warning for each sensitive file the chat will use.
            </p>
          )}
        </div>
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
          onClick={() =>
            enabled && stage === "idle" && fileInputRef.current?.click()
          }
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

      {messages.items.length > 0 && (
        <ul
          role="status"
          className={`mt-4 space-y-1 rounded-xl px-4 py-3 text-sm ${
            messages.tone === "error"
              ? "bg-danger/5 text-danger"
              : "bg-success/5 text-success"
          }`}
        >
          {messages.items.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
