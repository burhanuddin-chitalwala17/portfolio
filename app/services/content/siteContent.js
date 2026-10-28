import "server-only";
import { cache } from "react";
import { and, desc, eq, ne } from "drizzle-orm";
import { getDb, readWithRetry } from "../db/client";
import { siteContent } from "../db/schema";
import { defaultContent } from "../../data/siteData";
import { ContentSchema, describeIssues } from "./schema";

// The built-in content, normalised through the same schema as published versions.
const fallbackContent = ContentSchema.parse(defaultContent);

export const CONTENT_STATUSES = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DISCARDED: "discarded",
});

// Colours for project cards that don't have their own yet.
const PROJECT_PALETTE = [
  { from: "#0f172a", via: "#2563eb", to: "#5eead4" },
  { from: "#431407", via: "#ea580c", to: "#fde68a" },
  { from: "#1e1b4b", via: "#7c3aed", to: "#f5b83d" },
  { from: "#022c22", via: "#059669", to: "#fef08a" },
  { from: "#0c4a6e", via: "#0891b2", to: "#a7f3d0" },
  { from: "#111827", via: "#4338ca", to: "#f472b6" },
  { from: "#450a0a", via: "#b91c1c", to: "#fb923c" },
];

/** Fills in project colours so every card has one. */
export function withProjectArt(content, previous = fallbackContent) {
  const previousArt = new Map(previous.projects.filter((project) => project.art).map((project) => [project.id, project.art]));
  return {
    ...content,
    projects: content.projects.map((project, index) => ({
      ...project,
      art: project.art ?? previousArt.get(project.id) ?? PROJECT_PALETTE[index % PROJECT_PALETTE.length],
    })),
  };
}

export function validateContent(content) {
  const result = ContentSchema.safeParse(content);
  return result.success
    ? { ok: true, content: withProjectArt(result.data) }
    : { ok: false, errors: describeIssues(result.error) };
}

/**
 * The content the homepage shows: the published version if there is one and it is valid,
 * otherwise the defaults in app/data/siteData.js. Cached per request, so a page and its metadata
 * share one database read.
 */
export const getPublishedContent = cache(async function getPublishedContent() {
  if (!getDb()) return { content: fallbackContent, versionId: null };
  try {
    const [row] = await readWithRetry(
      () =>
        getDb()
          .select()
          .from(siteContent)
          .where(eq(siteContent.status, CONTENT_STATUSES.PUBLISHED))
          .orderBy(desc(siteContent.publishedAt))
          .limit(1),
      { timeoutMs: 4000, label: "Loading published content" }
    );
    if (!row) return { content: fallbackContent, versionId: null };
    const validated = validateContent(row.content);
    if (!validated.ok) {
      console.error("Published content is invalid, showing defaults:", validated.errors);
      return { content: fallbackContent, versionId: null };
    }
    return {
      content: validated.content,
      versionId: row.id,
      sourceDocumentId: row.sourceDocumentId,
      publishedAt: row.publishedAt,
    };
  } catch (error) {
    console.error("Loading published content failed, showing defaults:", error);
    return { content: fallbackContent, versionId: null };
  }
});

export async function listContentVersions() {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(siteContent)
    .where(ne(siteContent.status, CONTENT_STATUSES.DISCARDED))
    .orderBy(desc(siteContent.createdAt))
    .limit(30);
}

export async function getContentVersion(id) {
  const [row] = await getDb().select().from(siteContent).where(eq(siteContent.id, id));
  return row ?? null;
}

export async function createDraft({ content, summary, sourceDocumentId = null }) {
  const validated = validateContent(content);
  if (!validated.ok) return validated;
  const [row] = await getDb()
    .insert(siteContent)
    .values({ status: CONTENT_STATUSES.DRAFT, content: validated.content, summary, sourceDocumentId })
    .returning();
  return { ok: true, row };
}

export async function updateDraft(id, content) {
  const validated = validateContent(content);
  if (!validated.ok) return validated;
  const [row] = await getDb()
    .update(siteContent)
    .set({ content: validated.content })
    .where(and(eq(siteContent.id, id), eq(siteContent.status, CONTENT_STATUSES.DRAFT)))
    .returning();
  return row ? { ok: true, row } : { ok: false, errors: ["Only drafts can be edited."] };
}

/** Publishes a draft, or re-publishes an older version (rollback). The previous one is archived. */
export async function publishVersion(id) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(siteContent).where(eq(siteContent.id, id));
    if (!row || row.status === CONTENT_STATUSES.DISCARDED) return { ok: false, errors: ["Version not found."] };
    const validated = validateContent(row.content);
    if (!validated.ok) return validated;
    await tx
      .update(siteContent)
      .set({ status: CONTENT_STATUSES.ARCHIVED })
      .where(eq(siteContent.status, CONTENT_STATUSES.PUBLISHED));
    const [published] = await tx
      .update(siteContent)
      .set({ status: CONTENT_STATUSES.PUBLISHED, publishedAt: new Date() })
      .where(eq(siteContent.id, id))
      .returning();
    return { ok: true, row: published };
  });
}

export async function discardDraft(id) {
  const [row] = await getDb()
    .update(siteContent)
    .set({ status: CONTENT_STATUSES.DISCARDED })
    .where(and(eq(siteContent.id, id), eq(siteContent.status, CONTENT_STATUSES.DRAFT)))
    .returning();
  return Boolean(row);
}
