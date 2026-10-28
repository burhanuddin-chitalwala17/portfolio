"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AI_PURPOSES, PROVIDERS, PROVIDER_IDS } from "../../services/ai/providers";

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "That didn't work. Please try again.");
  return data;
}

function PurposeSettings({ purpose, choice, customBaseUrl, keyStatuses, models, onChange, onModelsLoaded, enabled }) {
  const { label, help } = AI_PURPOSES[purpose];
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const hasKey = keyStatuses[choice.provider]?.source !== "none";

  const loadModels = async () => {
    setBusy("models");
    setResult(null);
    try {
      const data = await postJson("/api/admin/ai/models", { provider: choice.provider, customBaseUrl });
      onModelsLoaded(choice.provider, data.models);
      setResult({ tone: "success", text: `${data.models.length} models available. Pick one from the list.` });
    } catch (error) {
      setResult({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    setResult(null);
    try {
      const data = await postJson("/api/admin/ai/test", { ...choice, customBaseUrl });
      setResult({ tone: "success", text: `Works (${(data.milliseconds / 1000).toFixed(1)} s): “${data.reply}”` });
    } catch (error) {
      setResult({ tone: "danger", text: error.message });
    } finally {
      setBusy(null);
    }
  };

  const listId = `models-${purpose}`;
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-fg/10 p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <p className="-mt-1 text-xs text-fg/60">{help}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-fg/80">
          Provider
          <select
            value={choice.provider}
            onChange={(event) => {
              const provider = event.target.value;
              onChange({ provider, model: PROVIDERS[provider].suggestedModel ?? "" });
              setResult(null);
            }}
            disabled={!enabled}
            className="rounded-lg border border-fg/20 bg-surface px-3 py-2 text-input disabled:opacity-50"
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDERS[id].label}
                {keyStatuses[id]?.source === "none" ? " (no key yet)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg/80">
          Model
          <input
            list={listId}
            value={choice.model}
            onChange={(event) => onChange({ ...choice, model: event.target.value })}
            placeholder="Load models, or type a model id"
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled}
            className="rounded-lg border border-fg/20 bg-surface px-3 py-2 font-mono text-input disabled:opacity-50"
          />
          <datalist id={listId}>
            {(models[choice.provider] ?? []).map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={loadModels}
          disabled={!enabled || !hasKey || busy !== null}
          className="rounded-full border border-fg/20 px-4 py-1.5 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "models" ? "Loading…" : "Load models"}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={!enabled || !hasKey || !choice.model.trim() || busy !== null}
          className="rounded-full border border-fg/20 px-4 py-1.5 text-sm font-semibold text-fg/80 transition hover:border-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "test" ? "Testing…" : "Test"}
        </button>
        {!hasKey && <span className="text-xs text-warning">Add a key for this provider below first.</span>}
      </div>
      {result && (
        <p role="status" className={`text-xs ${result.tone === "success" ? "text-success" : "text-danger"}`}>
          {result.text}
        </p>
      )}
    </fieldset>
  );
}

export default function ModelSettings({ initialSettings, keyStatuses, enabled }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const usesCustom = settings.chat.provider === "custom" || settings.content.provider === "custom";

  const update = (patch) => {
    setSettings((current) => ({ ...current, ...patch }));
    setMessage(null);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error);
      setMessage({ tone: "success", text: "Saved. The chat and drafts use these settings from now on." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "danger", text: error.message || "Saving failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-fg">Models</h3>
        <p className="mt-1 text-sm text-fg/60">
          Use <span className="font-semibold">Load models</span> to see what your key can use, then{" "}
          <span className="font-semibold">Test</span> before saving.
        </p>
      </div>
      {Object.keys(AI_PURPOSES).map((purpose) => (
        <PurposeSettings
          key={purpose}
          purpose={purpose}
          choice={settings[purpose]}
          customBaseUrl={settings.customBaseUrl}
          keyStatuses={keyStatuses}
          models={models}
          enabled={enabled}
          onChange={(choice) => update({ [purpose]: choice })}
          onModelsLoaded={(provider, list) => setModels((current) => ({ ...current, [provider]: list }))}
        />
      ))}
      {usesCustom && (
        <label className="flex flex-col gap-1 text-sm text-fg/80">
          Base URL for the OpenAI-compatible provider
          <input
            type="url"
            value={settings.customBaseUrl}
            onChange={(event) => update({ customBaseUrl: event.target.value })}
            placeholder="https://api.example.com/v1"
            spellCheck={false}
            disabled={!enabled}
            className="rounded-lg border border-fg/20 bg-surface px-3 py-2 font-mono text-input disabled:opacity-50"
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!enabled || saving}
          className="rounded-full bg-fg px-5 py-2 text-sm font-semibold text-inverse transition hover:bg-fg/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && (
          <p role="status" className={`text-sm ${message.tone === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
