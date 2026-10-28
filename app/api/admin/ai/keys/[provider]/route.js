import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminRequest } from "../../../../../services/auth/requireAdmin";
import { isDatabaseConfigured } from "../../../../../services/db/client";
import { PROVIDER_IDS } from "../../../../../services/ai/providers";
import { deleteProviderKey, saveProviderKey } from "../../../../../services/ai/settings";

const KeyBody = z.object({ apiKey: z.string().trim().min(10).max(500).regex(/^\S+$/) });

async function guard(params) {
  if (!(await isAdminRequest())) return { error: NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 }) };
  if (!isDatabaseConfigured()) {
    return { error: NextResponse.json({ success: false, error: "Connect the database first." }, { status: 503 }) };
  }
  const { provider } = await params;
  if (!PROVIDER_IDS.includes(provider)) {
    return { error: NextResponse.json({ success: false, error: "Unknown provider" }, { status: 404 }) };
  }
  return { provider };
}

/**
 * PUT /api/admin/ai/keys/:provider
 * Stores (or replaces) a provider's API key, encrypted. Body: { apiKey }. The key is never sent back.
 */
export async function PUT(request, { params }) {
  const { provider, error } = await guard(params);
  if (error) return error;
  const parsed = KeyBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Paste the full API key, without spaces." }, { status: 400 });
  }
  try {
    const result = await saveProviderKey(provider, parsed.data.apiKey);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (saveError) {
    console.error("Saving an API key failed:", saveError);
    return NextResponse.json({ success: false, error: "Saving the key failed. Please try again." }, { status: 500 });
  }
}

/** DELETE /api/admin/ai/keys/:provider — removes the stored key (an environment variable, if set, applies again). */
export async function DELETE(_request, { params }) {
  const { provider, error } = await guard(params);
  if (error) return error;
  try {
    await deleteProviderKey(provider);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (deleteError) {
    console.error("Removing an API key failed:", deleteError);
    return NextResponse.json({ success: false, error: "Removing the key failed. Please try again." }, { status: 500 });
  }
}
