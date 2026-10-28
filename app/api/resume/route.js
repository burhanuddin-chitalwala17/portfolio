import { NextResponse } from "next/server";
import { getSiteResume } from "../../services/documents/siteResume";
import { getObjectUrl } from "../../services/storage/storage";

/**
 * GET /api/resume
 * Sends visitors to the resume chosen in Admin → Documents, through a short-lived link to the
 * private file. Never cached, since each link expires.
 */
export async function GET() {
  try {
    const resume = await getSiteResume();
    if (!resume) return new NextResponse("No resume is published yet.", { status: 404 });
    const response = NextResponse.redirect(await getObjectUrl(resume.storageKey));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Serving the resume failed:", error);
    return new NextResponse("The resume isn't available right now. Please try again shortly.", { status: 503 });
  }
}
