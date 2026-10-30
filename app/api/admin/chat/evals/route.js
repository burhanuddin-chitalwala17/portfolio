import { NextResponse } from "next/server";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { saveEvalSet } from "../../../../services/chatProfile/evals";

/** PUT /api/admin/chat/evals — saves the chat's test set. Body: { cases } */
export async function PUT(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const result = await saveEvalSet(body?.cases);
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true, cases: result.cases });
  } catch (error) {
    console.error("Saving the test set failed:", error);
    return jsonError("Saving failed. Please try again.", 500);
  }
}
