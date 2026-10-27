import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../../services/auth/requireAdmin";
import { getDocumentFileUrl } from "../../../../../services/documents/manageDocuments";

/**
 * GET /api/admin/documents/:id/file
 * Redirects to a short-lived link for an uploaded file. Add ?download=1 to save it instead of viewing it.
 */
export async function GET(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  try {
    const url = await getDocumentFileUrl(id, { download });
    if (!url) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("File link failed:", error);
    return NextResponse.json({ success: false, error: "Couldn't open the file" }, { status: 500 });
  }
}
