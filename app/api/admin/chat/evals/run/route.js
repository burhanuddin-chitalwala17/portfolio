import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../../services/auth/adminRoute";
import { runEvalCase } from "../../../../../services/chatProfile/evals";
import { chatAdminError } from "../../../../../services/chatProfile/routeError";

// One test: a full chat reply (possibly reading GitHub) plus grading.
export const maxDuration = 120;

/** POST /api/admin/chat/evals/run — runs one saved test and stores its grade. Body: { caseId } */
export async function POST(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const parsed = z.object({ caseId: z.string().min(1).max(40) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose a test to run.", 400);
  try {
    return NextResponse.json({ success: true, result: await runEvalCase(parsed.data.caseId) });
  } catch (error) {
    return chatAdminError(error, "Running the test");
  }
}
