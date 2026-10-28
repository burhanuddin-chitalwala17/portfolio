import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../services/auth/requireAdmin";
import { describeDatabaseError, isDatabaseConfigured } from "../../../services/db/client";
import { StorageError, isStorageConfigured } from "../../../services/storage/storage";
import { UploadError, uploadDocument } from "../../../services/documents/manageDocuments";

/**
 * POST /api/admin/documents
 * Uploads files sent as multipart "files", with an "options" JSON array of per-file choices.
 * A file only reaches the chat when its choice says so (and, if risky, the risk was confirmed).
 */
export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  if (!isDatabaseConfigured() || !isStorageConfigured()) {
    return NextResponse.json(
      { success: false, error: "Storage isn't connected yet. Add the database and storage settings in Vercel." },
      { status: 503 }
    );
  }

  let files;
  let options = [];
  try {
    const formData = await request.formData();
    files = formData.getAll("files").filter((item) => typeof item === "object");
    // Per-file choices, in the same order as the files: [{ useInChat, acknowledgedRisks }]
    options = JSON.parse(formData.get("options") || "[]");
  } catch {
    return NextResponse.json({ success: false, error: "The upload couldn't be read." }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ success: false, error: "No files were sent." }, { status: 400 });
  }

  const uploaded = [];
  const errors = [];
  for (const [index, file] of files.entries()) {
    try {
      const choice = options[index] ?? {};
      const row = await uploadDocument(file, {
        useInChat: choice.useInChat === true,
        acknowledgedRisks: choice.acknowledgedRisks === true,
      });
      uploaded.push({ id: row.id, name: row.name });
    } catch (error) {
      if (error instanceof UploadError) {
        errors.push(error.message);
      } else if (error instanceof StorageError) {
        console.error("Upload failed in storage:", error.cause ?? error);
        errors.push(`${file.name}: ${error.message}`);
      } else {
        // Only the signed-in admin sees this, so say what failed rather than a generic message.
        console.error("Upload failed:", error);
        errors.push(`${file.name}: saving it failed (${describeDatabaseError(error)}). Please try again.`);
      }
    }
  }

  return NextResponse.json({ success: errors.length === 0, uploaded, errors }, { status: uploaded.length ? 200 : 400 });
}
