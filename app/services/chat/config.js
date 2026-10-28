import "server-only";
import { isDatabaseConfigured, withTimeout } from "../db/client";
import { resolveAiTask } from "../ai/settings";

/**
 * The chat needs a database (rate limits, transcripts, settings) and a provider with a key and
 * a model, chosen in Admin → AI or taken from the environment.
 */
export async function isChatConfigured() {
  if (!isDatabaseConfigured()) return false;
  try {
    return Boolean(await withTimeout(resolveAiTask("chat"), 5000, "Loading AI settings"));
  } catch (error) {
    console.error("Checking the chat configuration failed:", error);
    return false;
  }
}

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
