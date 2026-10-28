import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const VERSION = "v1";

function encryptionKey() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return Buffer.from(hkdfSync("sha256", secret, "portfolio-settings", "provider-api-keys", 32));
}

/** True when API keys can be stored from the admin panel (an encryption secret is configured). */
export function canStoreSecrets() {
  return Boolean(encryptionKey());
}

/** Encrypts with AES-256-GCM. Output: `v1:<iv>:<tag>:<ciphertext>`, base64 parts. */
export function encryptSecret(plaintext) {
  const key = encryptionKey();
  if (!key) throw new Error("Set ADMIN_SESSION_SECRET (or SETTINGS_ENCRYPTION_KEY) to store API keys.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(":");
}

/**
 * Decrypts a value from encryptSecret, or returns null if it can't be read (for example after
 * the secret it was encrypted with was changed). The key then has to be entered again.
 */
export function decryptSecret(value) {
  const key = encryptionKey();
  const [version, iv, tag, ciphertext] = value?.split(":") ?? [];
  if (!key || version !== VERSION || !iv || !tag || !ciphertext) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
