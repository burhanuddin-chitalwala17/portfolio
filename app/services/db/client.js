import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let database;

/**
 * Returns a Drizzle client for DATABASE_URL, or null when no database is configured.
 * Any Postgres works (Supabase, Neon, RDS…), so switching providers only means changing the URL.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!database) {
    // prepare: false keeps it compatible with transaction-mode poolers such as Supabase's on port 6543.
    // The timeouts stop a slow or unreachable database from holding a request open.
    const client = postgres(url, { prepare: false, max: 1, connect_timeout: 10, idle_timeout: 20 });
    database = drizzle(client, { schema });
  }
  return database;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Rejects if `promise` hasn't settled within `ms`, so a stuck query fails fast instead of
 * leaving a page loading until the database cancels it.
 */
export function withTimeout(promise, ms, label = "Database query") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * A short technical description of a database failure for the admin panel, e.g.
 * "57014: canceling statement due to statement timeout". Shown to the signed-in admin only.
 */
export function describeDatabaseError(error) {
  if (!error) return null;
  const code = error.code && error.code !== error.message ? `${error.code}: ` : "";
  return `${code}${error.message ?? String(error)}`.slice(0, 240);
}
