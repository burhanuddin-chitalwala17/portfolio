import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb, readWithRetry, withTimeout } from "../db/client";
import { adminLoginAttempts } from "../db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const QUERY_TIMEOUT_MS = 3000;

/**
 * True when this visitor has failed to sign in too many times recently. Without a database
 * there's nothing to count, so nobody is locked out. If the database is down or slow, sign-in
 * still works (the password is checked either way) rather than locking the owner out.
 */
export async function isLockedOut(ipHash) {
  if (!getDb()) return false;
  try {
    const [row] = await readWithRetry(
      () =>
        getDb()
          .select({ value: count() })
          .from(adminLoginAttempts)
          .where(
            and(
              eq(adminLoginAttempts.ipHash, ipHash),
              eq(adminLoginAttempts.succeeded, false),
              gte(adminLoginAttempts.attemptedAt, new Date(Date.now() - WINDOW_MS))
            )
          ),
      { timeoutMs: QUERY_TIMEOUT_MS, label: "Login lockout check" }
    );
    return row.value >= MAX_FAILURES;
  } catch (error) {
    console.error("Login lockout check failed, allowing the attempt:", error);
    return false;
  }
}

export async function recordLoginAttempt(ipHash, succeeded) {
  const db = getDb();
  if (!db) return;
  try {
    await withTimeout(db.insert(adminLoginAttempts).values({ ipHash, succeeded }), QUERY_TIMEOUT_MS, "Recording a login attempt");
  } catch (error) {
    console.error("Recording a login attempt failed:", error);
  }
}
