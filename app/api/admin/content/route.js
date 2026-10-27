import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../services/auth/requireAdmin";
import { isDatabaseConfigured } from "../../../services/db/client";
import { createDraft, getPublishedContent } from "../../../services/content/siteContent";

/**
 * POST /api/admin/content
 * Starts a draft from the live content, for editing by hand.
 */
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Connect the database first." }, { status: 503 });
  }
  const { content, sourceDocumentId } = await getPublishedContent();
  // Keep the live version's resume, so publishing a hand edit doesn't change the resume link.
  const result = await createDraft({ content, summary: "Manual edit of the live content.", sourceDocumentId });
  if (!result.ok) return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
  return NextResponse.json({ success: true, id: result.row.id });
}
