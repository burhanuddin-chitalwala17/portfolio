import { NextResponse } from "next/server";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { saveLeetcodeSettings } from "../../../../services/leetcode/settings";

/** PUT /api/admin/sources/leetcode — turns live LeetCode stats on or off. Body: { enabled, username } */
export async function PUT(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    const result = await saveLeetcodeSettings(await request.json().catch(() => null));
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true, settings: result.settings });
  } catch (error) {
    console.error("Saving LeetCode settings failed:", error);
    return jsonError("Saving failed. Please try again.", 500);
  }
}
