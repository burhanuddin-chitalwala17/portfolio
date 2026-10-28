import "server-only";
import { z } from "zod";
import { deleteSecret, readSecret, readSetting, saveSecret, secretStatuses, writeSetting } from "../settings/store";
import { PROVIDERS, PROVIDER_IDS } from "./providers";

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

export function getAiSettings() {
  return readSetting(SETTINGS_KEY, AiSettingsSchema, DEFAULT_SETTINGS);
}

export async function saveAiSettings(settings) {
  const parsed = AiSettingsSchema.safeParse(settings);
  if (!parsed.success) return { ok: false, error: "Choose a provider and model for each task, and use an https:// base URL." };
  await writeSetting(SETTINGS_KEY, parsed.data);
  return { ok: true, settings: parsed.data };
}

/** Where each provider's key comes from, for the admin panel. Never includes the key itself. */
export function getKeyStatuses() {
  return secretStatuses(Object.fromEntries(PROVIDER_IDS.map((id) => [id, PROVIDERS[id].envKey])));
}

export const saveProviderKey = saveSecret;
export const deleteProviderKey = deleteSecret;

/**
 * Everything needed to call a provider directly, for listing models or testing a key that
 * isn't selected yet. Returns null when the provider has no usable key.
 */
export async function resolveProvider(provider, { customBaseUrl } = {}) {
  const definition = PROVIDERS[provider];
  if (!definition) return null;
  // A key saved in the admin panel wins over the environment variable.
  const apiKey = await readSecret(provider, definition.envKey);
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
