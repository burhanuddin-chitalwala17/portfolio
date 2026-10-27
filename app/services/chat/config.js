import "server-only";
import { isDatabaseConfigured } from "../db/client";

/** The chat needs an Anthropic key, and a database for rate limits and transcripts. */
export function isChatConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY) && isDatabaseConfigured();
}

export const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-opus-5-5";
export const CONTENT_MODEL = process.env.ANTHROPIC_CONTENT_MODEL || "claude-opus-5-5";

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const CHAT_LIMITS = Object.freeze({
  messagesPerVisitorPerHour: positiveInteger(process.env.CHAT_HOURLY_LIMIT_PER_VISITOR, 20),
  messagesPerDay: positiveInteger(process.env.CHAT_DAILY_LIMIT, 300),
  maxMessageCharacters: 1000,
  maxHistoryMessages: 16,
});
