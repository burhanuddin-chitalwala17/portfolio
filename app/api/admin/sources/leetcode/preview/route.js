import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../../services/auth/adminRoute";
import { getLeetcodeProfile } from "../../../../../services/leetcode/api";

const Body = z.object({ username: z.string().regex(/^[\w-]{1,40}$/) });

/** POST /api/admin/sources/leetcode/preview — fetches what the chat would see. Body: { username } */
export async function POST(request) {
  const denied = await adminRouteGuard({ needsDatabase: false });
  if (denied) return denied;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid LeetCode username.", 400);
  const profile = await getLeetcodeProfile(parsed.data.username);
  if (!profile?.solved) return jsonError("Couldn't load that profile from LeetCode. Check the username, or try again later.", 502);
  return NextResponse.json({ success: true, profile });
}
