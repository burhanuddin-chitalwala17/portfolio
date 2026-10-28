import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { PROVIDER_IDS } from "../../../../services/ai/providers";
import { describeAiError, getAdapter, resolveProvider } from "../../../../services/ai";

const Body = z.object({
  provider: z.enum(PROVIDER_IDS),
  customBaseUrl: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).optional(),
});

/**
 * POST /api/admin/ai/models
 * Lists the models a provider's key can use, for the model picker. Body: { provider, customBaseUrl? }
 */
export async function POST(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Unknown provider" }, { status: 400 });

  const resolved = await resolveProvider(parsed.data.provider, { customBaseUrl: parsed.data.customBaseUrl });
  if (!resolved) {
    return NextResponse.json({ success: false, error: "Add an API key (and base URL) for this provider first." }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, models: await getAdapter(resolved).listModels() });
  } catch (error) {
    console.error("Listing models failed:", error);
    return NextResponse.json({ success: false, error: describeAiError(error) }, { status: 502 });
  }
}
