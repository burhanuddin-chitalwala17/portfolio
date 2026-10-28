import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminRouteGuard, jsonError } from "../../../../services/auth/adminRoute";
import { PHOTO_KINDS, SitePhotoError, resetSitePhoto, saveSitePhoto } from "../../../../services/sitePhoto/sitePhoto";
import { StorageError } from "../../../../services/storage/storage";

async function guard(params) {
  const denied = await adminRouteGuard();
  if (denied) return { denied };
  const { kind } = await params;
  if (!PHOTO_KINDS[kind]) return { denied: jsonError("Unknown photo type.", 404) };
  return { kind };
}

function failure(error, action) {
  if (error instanceof SitePhotoError || error instanceof StorageError) return jsonError(error.message, 400);
  console.error(`${action} failed:`, error);
  return jsonError(`${action} failed. Please try again.`, 500);
}

/** PUT /api/admin/site-photo/:kind — multipart "file". Replaces the photo or the hero cut-out. */
export async function PUT(request, { params }) {
  const { denied, kind } = await guard(params);
  if (denied) return denied;
  const file = (await request.formData().catch(() => null))?.get("file");
  if (!file || typeof file !== "object") return jsonError("Choose an image to upload.", 400);
  try {
    await saveSitePhoto(kind, file);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error, "Uploading the photo");
  }
}

/** DELETE /api/admin/site-photo/:kind — goes back to the built-in image. */
export async function DELETE(_request, { params }) {
  const { denied, kind } = await guard(params);
  if (denied) return denied;
  try {
    await resetSitePhoto(kind);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error, "Resetting the photo");
  }
}
