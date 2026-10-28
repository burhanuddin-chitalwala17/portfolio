import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client";
import { appSettings, providerKeys } from "../db/schema";
import { PROVIDERS, PROVIDER_IDS } from "./providers";
import { canStoreSecrets, decryptSecret, encryptSecret } from "./secrets";

const SETTINGS_KEY = "ai";

const modelChoice = z.object({
  provider: z.enum(PROVIDER_IDS),
  model: z.string().trim().max(120),
});

export const AiSettingsSchema = z.object({
  chat: modelChoice,
  content: modelChoice,
  /** Base URL for the "custom" provider, e.g. https://api.together.xyz/v1 */
  customBaseUrl: z.union([z.literal(""), z.string().trim().url().max(300).startsWith("https://")]).default(""),
});

/** What applies before anything is saved in the admin panel: Claude, with the env model overrides. */
const DEFAULT_SETTINGS = Object.freeze({
  chat: { provider: "anthropic", model: process.env.ANTHROPIC_CHAT_MODEL || PROVIDERS.anthropic.suggestedModel },
  content: { provider: "anthropic", model: process.env.ANTHROPIC_CONTENT_MODEL || PROVIDERS.anthropic.suggestedModel },
  customBaseUrl: process.env.CUSTOM_LLM_BASE_URL || "",
});

export async function getAiSettings() {
  const db = getDb();
  if (!db) return DEFAULT_SETTINGS;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, SETTINGS_KEY));
  const parsed = AiSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveAiSettings(settings) {
  const parsed = AiSettingsSchema.safeParse(settings);
  if (!parsed.success) return { ok: false, error: "Choose a provider and model for each task, and use an https:// base URL." };
  await getDb()
    .insert(appSettings)
    .values({ key: SETTINGS_KEY, value: parsed.data })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: parsed.data, updatedAt: new Date() } });
  return { ok: true, settings: parsed.data };
}

async function storedKeys() {
  const db = getDb();
  if (!db) return new Map();
  const rows = await db.select().from(providerKeys);
  return new Map(rows.map((row) => [row.provider, row]));
}

/**
 * Where each provider's key comes from, for the admin panel. Never includes the key itself.
 * @returns {Promise<Record<string, {source: "admin" | "env" | "none", hint?: string, unreadable?: boolean}>>}
 */
export async function getKeyStatuses() {
  const stored = await storedKeys();
  return Object.fromEntries(
    PROVIDER_IDS.map((id) => {
      const row = stored.get(id);
      if (row) {
        const unreadable = decryptSecret(row.encryptedKey) === null;
        return [id, { source: "admin", hint: row.keyHint, unreadable, updatedAt: row.updatedAt.toISOString() }];
      }
      return [id, { source: process.env[PROVIDERS[id].envKey] ? "env" : "none" }];
    })
  );
}

export async function saveProviderKey(provider, apiKey) {
  if (!canStoreSecrets()) return { ok: false, error: "Set ADMIN_SESSION_SECRET in Vercel before saving keys here." };
  const hint = apiKey.slice(-4);
  const encryptedKey = encryptSecret(apiKey);
  await getDb()
    .insert(providerKeys)
    .values({ provider, encryptedKey, keyHint: hint })
    .onConflictDoUpdate({ target: providerKeys.provider, set: { encryptedKey, keyHint: hint, updatedAt: new Date() } });
  return { ok: true };
}

export async function deleteProviderKey(provider) {
  await getDb().delete(providerKeys).where(eq(providerKeys.provider, provider));
}

/** A key saved in the admin panel wins over the environment variable. */
async function resolveApiKey(provider) {
  const db = getDb();
  const [row] = db ? await db.select().from(providerKeys).where(eq(providerKeys.provider, provider)) : [];
  const fromAdmin = row ? decryptSecret(row.encryptedKey) : null;
  return fromAdmin || process.env[PROVIDERS[provider].envKey] || null;
}

/**
 * Everything needed to call a provider directly, for listing models or testing a key that
 * isn't selected yet. Returns null when the provider has no usable key.
 */
export async function resolveProvider(provider, { customBaseUrl } = {}) {
  const definition = PROVIDERS[provider];
  if (!definition) return null;
  const apiKey = await resolveApiKey(provider);
  const baseURL = provider === "custom" ? customBaseUrl || (await getAiSettings()).customBaseUrl : definition.baseURL;
  if (!apiKey || (provider === "custom" && !baseURL)) return null;
  return { provider, adapter: definition.adapter, apiKey, baseURL };
}

/**
 * The provider, model and key for one task ("chat" or "content"), or null when it isn't
 * configured: no key for the chosen provider, no model, or no base URL for a custom provider.
 */
export async function resolveAiTask(purpose) {
  const settings = await getAiSettings();
  const { provider, model } = settings[purpose];
  if (!model) return null;
  const resolved = await resolveProvider(provider, { customBaseUrl: settings.customBaseUrl });
  return resolved ? { ...resolved, model } : null;
}
