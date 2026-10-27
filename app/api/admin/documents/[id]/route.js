import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { deleteDocument } from "../../../../services/documents/manageDocuments";

/**
 * DELETE /api/admin/documents/:id
 * Removes an uploaded file from storage and from the document library.
 */
export async function DELETE(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const deleted = await deleteDocument(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
