import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { TopicSchema, interviewQuestions } from "../../../../services/chatProfile/interview";
import { chatAdminError } from "../../../../services/chatProfile/routeError";

export const maxDuration = 120;

/** POST /api/admin/chat/interview — interview questions for a profile section. Body: { topic } */
export async function POST(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const parsed = z.object({ topic: TopicSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Choose what to be interviewed about.", 400);
  try {
    return NextResponse.json({ success: true, questions: await interviewQuestions(parsed.data.topic) });
  } catch (error) {
    return chatAdminError(error, "Preparing the interview");
  }
}
