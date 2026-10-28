import { NextResponse } from "next/server";
import { getStoredSitePhotos, PHOTO_KINDS } from "../../../services/sitePhoto/sitePhoto";
import { getObject } from "../../../services/storage/storage";

/**
 * GET /api/site-photo/:kind?v=<version>
 * Serves the uploaded profile photo ("photo") or hero cut-out ("cutout"). Each upload gets a new
 * version in its URL, so responses can be cached for a long time.
 */
export async function GET(_request, { params }) {
  const { kind } = await params;
  if (!PHOTO_KINDS[kind]) return new NextResponse("Not found", { status: 404 });
  try {
    const image = (await getStoredSitePhotos())[kind];
    if (!image) return new NextResponse("Not found", { status: 404 });
    const { body, contentType } = await getObject(image.key);
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType ?? "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Serving the profile photo failed:", error);
    return new NextResponse("Unavailable", { status: 503 });
  }
}
