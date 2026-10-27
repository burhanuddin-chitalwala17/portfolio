import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequest } from "../../../../../services/auth/requireAdmin";
import { publishVersion } from "../../../../../services/content/siteContent";

/**
 * POST /api/admin/content/:id/publish
 * Makes a draft (or an older version, to roll back) the live content and rebuilds the homepage.
 */
export async function POST(_request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const result = await publishVersion(id);
    if (!result.ok) return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Publish failed:", error);
    return NextResponse.json({ success: false, errors: ["Publishing failed. Please try again."] }, { status: 500 });
  }
}
