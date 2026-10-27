import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../services/db/client";
import { documents } from "../../services/db/schema";
import { getPublishedContent } from "../../services/content/siteContent";
import { getObjectUrl } from "../../services/storage/storage";

const BUNDLED_RESUME = "/docs/resume.pdf";

/**
 * GET /api/resume
 * Sends visitors to the resume behind the published content: the uploaded PDF it was
 * generated from, or the resume bundled with the site.
 */
export async function GET(request) {
  const fallback = NextResponse.redirect(new URL(BUNDLED_RESUME, request.url));
  try {
    const { sourceDocumentId } = await getPublishedContent();
    if (!sourceDocumentId) return fallback;
    const [row] = await getDb().select().from(documents).where(eq(documents.id, sourceDocumentId));
    if (!row || row.contentType !== "application/pdf") return fallback;
    return NextResponse.redirect(await getObjectUrl(row.storageKey));
  } catch (error) {
    console.error("Resume link failed, using the bundled resume:", error);
    return fallback;
  }
}
