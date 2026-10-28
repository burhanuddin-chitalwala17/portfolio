"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import Notice from "../../ui/Notice";
import SearchField from "../../ui/SearchField";
import SelectAllCheckbox from "../../ui/SelectAllCheckbox";
import StatusMessage from "../../ui/StatusMessage";
import { Field, TextInput } from "../../ui/fields";
import { useAsyncAction } from "../../ui/hooks/useAsyncAction";
import { useSelection } from "../../ui/hooks/useSelection";
import SecretField from "../../ui/patterns/SecretField";
import { adminRequest } from "../_lib/adminRequest";
import { filterByQuery } from "../_lib/search";

// Matches the limit in app/services/github/settings.js.
const MAX_REPOS = 30;
const TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

function RepoRow({ repo, checked, onToggle, disabled }) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-fg/[0.03]">
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-fg" checked={checked} onChange={onToggle} disabled={disabled} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-sm text-fg">{repo.fullName}</span>
            {repo.private && <Badge tone="warning">Private</Badge>}
            {repo.fork && <Badge>Fork</Badge>}
            {repo.missing && <Badge tone="danger">Not found any more</Badge>}
          </span>
          {(repo.description || repo.language) && (
            <span className="mt-0.5 block text-xs text-fg/60">{[repo.description, repo.language].filter(Boolean).join(" · ")}</span>
          )}
        </span>
      </label>
    </li>
  );
}

function RepoPicker({ repos, selection, enabled }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => filterByQuery(repos, query, (repo) => [repo.fullName, repo.description, repo.language]),
    [repos, query]
  );
  const visibleNames = visible.map((repo) => repo.fullName);

  return (
    <div className="flex flex-col gap-3">
      <SearchField value={query} onChange={setQuery} label="Search repositories" placeholder="Search by name, description or language" />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <SelectAllCheckbox
          label={query ? `Select all ${visible.length} matching` : `Select all ${repos.length}`}
          state={selection.stateOf(visibleNames)}
          onChange={(on) => selection.setAll(visibleNames, on)}
          disabled={!enabled || visible.length === 0}
        />
        <span className="text-xs text-fg/60">
          {selection.list.length} selected
        </span>
      </div>
      {visible.length ? (
        <ul className="flex max-h-96 flex-col divide-y divide-fg/10 overflow-y-auto rounded-xl border border-fg/10" data-lenis-prevent>
          {visible.map((repo) => (
            <RepoRow
              key={repo.fullName}
              repo={repo}
              checked={selection.selected.has(repo.fullName)}
              onToggle={() => selection.toggle(repo.fullName)}
              disabled={!enabled}
            />
          ))}
        </ul>
      ) : (
        <p className="px-1 text-sm text-fg/60">No repositories match “{query}”.</p>
      )}
    </div>
  );
}

export default function GithubSource({ initialSettings, tokenStatus, enabled, canSaveToken }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialSettings.username);
  const [repos, setRepos] = useState(null);
  const selection = useSelection(initialSettings.repos);
  const { busy, message, run } = useAsyncAction();

  // Saved repositories stay listed before (or without) loading the full list.
  const shown = repos ?? initialSettings.repos.map((fullName) => ({ fullName }));
  const privateSelected = shown.filter((repo) => repo.private && selection.selected.has(repo.fullName));
  const overLimit = selection.list.length > MAX_REPOS;

  const load = () =>
    run("load", async () => {
      const { repos: loaded } = await adminRequest("/api/admin/sources/github/repos", { body: { username: username.trim() } });
      const listed = new Set(loaded.map((repo) => repo.fullName));
      const missing = selection.list.filter((name) => !listed.has(name)).map((fullName) => ({ fullName, missing: true }));
      setRepos([...loaded, ...missing]);
    });

  const save = () =>
    run("save", async () => {
      await adminRequest("/api/admin/sources/github", { method: "PUT", body: { username: username.trim(), repos: selection.list } });
      const count = selection.list.length;
      return count ? `Saved. The chat can now explore ${count} repositor${count === 1 ? "y" : "ies"}.` : "Saved. GitHub is off for the chat.";
    });

  const saveToken = async (token) => {
    await adminRequest("/api/admin/sources/github/token", { method: "PUT", body: { token } });
    router.refresh();
  };
  const removeToken = async () => {
    await adminRequest("/api/admin/sources/github/token", { method: "DELETE" });
    router.refresh();
  };

  return (
    <Card
      title="GitHub"
      description="Pick the repositories visitors can ask about. The chat reads their README, files and recent commits on demand to answer detailed questions about how a project is built. It can't reach any other repository, can't change anything, and never opens files that usually hold credentials (like .env or private keys)."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field label="GitHub username" className="flex-1">
          <TextInput value={username} onChange={(event) => setUsername(event.target.value)} spellCheck={false} autoComplete="off" disabled={!enabled} />
        </Field>
        <Button variant="secondary" onClick={load} disabled={!enabled || !username.trim() || busy !== null}>
          {busy === "load" ? "Loading…" : repos ? "Reload repositories" : "Load repositories"}
        </Button>
      </div>

      {shown.length > 0 ? (
        <RepoPicker repos={shown} selection={selection} enabled={enabled} />
      ) : (
        <p className="text-sm text-fg/60">Load your repositories to choose which ones the chat may read.</p>
      )}

      {overLimit && <Notice tone="danger">Pick at most {MAX_REPOS} repositories; {selection.list.length} are selected.</Notice>}
      {privateSelected.length > 0 && (
        <Notice tone="warning">
          You&apos;ve selected private repositories ({privateSelected.map((repo) => repo.fullName).join(", ")}). Visitors will be
          able to ask about their code and the chat can quote short parts of it.
        </Notice>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-fg/10 p-4">
        <p className="text-sm font-semibold text-fg">Access token (optional, recommended)</p>
        <p className="text-xs text-fg/60">
          Raises GitHub&apos;s rate limit, turns on code search, and lets the chat read private repositories you select.{" "}
          <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-info underline">
            Create a fine-grained token
          </a>{" "}
          with read-only <span className="font-semibold">Contents</span> and <span className="font-semibold">Metadata</span> access,
          limited to the repositories you want to share.
        </p>
        <SecretField
          id="github-token"
          label="GitHub token"
          status={tokenStatus}
          envKey="GITHUB_TOKEN"
          placeholder="github_pat_…"
          enabled={canSaveToken}
          onSave={saveToken}
          onRemove={removeToken}
        />
        {!canSaveToken && <p className="text-xs text-warning">Connect the database and set ADMIN_SESSION_SECRET to store a token here.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={save} disabled={!enabled || busy !== null || overLimit}>
          {busy === "save" ? "Saving…" : "Save"}
        </Button>
        <StatusMessage message={message} />
      </div>
    </Card>
  );
}
