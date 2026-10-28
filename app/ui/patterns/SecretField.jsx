"use client";

import { useState } from "react";
import Button from "../Button";
import StatusMessage from "../StatusMessage";
import { useAsyncAction } from "../hooks/useAsyncAction";

/** Where a stored secret comes from, in words. `status` comes from the server's secretStatuses(). */
function describe(status, envKey) {
  if (status.source === "admin" && status.unreadable) {
    return { tone: "danger", text: "Saved here, but it can't be read (the encryption secret changed). Enter it again." };
  }
  if (status.source === "admin") return { tone: "success", text: `Saved here, ending in ···${status.hint}` };
  if (status.source === "env") return { tone: "neutral", text: `From the ${envKey} environment variable` };
  return { tone: "muted", text: "Not set" };
}

const TONE_CLASSES = { success: "text-success", danger: "text-danger", neutral: "text-fg/70", muted: "text-fg/50" };

/**
 * Add, replace or remove a secret (an API key or token). The value is write-only: it's sent once
 * and never shown again; only where it comes from and its last four characters are displayed.
 * @param {{ label: string, status: object, envKey?: string, placeholder?: string, enabled: boolean,
 *           onSave: (value: string) => Promise<void>, onRemove: () => Promise<void> }} props
 */
export default function SecretField({ id, label, status, envKey, placeholder = "Paste a key", enabled, onSave, onRemove }) {
  const [value, setValue] = useState("");
  const { busy, message, run } = useAsyncAction();
  const stored = status.source === "admin";
  const summary = describe(status, envKey);

  const save = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    run("save", async () => {
      await onSave(value.trim());
      setValue("");
      return "Saved.";
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className={`text-xs ${TONE_CLASSES[summary.tone]}`}>{summary.text}</p>
      <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={stored ? "Paste a new one to replace it" : placeholder}
          disabled={!enabled || busy !== null}
          className="min-w-0 flex-1 rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={!enabled || busy !== null || !value.trim()}>
            {stored ? "Replace" : "Save"}
          </Button>
          {stored && (
            <Button variant="danger" onClick={() => run("remove", async () => (await onRemove(), "Removed."))} disabled={busy !== null}>
              Remove
            </Button>
          )}
        </div>
      </form>
      <StatusMessage message={message} className="text-xs" />
    </div>
  );
}
