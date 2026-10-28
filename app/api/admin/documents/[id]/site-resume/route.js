import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminRouteGuard, jsonError } from "../../../../../services/auth/adminRoute";
import { SiteResumeError, clearSiteResume, setSiteResume } from "../../../../../services/documents/siteResume";

/** PUT /api/admin/documents/:id/site-resume — makes this PDF the resume visitors see. */
export async function PUT(_request, { params }) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const { id } = await params;
  try {
    await setSiteResume(id);
    // The homepage shows its Resume buttons only when there is a resume.
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SiteResumeError) return jsonError(error.message, 400);
    console.error("Setting the site resume failed:", error);
    return jsonError("Couldn't set the resume. Please try again.", 500);
  }
}

/** DELETE /api/admin/documents/:id/site-resume — stops offering this document as the resume. */
export async function DELETE(_request, { params }) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const { id } = await params;
  try {
    await clearSiteResume({ onlyIf: id });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clearing the site resume failed:", error);
    return jsonError("Couldn't update the resume. Please try again.", 500);
  }
}
