"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import StatusMessage from "../../ui/StatusMessage";
import { Field, Select, TextInput } from "../../ui/fields";
import { useAsyncAction } from "../../ui/hooks/useAsyncAction";
import { AI_PURPOSES, PROVIDERS, PROVIDER_IDS } from "../../services/ai/providers";
import { adminRequest } from "../_lib/adminRequest";

function PurposeSettings({ purpose, choice, customBaseUrl, keyStatuses, models, onChange, onModelsLoaded, enabled }) {
  const { label, help } = AI_PURPOSES[purpose];
  const { busy, message, setMessage, run } = useAsyncAction();
  const hasKey = keyStatuses[choice.provider]?.source !== "none";
  const listId = `models-${purpose}`;

  const loadModels = () =>
    run("models", async () => {
      const data = await adminRequest("/api/admin/ai/models", { body: { provider: choice.provider, customBaseUrl } });
      onModelsLoaded(choice.provider, data.models);
      return `${data.models.length} models available. Pick one from the list.`;
    });

  const test = () =>
    run("test", async () => {
      const data = await adminRequest("/api/admin/ai/test", { body: { ...choice, customBaseUrl } });
      return `Works (${(data.milliseconds / 1000).toFixed(1)} s): “${data.reply}”`;
    });

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-fg/10 p-4">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <p className="-mt-1 text-xs text-fg/60">{help}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Provider">
          <Select
            value={choice.provider}
            onChange={(event) => {
              const provider = event.target.value;
              onChange({ provider, model: PROVIDERS[provider].suggestedModel ?? "" });
              setMessage(null);
            }}
            disabled={!enabled}
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDERS[id].label}
                {keyStatuses[id]?.source === "none" ? " (no key yet)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Model">
          <TextInput
            list={listId}
            value={choice.model}
            onChange={(event) => onChange({ ...choice, model: event.target.value })}
            placeholder="Load models, or type a model id"
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled}
            className="font-mono"
          />
          <datalist id={listId}>
            {(models[choice.provider] ?? []).map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={loadModels} disabled={!enabled || !hasKey || busy !== null}>
          {busy === "models" ? "Loading…" : "Load models"}
        </Button>
        <Button variant="secondary" size="sm" onClick={test} disabled={!enabled || !hasKey || !choice.model.trim() || busy !== null}>
          {busy === "test" ? "Testing…" : "Test"}
        </Button>
        {!hasKey && <span className="text-xs text-warning">Add a key for this provider below first.</span>}
      </div>
      <StatusMessage message={message} className="text-xs" />
    </fieldset>
  );
}

export default function ModelSettings({ initialSettings, keyStatuses, enabled }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [models, setModels] = useState({});
  const { busy, message, setMessage, run } = useAsyncAction();
  const usesCustom = settings.chat.provider === "custom" || settings.content.provider === "custom";

  const update = (patch) => {
    setSettings((current) => ({ ...current, ...patch }));
    setMessage(null);
  };

  const save = (event) => {
    event.preventDefault();
    run("save", async () => {
      await adminRequest("/api/admin/ai", { method: "PUT", body: settings });
      router.refresh();
      return "Saved. The chat and drafts use these settings from now on.";
    });
  };

  return (
    <Card
      as="form"
      onSubmit={save}
      title="Models"
      description={
        <>
          Use <span className="font-semibold">Load models</span> to see what your key can use, then{" "}
          <span className="font-semibold">Test</span> before saving.
        </>
      }
    >
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
        <Field label="Base URL for the OpenAI-compatible provider">
          <TextInput
            type="url"
            value={settings.customBaseUrl}
            onChange={(event) => update({ customBaseUrl: event.target.value })}
            placeholder="https://api.example.com/v1"
            spellCheck={false}
            disabled={!enabled}
            className="font-mono"
          />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={!enabled || busy !== null}>
          {busy === "save" ? "Saving…" : "Save"}
        </Button>
        <StatusMessage message={message} />
      </div>
    </Card>
  );
}
