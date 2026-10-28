import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { appSettings, providerKeys } from "../db/schema";
import { canStoreSecrets, decryptSecret, encryptSecret } from "./secrets";

/*
 * Settings and secrets edited from the admin panel. Settings are small JSON values validated by
 * the caller's schema; secrets (API keys, tokens) are encrypted and never leave the server.
 */

/** Reads a setting, falling back when nothing valid is stored (or there's no database). */
export async function readSetting(key, schema, fallback) {
  const db = getDb();
  if (!db) return fallback;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  const parsed = schema.safeParse(row?.value);
  return parsed.success ? parsed.data : fallback;
}

export async function writeSetting(key, value) {
  await getDb()
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

/** A secret saved in the admin panel, or the environment variable as a fallback. */
export async function readSecret(id, envKey) {
  const db = getDb();
  const [row] = db ? await db.select().from(providerKeys).where(eq(providerKeys.provider, id)) : [];
  const fromAdmin = row ? decryptSecret(row.encryptedKey) : null;
  return fromAdmin || (envKey && process.env[envKey]) || null;
}

/**
 * Where each secret comes from, for the admin panel. Never includes the secret itself.
 * @param {Record<string, string | undefined>} envKeys secret id → environment variable name
 * @returns {Promise<Record<string, {source: "admin" | "env" | "none", hint?: string, unreadable?: boolean}>>}
 */
export async function secretStatuses(envKeys) {
  const db = getDb();
  const rows = db ? await db.select().from(providerKeys) : [];
  const stored = new Map(rows.map((row) => [row.provider, row]));
  return Object.fromEntries(
    Object.entries(envKeys).map(([id, envKey]) => {
      const row = stored.get(id);
      if (row) {
        const unreadable = decryptSecret(row.encryptedKey) === null;
        return [id, { source: "admin", hint: row.keyHint, unreadable, updatedAt: row.updatedAt.toISOString() }];
      }
      return [id, { source: envKey && process.env[envKey] ? "env" : "none" }];
    })
  );
}

export async function saveSecret(id, value) {
  if (!canStoreSecrets()) return { ok: false, error: "Set ADMIN_SESSION_SECRET in Vercel before saving keys here." };
  const keyHint = value.slice(-4);
  const encryptedKey = encryptSecret(value);
  await getDb()
    .insert(providerKeys)
    .values({ provider: id, encryptedKey, keyHint })
    .onConflictDoUpdate({ target: providerKeys.provider, set: { encryptedKey, keyHint, updatedAt: new Date() } });
  return { ok: true };
}

export async function deleteSecret(id) {
  await getDb().delete(providerKeys).where(eq(providerKeys.provider, id));
}
