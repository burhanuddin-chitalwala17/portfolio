"use client";

import Button from "../../ui/Button";
import { Checkbox } from "../../ui/fields";

const SEVERITY_STYLES = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
};

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The "check before uploading" step: what the sensitive-data scan found in each file, whether the
 * chat may use it, and the confirmation required before a risky file goes into the chat.
 * Driven by useDocumentUpload.
 */
export default function UploadReview({ stage, review, updateItem, blocked, onSave, onCancel, saveLabel = "Upload" }) {
  return (
    <div className="flex flex-col gap-3">
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
                  <Checkbox
                    className="mt-3"
                    label="Let the portfolio chat use this file"
                    checked={item.useInChat}
                    disabled={stage === "uploading"}
                    onChange={(event) => updateItem(index, { useInChat: event.target.checked, acknowledgedRisks: false })}
                  />
                )}

                {item.useInChat && item.findings.length > 0 && (
                  <Checkbox
                    className="mt-2 rounded-lg bg-danger/5 p-3 text-danger"
                    label="I understand visitors may be able to see what's in this file. The detected items above will still be hidden from the chat, but anything the scan missed won't be."
                    checked={item.acknowledgedRisks}
                    disabled={stage === "uploading"}
                    onChange={(event) => updateItem(index, { acknowledgedRisks: event.target.checked })}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          onClick={onSave}
          disabled={stage === "uploading" || blocked}
        >
          {stage === "uploading" ? "Saving…" : saveLabel}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onCancel}
          disabled={stage === "uploading"}
        >
          Cancel
        </Button>
      </div>
      {blocked && (
        <p className="text-sm text-danger">
          Confirm the warning for each sensitive file the chat will use.
        </p>
      )}
    </div>
  );
}
