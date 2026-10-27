import "server-only";
import { desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";

const DOCUMENT_TYPES = Object.freeze({
  PDF: "pdf",
  WORD: "word",
  IMAGE: "image",
  TEXT: "text",
});

// Files that ship with the site in /public. They can't be deleted from the admin panel.
const bundledDocuments = [
  {
    id: "resume",
    name: "Resume (on the site)",
    type: DOCUMENT_TYPES.PDF,
    sizeInBytes: 6_912,
    updatedAt: "2026-10-27T00:00:00.000Z",
    previewUrl: "/docs/resume.pdf",
    downloadUrl: "/docs/resume.pdf",
    source: "bundled",
    useInChat: false,
    hasText: false,
    sensitiveFindings: [],
  },
];

/**
 * Returns the bundled files plus everything uploaded through the admin panel, newest first.
 */
export async function getDocuments() {
  const db = getDb();
  if (!db) return bundledDocuments;

  const rows = await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  const uploaded = rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    sizeInBytes: row.sizeInBytes,
    updatedAt: row.uploadedAt.toISOString(),
    previewUrl: `/api/admin/documents/${row.id}/file`,
    downloadUrl: `/api/admin/documents/${row.id}/file?download=1`,
    source: "upload",
    useInChat: row.useInChat,
    hasText: Boolean(row.extractedText),
    characters: row.extractedText?.length ?? 0,
    sensitiveFindings: row.sensitiveFindings,
  }));
  return [...uploaded, ...bundledDocuments];
}

export { DOCUMENT_TYPES };
