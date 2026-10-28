"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDERS, PROVIDER_IDS } from "../../services/ai/providers";

function KeyStatus({ status, envKey }) {
  if (status.source === "admin" && status.unreadable) {
    return <span className="text-danger">Saved key can&apos;t be read (the encryption secret changed). Enter it again.</span>;
  }
  if (status.source === "admin") return <span className="text-success">Saved here, ending in ···{status.hint}</span>;
  if (status.source === "env") return <span className="text-fg/70">From the {envKey} environment variable</span>;
  return <span className="text-fg/50">No key</span>;
}

function ProviderKeyRow({ id, status, enabled }) {
  const router = useRouter();
  const provider = PROVIDERS[id];
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const request = async (method, body) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/ai/keys/${id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setApiKey("");
      setMessage({ tone: "success", text: method === "PUT" ? "Key saved." : "Key removed." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "danger", text: error.message || "That didn't work. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const save = (event) => {
    event.preventDefault();
    if (apiKey.trim()) request("PUT", { apiKey: apiKey.trim() });
  };

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 md:w-1/3">
        <p className="font-medium text-fg">{provider.label}</p>
        <p className="mt-0.5 text-xs">
          <KeyStatus status={status} envKey={provider.envKey} />
        </p>
        {provider.keyUrl && (
          <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-info underline">
            Get a key
          </a>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor={`key-${id}`}>
            {provider.label} API key
          </label>
          <input
            id={`key-${id}`}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={status.source === "admin" ? "Paste a new key to replace it" : "Paste an API key"}
            disabled={!enabled || busy}
            className="min-w-0 flex-1 rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!enabled || busy || !apiKey.trim()}
              className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-inverse transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status.source === "admin" ? "Replace" : "Save"}
            </button>
            {status.source === "admin" && (
              <button
                type="button"
                onClick={() => request("DELETE")}
                disabled={busy}
                className="rounded-full border border-danger/20 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger/40 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </form>
        {message && (
          <p role="status" className={`text-xs ${message.tone === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
    </li>
  );
}

export default function ProviderKeys({ keyStatuses, enabled }) {
  return (
    <section className="rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm">
      <h3 className="text-base font-semibold text-fg">API keys</h3>
      <p className="mt-1 text-sm text-fg/60">
        Keys are encrypted before they&apos;re stored and are never shown again or sent to the browser. A key saved here
        takes priority over the matching Vercel environment variable. Set a monthly spending limit on each key with the
        provider.
      </p>
      {!enabled && (
        <p role="status" className="mt-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
          To save keys here, connect the database and set <span className="font-mono text-xs">ADMIN_SESSION_SECRET</span>{" "}
          in Vercel (it also encrypts the keys).
        </p>
      )}
      <ul className="mt-2 divide-y divide-fg/10">
        {PROVIDER_IDS.map((id) => (
          <ProviderKeyRow key={id} id={id} status={keyStatuses[id]} enabled={enabled} />
        ))}
      </ul>
    </section>
  );
}
