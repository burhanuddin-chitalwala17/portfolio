import { NextResponse } from "next/server";
import { adminRouteGuard } from "../../../../../services/auth/adminRoute";
import { suggestEvalCases } from "../../../../../services/chatProfile/evals";
import { chatAdminError } from "../../../../../services/chatProfile/routeError";

export const maxDuration = 300;

/** POST /api/admin/chat/evals/suggest — drafts test questions from what the chat knows; nothing is saved. */
export async function POST() {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, cases: await suggestEvalCases() });
  } catch (error) {
    return chatAdminError(error, "Suggesting tests");
  }
}
