"use client";

import { useState } from "react";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import StatusMessage from "../../ui/StatusMessage";
import { Checkbox, Field, TextInput } from "../../ui/fields";
import { useAsyncAction } from "../../ui/hooks/useAsyncAction";
import { adminRequest } from "../_lib/adminRequest";

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-fg/50">{label}</dt>
      <dd className="text-lg font-semibold text-fg">{value}</dd>
    </div>
  );
}

function ProfilePreview({ profile }) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-xl border border-fg/10 p-4 text-sm sm:grid-cols-4">
      <Stat label="Solved" value={profile.solved.total} />
      <Stat label="Medium / Hard" value={`${profile.solved.medium} / ${profile.solved.hard}`} />
      {profile.contest && <Stat label="Contest rating" value={profile.contest.rating} />}
      {profile.languages?.[0] && <Stat label="Top language" value={profile.languages[0].name} />}
    </dl>
  );
}

export default function LeetcodeSource({ initialSettings, enabled }) {
  const [settings, setSettings] = useState(initialSettings);
  const [preview, setPreview] = useState(null);
  const { busy, message, run } = useAsyncAction();
  const username = settings.username.trim();

  const loadPreview = () =>
    run("preview", async () => {
      setPreview(null);
      setPreview((await adminRequest("/api/admin/sources/leetcode/preview", { body: { username } })).profile);
    });

  const save = () =>
    run("save", async () => {
      await adminRequest("/api/admin/sources/leetcode", { method: "PUT", body: { ...settings, username } });
      return settings.enabled ? "Saved. The chat uses your live LeetCode stats." : "Saved. LeetCode is off.";
    });

  return (
    <Card
      title="LeetCode"
      description="Lets the chat answer with your live public stats: problems solved, languages, strongest topics, contest rating, badges and recent solves. Refreshed every few hours from your public profile; no login needed."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field label="LeetCode username" className="flex-1">
          <TextInput
            value={settings.username}
            onChange={(event) => setSettings((current) => ({ ...current, username: event.target.value }))}
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled}
          />
        </Field>
        <Button variant="secondary" onClick={loadPreview} disabled={!enabled || !username || busy !== null}>
          {busy === "preview" ? "Checking…" : "Preview"}
        </Button>
      </div>
      {preview && <ProfilePreview profile={preview} />}
      <Checkbox
        label="Let the chat use my live LeetCode stats"
        checked={settings.enabled}
        onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
        disabled={!enabled}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={save} disabled={!enabled || busy !== null || (settings.enabled && !username)}>
          {busy === "save" ? "Saving…" : "Save"}
        </Button>
        <StatusMessage message={message} />
      </div>
    </Card>
  );
}
