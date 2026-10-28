"use client";

import { useState } from "react";

export default function LeetcodeSource({ initialSettings, enabled }) {
  const [settings, setSettings] = useState(initialSettings);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const call = async (url, method, body) => {
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "That didn't work. Please try again.");
    return data;
  };

  const loadPreview = async () => {
    setBusy("preview");
    setMessage(null);
    try {
      setPreview((await call("/api/admin/sources/leetcode/preview", "POST", { username: settings.username.trim() })).profile);
    } catch (error) {
      setPreview(null);
      setMessage({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    setMessage(null);
    try {
      await call("/api/admin/sources/leetcode", "PUT", { ...settings, username: settings.username.trim() });
      setMessage({ tone: "success", text: settings.enabled ? "Saved. The chat uses your live LeetCode stats." : "Saved. LeetCode is off." });
    } catch (error) {
      setMessage({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-fg">LeetCode</h3>
        <p className="mt-1 text-sm text-fg/60">
          Lets the chat answer with your live public stats: problems solved, languages, strongest topics, contest rating,
          badges and recent solves. Refreshed every few hours from your public profile; no login needed.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-fg/80">
          LeetCode username
          <input
            value={settings.username}
            onChange={(event) => setSettings((current) => ({ ...current, username: event.target.value }))}
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled}
            className="rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          onClick={loadPreview}
          disabled={!enabled || !settings.username.trim() || busy !== null}
          className="rounded-full border border-fg/20 px-4 py-2 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "preview" ? "Checking…" : "Preview"}
        </button>
      </div>

      {preview && (
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-fg/10 p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-fg/50">Solved</dt>
            <dd className="text-lg font-semibold text-fg">{preview.solved.total}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg/50">Medium / Hard</dt>
            <dd className="text-lg font-semibold text-fg">
              {preview.solved.medium} / {preview.solved.hard}
            </dd>
          </div>
          {preview.contest && (
            <div>
              <dt className="text-xs text-fg/50">Contest rating</dt>
              <dd className="text-lg font-semibold text-fg">{preview.contest.rating}</dd>
            </div>
          )}
          {preview.languages?.[0] && (
            <div>
              <dt className="text-xs text-fg/50">Top language</dt>
              <dd className="text-lg font-semibold text-fg">{preview.languages[0].name}</dd>
            </div>
          )}
        </dl>
      )}

      <label className="flex items-center gap-2 text-sm text-fg/80">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={settings.enabled}
          onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
          disabled={!enabled}
        />
        Let the chat use my live LeetCode stats
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!enabled || busy !== null || (settings.enabled && !settings.username.trim())}
          className="rounded-full bg-fg px-5 py-2 text-sm font-semibold text-inverse transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
        {message && (
          <p role="status" className={`text-sm ${message.tone === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
