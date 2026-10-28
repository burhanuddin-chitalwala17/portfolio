import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "../../../services/auth/requireAdmin";
import { isDatabaseConfigured } from "../../../services/db/client";
import { saveAiSettings } from "../../../services/ai/settings";

/**
 * PUT /api/admin/ai
 * Saves which provider and model the chat and the content drafts use.
 * Body: { chat: {provider, model}, content: {provider, model}, customBaseUrl }
 */
export async function PUT(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Connect the database first." }, { status: 503 });
  }
  try {
    const result = await saveAiSettings(await request.json().catch(() => null));
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    // The homepage shows the chat only when it's configured.
    revalidatePath("/");
    return NextResponse.json({ success: true, settings: result.settings });
  } catch (error) {
    console.error("Saving AI settings failed:", error);
    return NextResponse.json({ success: false, error: "Saving failed. Please try again." }, { status: 500 });
  }
}
