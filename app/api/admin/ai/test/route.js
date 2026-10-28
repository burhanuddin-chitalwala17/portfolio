import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { PROVIDER_IDS } from "../../../../services/ai/providers";
import { describeAiError, getAdapter, resolveProvider } from "../../../../services/ai";

export const maxDuration = 60;

const Body = z.object({
  provider: z.enum(PROVIDER_IDS),
  model: z.string().trim().min(1).max(120),
  customBaseUrl: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).optional(),
});

/**
 * POST /api/admin/ai/test
 * Sends a tiny prompt to a provider and model to check the key and model work before saving.
 * Body: { provider, model, customBaseUrl? }
 */
export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Choose a provider and model." }, { status: 400 });

  const resolved = await resolveProvider(parsed.data.provider, { customBaseUrl: parsed.data.customBaseUrl });
  if (!resolved) {
    return NextResponse.json({ success: false, error: "Add an API key (and base URL) for this provider first." }, { status: 400 });
  }
  const startedAt = Date.now();
  try {
    let reply = "";
    await getAdapter({ ...resolved, model: parsed.data.model }).streamChat({
      instructions: "You are checking that an API connection works.",
      knowledge: "Reply with one short friendly sentence.",
      messages: [{ role: "user", content: "Say hello." }],
      onText: (delta) => {
        reply += delta;
      },
    });
    return NextResponse.json({ success: true, reply: reply.trim().slice(0, 300), milliseconds: Date.now() - startedAt });
  } catch (error) {
    console.error("AI connection test failed:", error);
    return NextResponse.json({ success: false, error: describeAiError(error) }, { status: 502 });
  }
}
