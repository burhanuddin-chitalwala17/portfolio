import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminLoginAttempts } from "../db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

/**
 * True when this visitor has failed to sign in too many times recently. Without a database
 * there's nothing to count, so nobody is locked out.
 */
export async function isLockedOut(ipHash) {
  const db = getDb();
  if (!db) return false;
  const [row] = await db
    .select({ value: count() })
    .from(adminLoginAttempts)
    .where(
      and(
        eq(adminLoginAttempts.ipHash, ipHash),
        eq(adminLoginAttempts.succeeded, false),
        gte(adminLoginAttempts.attemptedAt, new Date(Date.now() - WINDOW_MS))
      )
    );
  return row.value >= MAX_FAILURES;
}

export async function recordLoginAttempt(ipHash, succeeded) {
  const db = getDb();
  if (!db) return;
  await db.insert(adminLoginAttempts).values({ ipHash, succeeded });
}
