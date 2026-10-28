import "server-only";
import { z } from "zod";
import { readSetting, writeSetting } from "../settings/store";

const SETTINGS_KEY = "leetcode";

export const LeetcodeSettingsSchema = z.object({
  enabled: z.boolean(),
  username: z.union([z.literal(""), z.string().regex(/^[\w-]{1,40}$/)]),
});

const DEFAULT_SETTINGS = Object.freeze({ enabled: false, username: "" });

export function getLeetcodeSettings() {
  return readSetting(SETTINGS_KEY, LeetcodeSettingsSchema, DEFAULT_SETTINGS);
}

export async function saveLeetcodeSettings(settings) {
  const parsed = LeetcodeSettingsSchema.safeParse(settings);
  if (!parsed.success) return { ok: false, error: "Use a valid LeetCode username." };
  await writeSetting(SETTINGS_KEY, parsed.data);
  return { ok: true, settings: parsed.data };
}

/** The username from a profile link like https://leetcode.com/u/name/, for prefilling the form. */
export function usernameFromProfileLink(link) {
  return link?.match(/leetcode\.com\/(?:u\/)?([\w-]+)/)?.[1] ?? "";
}
