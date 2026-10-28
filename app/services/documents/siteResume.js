import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, readWithRetry } from "../db/client";
import { documents } from "../db/schema";
import { readSetting, writeSetting } from "../settings/store";

/*
 * Which uploaded PDF visitors get as the resume. Chosen in Admin → Documents; the file stays in
 * private storage and is served through short-lived links (see /api/resume).
 */

const SETTINGS_KEY = "site_resume";
const SiteResumeSchema = z.object({ documentId: z.string().uuid().nullable() });
const NONE = Object.freeze({ documentId: null });

export class SiteResumeError extends Error {}

export async function getSiteResumeId() {
  return (await readSetting(SETTINGS_KEY, SiteResumeSchema, NONE)).documentId;
}

/** The chosen resume document, or null when none is chosen (or it has since been deleted). */
export async function getSiteResume() {
  const db = getDb();
  if (!db) return null;
  const id = await getSiteResumeId();
  if (!id) return null;
  const [row] = await db.select().from(documents).where(eq(documents.id, id));
  return row?.contentType === "application/pdf" ? row : null;
}

/** Whether visitors can view a resume. Errs on "no" so the site never links to a missing file. */
export async function hasSiteResume() {
  try {
    return Boolean(await readWithRetry(() => getSiteResume(), { timeoutMs: 4000, label: "Loading the site resume" }));
  } catch (error) {
    console.error("Checking the site resume failed:", error);
    return false;
  }
}

export async function setSiteResume(documentId) {
  const [row] = await getDb().select().from(documents).where(eq(documents.id, documentId));
  if (!row) throw new SiteResumeError("That document doesn't exist.");
  if (row.contentType !== "application/pdf") throw new SiteResumeError("Only a PDF can be the site resume.");
  await writeSetting(SETTINGS_KEY, { documentId });
}

/** Stops showing a resume. With `onlyIf`, only when that document is the current one. */
export async function clearSiteResume({ onlyIf } = {}) {
  if (onlyIf && (await getSiteResumeId()) !== onlyIf) return false;
  await writeSetting(SETTINGS_KEY, NONE);
  return true;
}
