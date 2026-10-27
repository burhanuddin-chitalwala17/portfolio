import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../services/auth/requireAdmin";
import { isDatabaseConfigured } from "../../../services/db/client";
import { isStorageConfigured } from "../../../services/storage/storage";
import { UploadError, uploadDocument } from "../../../services/documents/manageDocuments";

/**
 * POST /api/admin/documents
 * Uploads one or more files sent as multipart form data under the "files" field.
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
  try {
    files = (await request.formData()).getAll("files").filter((item) => typeof item === "object");
  } catch {
    return NextResponse.json({ success: false, error: "The upload couldn't be read." }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ success: false, error: "No files were sent." }, { status: 400 });
  }

  const uploaded = [];
  const errors = [];
  for (const file of files) {
    try {
      const row = await uploadDocument(file);
      uploaded.push({ id: row.id, name: row.name });
    } catch (error) {
      if (error instanceof UploadError) {
        errors.push(error.message);
      } else {
        console.error("Upload failed:", error);
        errors.push(`${file.name}: upload failed. Please try again.`);
      }
    }
  }

  return NextResponse.json({ success: errors.length === 0, uploaded, errors }, { status: uploaded.length ? 200 : 400 });
}
