import "server-only";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";
import { deleteObject, getObjectUrl, putObject } from "../storage/storage";
import { DOCUMENT_TYPES } from "./getDocuments";

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

/** Stores the file, then records it. If recording fails, the stored file is removed again. */
export async function uploadDocument(file) {
  const type = documentTypeFor(file.type);
  if (!type) throw new UploadError(`${file.name}: this file type isn't supported.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name}: files must be 4 MB or smaller.`);

  const storageKey = storageKeyFor(file.name);
  await putObject(storageKey, Buffer.from(await file.arrayBuffer()), file.type);
  try {
    const [row] = await getDb()
      .insert(documents)
      .values({ name: file.name, type, contentType: file.type, sizeInBytes: file.size, storageKey })
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
