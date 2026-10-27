import "server-only";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";
import { deleteObject, getObjectUrl, putObject } from "../storage/storage";
import { DOCUMENT_TYPES } from "./getDocuments";
import { extractText } from "./extractText";
import { scanSensitiveData } from "../privacy/sensitiveData";
import { profile } from "../../data/siteData";

// Vercel rejects request bodies over 4.5 MB, so keep each upload under that.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const TYPE_BY_CONTENT_TYPE = {
  "application/pdf": DOCUMENT_TYPES.PDF,
  "application/msword": DOCUMENT_TYPES.WORD,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DOCUMENT_TYPES.WORD,
  "text/plain": DOCUMENT_TYPES.TEXT,
  "text/markdown": DOCUMENT_TYPES.TEXT,
};

export function documentTypeFor(contentType) {
  if (contentType?.startsWith("image/")) return DOCUMENT_TYPES.IMAGE;
  return TYPE_BY_CONTENT_TYPE[contentType] ?? null;
}

function storageKeyFor(fileName) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  return `documents/${randomUUID()}-${safeName}`;
}

// Values that are already public on the site and shouldn't count as risky.
const PUBLIC_VALUES = [profile.email];

function checkFile(file) {
  const type = documentTypeFor(file.type);
  if (!type) throw new UploadError(`${file.name}: this file type isn't supported.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name}: files must be 4 MB or smaller.`);
  return type;
}

async function readFile(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = null;
  try {
    text = await extractText(buffer, file.type);
  } catch (error) {
    console.error(`Text extraction failed for ${file.name}:`, error);
  }
  return { buffer, text, findings: scanSensitiveData(text, { allowed: PUBLIC_VALUES }) };
}

/**
 * Checks a file without storing it: is it allowed, does it have readable text, and what
 * sensitive data does it contain. The admin panel shows this before anything is uploaded.
 */
export async function inspectDocument(file) {
  checkFile(file);
  const { text, findings } = await readFile(file);
  return { hasText: Boolean(text), characters: text?.length ?? 0, findings };
}

/**
 * Stores the file and records it. The chat may only use it when `useInChat` is set, and a file
 * with sensitive findings additionally needs `acknowledgedRisks`. If recording fails, the
 * stored file is removed again.
 */
export async function uploadDocument(file, { useInChat = false, acknowledgedRisks = false } = {}) {
  const type = checkFile(file);
  const { buffer, text, findings } = await readFile(file);
  if (useInChat && findings.length && !acknowledgedRisks) {
    throw new UploadError(`${file.name}: confirm the sensitive-data warning before letting the chat use it.`);
  }

  const storageKey = storageKeyFor(file.name);
  await putObject(storageKey, buffer, file.type);
  try {
    const [row] = await getDb()
      .insert(documents)
      .values({
        name: file.name,
        type,
        contentType: file.type,
        sizeInBytes: file.size,
        storageKey,
        extractedText: text,
        useInChat: Boolean(useInChat && text),
        sensitiveFindings: findings,
      })
      .returning();
    return row;
  } catch (error) {
    await deleteObject(storageKey).catch(() => {});
    throw error;
  }
}

export async function deleteDocument(id) {
  const db = getDb();
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  if (!row) return false;
  await deleteObject(row.storageKey);
  await db.delete(documents).where(eq(documents.id, id));
  return true;
}

export async function getDocumentFileUrl(id, { download = false } = {}) {
  const [row] = await getDb().select().from(documents).where(eq(documents.id, id));
  if (!row) return null;
  return getObjectUrl(row.storageKey, { downloadName: download ? row.name : undefined });
}

export class UploadError extends Error {}

/** Lets the chat use a document, or stops it. Sensitive documents need `acknowledgedRisks`. */
export async function setDocumentChatUse(id, { useInChat, acknowledgedRisks = false }) {
  const db = getDb();
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  if (!row) return null;
  if (useInChat && !row.extractedText) throw new UploadError("This file has no readable text for the chat.");
  if (useInChat && row.sensitiveFindings.length && !acknowledgedRisks) {
    throw new UploadError("Confirm the sensitive-data warning before letting the chat use this file.");
  }
  const [updated] = await db.update(documents).set({ useInChat }).where(eq(documents.id, id)).returning();
  return updated;
}
