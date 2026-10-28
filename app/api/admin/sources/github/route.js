import { NextResponse } from "next/server";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { saveGithubSettings } from "../../../../services/github/settings";

/**
 * PUT /api/admin/sources/github
 * Saves the GitHub username and the repositories the chat may read. Body: { username, repos: ["owner/name"] }
 */
export async function PUT(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    const result = await saveGithubSettings(await request.json().catch(() => null));
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true, settings: result.settings });
  } catch (error) {
    console.error("Saving GitHub settings failed:", error);
    return jsonError("Saving failed. Please try again.", 500);
  }
}
