/*
 * The AI providers the chat and the content drafts can use. Claude goes through the Anthropic
 * SDK; every other provider speaks the OpenAI Chat Completions API, so one adapter covers them
 * all, including any OpenAI-compatible endpoint (custom base URL).
 * Shared by server code and the admin UI, so nothing secret belongs here.
 */

export const ADAPTERS = Object.freeze({ ANTHROPIC: "anthropic", OPENAI_COMPATIBLE: "openai-compatible" });

export const PROVIDERS = Object.freeze({
  anthropic: {
    label: "Anthropic (Claude)",
    adapter: ADAPTERS.ANTHROPIC,
    envKey: "ANTHROPIC_API_KEY",
    keyUrl: "https://console.anthropic.com/settings/keys",
    suggestedModel: "claude-opus-5-5",
  },
  openai: {
    label: "OpenAI",
    adapter: ADAPTERS.OPENAI_COMPATIBLE,
    envKey: "OPENAI_API_KEY",
    baseURL: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  gemini: {
    label: "Google Gemini",
    adapter: ADAPTERS.OPENAI_COMPATIBLE,
    envKey: "GEMINI_API_KEY",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openrouter: {
    label: "OpenRouter",
    adapter: ADAPTERS.OPENAI_COMPATIBLE,
    envKey: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  groq: {
    label: "Groq",
    adapter: ADAPTERS.OPENAI_COMPATIBLE,
    envKey: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    keyUrl: "https://console.groq.com/keys",
  },
  custom: {
    label: "Other (OpenAI-compatible URL)",
    adapter: ADAPTERS.OPENAI_COMPATIBLE,
    envKey: "CUSTOM_LLM_API_KEY",
  },
});

export const PROVIDER_IDS = Object.keys(PROVIDERS);

/** What each configurable AI task is called in the admin panel. */
export const AI_PURPOSES = Object.freeze({
  chat: { label: "Portfolio chat", help: "Answers visitors as you. A fast, inexpensive model works well." },
  content: {
    label: "Resume → content drafts",
    help: "Turns a new resume into site content. Use a strong model; it runs rarely.",
  },
});
