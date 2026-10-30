import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { AnswersSchema, TopicSchema, draftSection } from "../../../../services/chatProfile/interview";
import { chatAdminError } from "../../../../services/chatProfile/routeError";

export const maxDuration = 300;

/**
 * POST /api/admin/chat/draft — drafts a profile section for review; nothing is saved.
 * Body: { topic, answers?: [{question, answer}] }
 */
export async function POST(request) {
  const denied = await adminRouteGuard();
  if (denied) return denied;
  const parsed = z
    .object({ topic: TopicSchema, answers: AnswersSchema.default([]) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Answers can be up to 4,000 characters each.", 400);
  try {
    return NextResponse.json({ success: true, draft: await draftSection(parsed.data.topic, parsed.data.answers) });
  } catch (error) {
    return chatAdminError(error, "Writing the draft");
  }
}
