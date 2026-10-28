import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../../services/auth/adminRoute";
import { deleteGithubToken, saveGithubToken } from "../../../../../services/github/settings";

const Body = z.object({ token: z.string().trim().min(20).max(300).regex(/^\S+$/) });

/** PUT /api/admin/sources/github/token — stores a GitHub token, encrypted. Body: { token }. Never returned. */
export async function PUT(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Paste the full token, without spaces.", 400);
  try {
    const result = await saveGithubToken(parsed.data.token);
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Saving the GitHub token failed:", error);
    return jsonError("Saving the token failed. Please try again.", 500);
  }
}

/** DELETE /api/admin/sources/github/token — removes the stored token. */
export async function DELETE() {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    await deleteGithubToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Removing the GitHub token failed:", error);
    return jsonError("Removing the token failed. Please try again.", 500);
  }
}
