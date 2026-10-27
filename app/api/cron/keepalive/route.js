import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../services/db/client";

/**
 * GET /api/cron/keepalive
 * Runs daily (see vercel.json) so a free-tier database isn't paused for inactivity.
 * When CRON_SECRET is set, Vercel sends it as a bearer token and other callers are refused.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ success: true, database: "not configured" });
  }
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ success: true, database: "ok" });
  } catch (error) {
    console.error("Keepalive failed:", error);
    return NextResponse.json({ success: false, database: "unreachable" }, { status: 500 });
  }
}
