import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { discardDraft, updateDraft } from "../../../../services/content/siteContent";

/**
 * PUT /api/admin/content/:id
 * Body: { content } — replaces a draft's content after validation.
 */
export async function PUT(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.content) {
    return NextResponse.json({ success: false, errors: ["Send the content as JSON."] }, { status: 400 });
  }
  const result = await updateDraft(id, body.content);
  if (!result.ok) return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/content/:id
 * Discards a draft. Published and archived versions are kept as history.
 */
export async function DELETE(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const discarded = await discardDraft(id);
  if (!discarded) {
    return NextResponse.json({ success: false, error: "Only drafts can be discarded." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
