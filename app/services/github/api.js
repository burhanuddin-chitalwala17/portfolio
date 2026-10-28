import "server-only";
import { redactSensitiveData } from "../privacy/sensitiveData";

/*
 * Read-only access to GitHub's REST API for the chat and the admin panel. Responses are cached
 * per server instance for a few minutes, which keeps chat replies fast and well inside rate limits.
 */

const API_URL = process.env.GITHUB_API_URL || "https://api.github.com";
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 300;
const REQUEST_TIMEOUT_MS = 8000;

const MAX_README_CHARACTERS = 12_000;
const MAX_FILE_CHARACTERS = 30_000;

// Files that commonly hold credentials. They're never fetched, even from a selected repository.
const SENSITIVE_PATH =
  /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|keystore|jks|sqlite|db)|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|\.npmrc|\.netrc|\.pypirc|credentials(\..*)?|secrets?\.(json|ya?ml|toml))$/i;
const SAFE_PATH = /^[\w@+.\-/ ]{0,300}$/;

export class GithubError extends Error {
  /** @param {"not_found" | "rate_limited" | "auth" | "unavailable" | "invalid"} kind */
  constructor(kind, message) {
    super(message);
    this.name = "GithubError";
    this.kind = kind;
  }
}

const cache = new Map();

function cached(key, load) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  return value;
}

async function request(path, { token, raw = false, accept } = {}) {
  const headers = {
    Accept: accept ?? (raw ? "application/vnd.github.raw+json" : "application/vnd.github+json"),
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-chat",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { headers, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new GithubError("unavailable", "GitHub didn't respond in time.");
  }
  if (response.status === 404) throw new GithubError("not_found", "Not found on GitHub.");
  if (response.status === 401) throw new GithubError("auth", "GitHub rejected the token.");
  if (response.status === 403 || response.status === 429) {
    const limited = response.headers.get("x-ratelimit-remaining") === "0" || response.status === 429;
    throw new GithubError(limited ? "rate_limited" : "auth", limited ? "GitHub's rate limit was reached." : "GitHub denied access.");
  }
  if (!response.ok) throw new GithubError("unavailable", `GitHub returned ${response.status}.`);
  return raw ? response.text() : response.json();
}

function encodePath(path) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

function checkPath(path) {
  const clean = (path ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!SAFE_PATH.test(clean) || clean.split("/").includes("..")) throw new GithubError("invalid", "That path isn't valid.");
  if (SENSITIVE_PATH.test(clean)) throw new GithubError("invalid", "That file may contain credentials, so it isn't shared.");
  return clean;
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}\n\n[… truncated, ${text.length - max} more characters]` : text;
}

const clean = (text, max) => redactSensitiveData(truncate(text, max));

/** Repositories owned by `username` (with a token: the token owner's, including private ones), newest first. */
export function listRepositories({ username, token }) {
  const path = token
    ? "/user/repos?affiliation=owner&sort=pushed&per_page=100"
    : `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100`;
  return cached(`repos:${token ? "token" : username}`, async () =>
    (await request(path, { token })).map((repo) => ({
      fullName: repo.full_name,
      description: repo.description ?? "",
      private: repo.private,
      fork: repo.fork,
      language: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      homepage: repo.homepage || "",
    }))
  );
}

/** Description, README, languages, top-level files and recent commits of one repository. */
export function getRepositoryOverview(fullName, { token }) {
  return cached(`overview:${fullName}`, async () => {
    const [repo, readme, languages, files, commits] = await Promise.all([
      request(`/repos/${fullName}`, { token }),
      request(`/repos/${fullName}/readme`, { token, raw: true }).catch(() => ""),
      request(`/repos/${fullName}/languages`, { token }).catch(() => ({})),
      request(`/repos/${fullName}/contents`, { token }).catch(() => []),
      request(`/repos/${fullName}/commits?per_page=8`, { token }).catch(() => []),
    ]);
    return {
      name: repo.full_name,
      description: repo.description ?? "",
      homepage: repo.homepage || "",
      topics: repo.topics ?? [],
      createdAt: repo.created_at,
      lastPush: repo.pushed_at,
      languages: Object.keys(languages),
      topLevelFiles: files.map((entry) => `${entry.name}${entry.type === "dir" ? "/" : ""}`),
      recentCommits: commits.map((commit) => ({
        date: commit.commit?.author?.date?.slice(0, 10),
        message: redactSensitiveData(commit.commit?.message?.split("\n")[0] ?? ""),
      })),
      readme: clean(readme, MAX_README_CHARACTERS),
    };
  });
}

/** Files and folders at `path` (the root when empty). */
export function listFiles(fullName, path, { token }) {
  const folder = checkPath(path);
  return cached(`files:${fullName}:${folder}`, async () => {
    const entries = await request(`/repos/${fullName}/contents/${encodePath(folder)}`, { token });
    if (!Array.isArray(entries)) throw new GithubError("invalid", "That's a file, not a folder. Read it instead.");
    return entries.map((entry) => `${entry.path}${entry.type === "dir" ? "/" : ""}`);
  });
}

/** The text of one file, truncated and with sensitive values redacted. */
export function readFile(fullName, path, { token }) {
  const file = checkPath(path);
  if (!file) throw new GithubError("invalid", "Give a file path.");
  return cached(`file:${fullName}:${file}`, async () => {
    const text = await request(`/repos/${fullName}/contents/${encodePath(file)}`, { token, raw: true });
    if (typeof text !== "string") throw new GithubError("invalid", "That's a folder. List it instead.");
    if (text.includes("\u0000")) throw new GithubError("invalid", "That's a binary file.");
    return clean(text, MAX_FILE_CHARACTERS);
  });
}

/** Files in one repository matching a code search. GitHub only allows code search with a token. */
export function searchCode(fullName, query, { token }) {
  if (!token) throw new GithubError("auth", "Code search needs a GitHub token. Browse the files instead.");
  const q = query.trim().slice(0, 100);
  return cached(`search:${fullName}:${q}`, async () => {
    const result = await request(`/search/code?per_page=10&q=${encodeURIComponent(`${q} repo:${fullName}`)}`, {
      token,
      accept: "application/vnd.github.text-match+json",
    });
    return result.items
      .filter((item) => !SENSITIVE_PATH.test(item.path))
      .map((item) => ({
        path: item.path,
        matches: (item.text_matches ?? []).map((match) => redactSensitiveData(match.fragment)).slice(0, 2),
      }));
  });
}
