import { NextResponse } from "next/server";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { getPublishedContent } from "../../../../services/content/siteContent";
import { saveChatProfile } from "../../../../services/chatProfile/profile";

/** PUT /api/admin/chat/profile — saves the chat profile. Body: the whole profile. Live immediately. */
export async function PUT(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    const { content } = await getPublishedContent();
    const result = await saveChatProfile(await request.json().catch(() => null), { publicEmail: content.profile.email });
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true, profile: result.profile });
  } catch (error) {
    console.error("Saving the chat profile failed:", error);
    return jsonError("Saving failed. Please try again.", 500);
  }
}
