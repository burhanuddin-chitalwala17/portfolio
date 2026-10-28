import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let connection;
let database;

/**
 * Returns a Drizzle client for DATABASE_URL, or null when no database is configured.
 * Any Postgres works (Supabase, Neon, RDS…), so switching providers only means changing the URL.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!database) {
    connection = postgres(url, {
      // Compatible with transaction-mode poolers such as Supabase's on port 6543.
      prepare: false,
      // A few connections, so one slow query doesn't queue every other request on the same instance.
      max: 3,
      connect_timeout: 5,
      // Close idle sockets before the pooler or a paused serverless instance silently drops them.
      idle_timeout: 15,
      max_lifetime: 60 * 10,
    });
    database = drizzle(connection, { schema });
  }
  return database;
}

/** Drops the current connections so the next query opens fresh ones. */
function resetDb() {
  connection?.end({ timeout: 0 }).catch(() => {});
  connection = undefined;
  database = undefined;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

class QueryTimeoutError extends Error {
  name = "QueryTimeoutError";
}

/**
 * Rejects if `promise` hasn't settled within `ms`, so a stuck query fails fast instead of
 * leaving a page loading until the database cancels it.
 */
export function withTimeout(promise, ms, label = "Database query") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new QueryTimeoutError(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// postgres.js and Node codes for a connection that is gone or never opened.
const CONNECTION_ERROR_CODES = new Set([
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "CONNECT_TIMEOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
]);

function isRetryable(error) {
  // Drizzle wraps driver errors ("Failed query: …"), with the original as the cause.
  return error instanceof QueryTimeoutError || CONNECTION_ERROR_CODES.has(error?.code ?? error?.cause?.code);
}

/**
 * Runs read-only database work with a time limit. If it times out or the connection has gone
 * stale (common after a serverless instance sits idle), it reconnects and tries once more.
 * `run` must start its queries itself (call getDb() inside), so the retry uses the new connection.
 * Don't use it for writes that mustn't run twice.
 */
export async function readWithRetry(run, { timeoutMs = 6000, label } = {}) {
  try {
    return await withTimeout(run(), timeoutMs, label);
  } catch (error) {
    if (!isRetryable(error)) throw error;
    console.warn(`${label ?? "Database query"} failed (${error.message}); reconnecting and retrying once.`);
    resetDb();
    return withTimeout(run(), timeoutMs, label);
  }
}

/**
 * A short technical description of a database failure for the admin panel, e.g.
 * "57014: canceling statement due to statement timeout". Shown to the signed-in admin only.
 */
export function describeDatabaseError(error) {
  if (!error) return null;
  // Report the driver's error rather than Drizzle's "Failed query: <sql>" wrapper.
  const root = error.cause ?? error;
  const code = root.code && root.code !== root.message ? `${root.code}: ` : "";
  return `${code}${root.message ?? String(root)}`.slice(0, 240);
}
