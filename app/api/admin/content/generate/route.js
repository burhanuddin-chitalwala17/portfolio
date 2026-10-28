import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { getDb, isDatabaseConfigured } from "../../../../services/db/client";
import { documents } from "../../../../services/db/schema";
import { isStorageConfigured } from "../../../../services/storage/storage";
import { UploadError, uploadDocument } from "../../../../services/documents/manageDocuments";
import { createDraft, getPublishedContent } from "../../../../services/content/siteContent";
import { GenerationError, generateContentFromResume } from "../../../../services/content/generate";
import { AiProviderError, describeAiError } from "../../../../services/ai";

// Reading a resume and rewriting every section takes a while with high effort.
export const maxDuration = 300;

/**
 * POST /api/admin/content/generate
 * Multipart form with either "file" (a new resume, stored as a private document that the chat
 * doesn't use) or "documentId" (an uploaded document). Creates a draft for review.
 */
export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  if (!isDatabaseConfigured() || !isStorageConfigured()) {
    return NextResponse.json({ success: false, error: "Connect the database and storage first." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const documentId = formData.get("documentId");

    let document;
    if (file && typeof file === "object") {
      document = await uploadDocument(file, { useInChat: false });
    } else if (typeof documentId === "string" && documentId) {
      [document] = await getDb().select().from(documents).where(eq(documents.id, documentId));
    }
    if (!document) {
      return NextResponse.json({ success: false, error: "Choose a resume to read." }, { status: 400 });
    }

    const { content: currentContent } = await getPublishedContent();
    const generated = await generateContentFromResume({ resumeText: document.extractedText, currentContent });
    const privacyNote = generated.privacyFindings.length
      ? ` Privacy check: the draft mentions ${generated.privacyFindings.map((finding) => finding.label.toLowerCase()).join(", ")}. Review before publishing.`
      : "";
    const result = await createDraft({
      content: generated.content,
      summary: `${generated.changeSummary}${privacyNote}`,
      sourceDocumentId: document.contentType === "application/pdf" ? document.id : null,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: `The draft wasn't valid: ${result.errors.join("; ")}` }, { status: 422 });
    }
    return NextResponse.json({ success: true, id: result.row.id });
  } catch (error) {
    if (error instanceof UploadError || error instanceof GenerationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Content generation failed:", error);
    if (error instanceof AiProviderError) {
      return NextResponse.json({ success: false, error: describeAiError(error) }, { status: 502 });
    }
    return NextResponse.json({ success: false, error: "Generating the draft failed. Please try again." }, { status: 500 });
  }
}
