import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { inspectDocument, UploadError } from "../../../../services/documents/manageDocuments";

/**
 * POST /api/admin/documents/scan
 * Checks files (multipart "files") for sensitive data without storing anything.
 */
export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  let files;
  try {
    files = (await request.formData()).getAll("files").filter((item) => typeof item === "object");
  } catch {
    return NextResponse.json({ success: false, error: "The files couldn't be read." }, { status: 400 });
  }

  const results = [];
  for (const file of files) {
    try {
      results.push({ name: file.name, ok: true, ...(await inspectDocument(file)) });
    } catch (error) {
      const message = error instanceof UploadError ? error.message : `${file.name}: couldn't be checked.`;
      if (!(error instanceof UploadError)) console.error("Scan failed:", error);
      results.push({ name: file.name, ok: false, error: message, findings: [] });
    }
  }
  return NextResponse.json({ success: true, results });
}
