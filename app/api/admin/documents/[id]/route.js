import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { deleteDocument, setDocumentChatUse, UploadError } from "../../../../services/documents/manageDocuments";

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

/**
 * PATCH /api/admin/documents/:id
 * Body: { useInChat: boolean, acknowledgedRisks?: boolean }
 */
export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.useInChat !== "boolean") {
    return NextResponse.json({ success: false, error: "useInChat must be true or false" }, { status: 400 });
  }
  try {
    const row = await setDocumentChatUse(id, {
      useInChat: body.useInChat,
      acknowledgedRisks: body.acknowledgedRisks === true,
    });
    if (!row) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Chat setting failed:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
