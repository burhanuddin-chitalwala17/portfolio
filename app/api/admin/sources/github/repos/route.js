import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../../services/auth/adminRoute";
import { GithubError, listRepositories } from "../../../../../services/github/api";
import { getGithubToken } from "../../../../../services/github/settings";

const Body = z.object({ username: z.string().regex(/^[a-zA-Z\d](?:[a-zA-Z\d-]{0,38})$/) });

/**
 * POST /api/admin/sources/github/repos
 * Lists the repositories the chat could be given. With a token, that's the token owner's
 * repositories, private ones included. Body: { username }
 */
export async function POST(request) {
  const denied = await adminRouteGuard({ needsDatabase: false });
  if (denied) return denied;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid GitHub username.", 400);
  try {
    const repos = await listRepositories({ username: parsed.data.username, token: await getGithubToken() });
    return NextResponse.json({ success: true, repos });
  } catch (error) {
    if (error instanceof GithubError) return jsonError(error.message, error.kind === "not_found" ? 404 : 502);
    console.error("Listing GitHub repositories failed:", error);
    return jsonError("Couldn't load repositories. Please try again.", 500);
  }
}
