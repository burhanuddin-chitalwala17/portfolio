import "server-only";
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "../db/client";
import { isAdminRequest } from "./requireAdmin";

/**
 * The common checks for an admin API route: a signed-in admin and, when `needsDatabase`, a
 * configured database. Returns an error response to send back, or null to carry on.
 */
export async function adminRouteGuard({ needsDatabase = true } = {}) {
  if (!(await isAdminRequest())) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  if (needsDatabase && !isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Connect the database first." }, { status: 503 });
  }
  return null;
}

export function jsonError(error, status) {
  return NextResponse.json({ success: false, error }, { status });
}
