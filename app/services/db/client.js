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
    const client = postgres(url, { prepare: false, max: 1 });
    database = drizzle(client, { schema });
  }
  return database;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
