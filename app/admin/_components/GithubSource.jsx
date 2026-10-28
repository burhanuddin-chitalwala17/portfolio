"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function requestJson(url, { method = "POST", body } = {}) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "That didn't work. Please try again.");
  return data;
}

const TOKEN_HELP_URL = "https://github.com/settings/personal-access-tokens/new";

function TokenSettings({ status, enabled }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const run = async (method) => {
    setBusy(true);
    setMessage(null);
    try {
      await requestJson("/api/admin/sources/github/token", { method, body: method === "PUT" ? { token: token.trim() } : undefined });
      setToken("");
      setMessage({ tone: "success", text: method === "PUT" ? "Token saved." : "Token removed." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "danger", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const statusText =
    status.source === "admin" && status.unreadable
      ? "The saved token can't be read (the encryption secret changed). Save it again."
      : status.source === "admin"
        ? `Saved here, ending in ···${status.hint}`
        : status.source === "env"
          ? "From the GITHUB_TOKEN environment variable"
          : "No token: public repositories only, no code search, and a low rate limit";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-fg/10 p-4">
      <p className="text-sm font-semibold text-fg">Access token (optional, recommended)</p>
      <p className="text-xs text-fg/60">
        Raises GitHub&apos;s rate limit, turns on code search, and lets the chat read private repositories you select.{" "}
        <a href={TOKEN_HELP_URL} target="_blank" rel="noreferrer" className="text-info underline">
          Create a fine-grained token
        </a>{" "}
        with read-only <span className="font-semibold">Contents</span> and <span className="font-semibold">Metadata</span>{" "}
        access, limited to the repositories you want to share.
      </p>
      <p className={`text-xs ${status.source === "none" ? "text-fg/50" : status.unreadable ? "text-danger" : "text-success"}`}>
        {statusText}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={status.source === "admin" ? "Paste a new token to replace it" : "github_pat_…"}
          disabled={!enabled || busy}
          aria-label="GitHub token"
          className="min-w-0 flex-1 rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => run("PUT")}
            disabled={!enabled || busy || !token.trim()}
            className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-inverse transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status.source === "admin" ? "Replace" : "Save"}
          </button>
          {status.source === "admin" && (
            <button
              type="button"
              onClick={() => run("DELETE")}
              disabled={busy}
              className="rounded-full border border-danger/20 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger/40 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {!enabled && (
        <p className="text-xs text-warning">Set ADMIN_SESSION_SECRET in Vercel to store a token here.</p>
      )}
      {message && (
        <p role="status" className={`text-xs ${message.tone === "success" ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function GithubSource({ initialSettings, tokenStatus, enabled, canSaveToken }) {
  const [username, setUsername] = useState(initialSettings.username);
  const [selected, setSelected] = useState(new Set(initialSettings.repos));
  const [repos, setRepos] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  // Selected repositories stay listed even before (or without) loading the full list.
  const shown = repos ?? initialSettings.repos.map((fullName) => ({ fullName }));
  const privateSelected = shown.filter((repo) => repo.private && selected.has(repo.fullName));

  const load = async () => {
    setBusy("load");
    setMessage(null);
    try {
      const data = await requestJson("/api/admin/sources/github/repos", { body: { username: username.trim() } });
      const listed = new Set(data.repos.map((repo) => repo.fullName));
      const missing = [...selected].filter((name) => !listed.has(name)).map((fullName) => ({ fullName, missing: true }));
      setRepos([...data.repos, ...missing]);
    } catch (error) {
      setMessage({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const toggle = (fullName) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });

  const save = async () => {
    setBusy("save");
    setMessage(null);
    try {
      await requestJson("/api/admin/sources/github", {
        method: "PUT",
        body: { username: username.trim(), repos: [...selected] },
      });
      setMessage({
        tone: "success",
        text: selected.size
          ? `Saved. The chat can now explore ${selected.size} repositor${selected.size === 1 ? "y" : "ies"}.`
          : "Saved. GitHub is off for the chat.",
      });
    } catch (error) {
      setMessage({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-fg">GitHub</h3>
        <p className="mt-1 text-sm text-fg/60">
          Pick the repositories visitors can ask about. The chat reads their README, files and recent commits on demand to
          answer detailed questions about how a project is built. It can&apos;t reach any other repository, can&apos;t change
          anything, and never opens files that usually hold credentials (like .env or private keys).
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-fg/80">
          GitHub username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled}
            className="rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          onClick={load}
          disabled={!enabled || !username.trim() || busy !== null}
          className="rounded-full border border-fg/20 px-4 py-2 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "load" ? "Loading…" : "Load repositories"}
        </button>
      </div>

      {shown.length > 0 && (
        <ul className="flex max-h-96 flex-col divide-y divide-fg/10 overflow-y-auto rounded-xl border border-fg/10">
          {shown.map((repo) => (
            <li key={repo.fullName}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-fg/[0.03]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={selected.has(repo.fullName)}
                  onChange={() => toggle(repo.fullName)}
                  disabled={!enabled}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-all font-mono text-sm text-fg">{repo.fullName}</span>
                    {repo.private && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Private</span>
                    )}
                    {repo.fork && <span className="rounded-full bg-fg/5 px-2 py-0.5 text-xs text-fg/60">Fork</span>}
                    {repo.missing && (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">Not found any more</span>
                    )}
                  </span>
                  {(repo.description || repo.language) && (
                    <span className="mt-0.5 block text-xs text-fg/60">
                      {[repo.description, repo.language].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {repos === null && initialSettings.repos.length === 0 && (
        <p className="text-sm text-fg/60">Load your repositories to choose which ones the chat may read.</p>
      )}

      {privateSelected.length > 0 && (
        <p role="alert" className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          You&apos;ve selected private repositories ({privateSelected.map((repo) => repo.fullName).join(", ")}). Visitors
          will be able to ask about their code and the chat can quote short parts of it.
        </p>
      )}

      <TokenSettings status={tokenStatus} enabled={canSaveToken} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!enabled || busy !== null}
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
