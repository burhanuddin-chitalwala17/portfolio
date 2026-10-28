import "server-only";
import { desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";
import { getSiteResumeId } from "./siteResume";

const DOCUMENT_TYPES = Object.freeze({
  PDF: "pdf",
  WORD: "word",
  IMAGE: "image",
  TEXT: "text",
});

/** Everything uploaded through the admin panel, newest first. Files live in private storage. */
export async function getDocuments() {
  const db = getDb();
  if (!db) return [];

  const [rows, siteResumeId] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.uploadedAt)),
    getSiteResumeId(),
  ]);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    sizeInBytes: row.sizeInBytes,
    updatedAt: row.uploadedAt.toISOString(),
    previewUrl: `/api/admin/documents/${row.id}/file`,
    downloadUrl: `/api/admin/documents/${row.id}/file?download=1`,
    useInChat: row.useInChat,
    hasText: Boolean(row.extractedText),
    characters: row.extractedText?.length ?? 0,
    sensitiveFindings: row.sensitiveFindings,
    canBeSiteResume: row.contentType === "application/pdf",
    isSiteResume: row.id === siteResumeId,
  }));
}

export { DOCUMENT_TYPES };
