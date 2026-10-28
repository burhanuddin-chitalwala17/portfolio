import "server-only";
import { z } from "zod";
import { deleteSecret, readSecret, readSetting, saveSecret, secretStatuses, writeSetting } from "../settings/store";

const SETTINGS_KEY = "github";
const SECRET_ID = "github";
const TOKEN_ENV = "GITHUB_TOKEN";

const repoName = z.string().regex(/^[\w.-]+\/[\w.-]+$/).max(140);

export const GithubSettingsSchema = z.object({
  username: z.union([z.literal(""), z.string().regex(/^[a-zA-Z\d](?:[a-zA-Z\d-]{0,38})$/)]),
  /** Repositories the chat may read, as "owner/name". Nothing else is reachable. */
  repos: z.array(repoName).max(30),
});

const DEFAULT_SETTINGS = Object.freeze({ username: process.env.GITHUB_USERNAME || "", repos: [] });

export function getGithubSettings() {
  return readSetting(SETTINGS_KEY, GithubSettingsSchema, DEFAULT_SETTINGS);
}

export async function saveGithubSettings(settings) {
  const parsed = GithubSettingsSchema.safeParse(settings);
  if (!parsed.success) return { ok: false, error: "Use a valid GitHub username and pick at most 30 repositories." };
  await writeSetting(SETTINGS_KEY, parsed.data);
  return { ok: true, settings: parsed.data };
}

/** An optional token: raises the rate limit, allows code search and lets selected private repos be read. */
export function getGithubToken() {
  return readSecret(SECRET_ID, TOKEN_ENV);
}

export async function getGithubTokenStatus() {
  return (await secretStatuses({ [SECRET_ID]: TOKEN_ENV }))[SECRET_ID];
}

export const saveGithubToken = (token) => saveSecret(SECRET_ID, token);
export const deleteGithubToken = () => deleteSecret(SECRET_ID);

/** What the chat needs to use GitHub, or null when no repositories are selected. */
export async function resolveGithubAccess() {
  const settings = await getGithubSettings();
  if (!settings.repos.length) return null;
  return { repos: settings.repos, token: await getGithubToken() };
}
