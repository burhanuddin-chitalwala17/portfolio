import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { visitorQueries } from "../db/schema";

export const QUERY_STATUSES = Object.freeze({ OPEN: "open", RESOLVED: "resolved" });

export async function listVisitorQueries() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(visitorQueries).orderBy(desc(visitorQueries.createdAt));
}

/** Saves a question the chat couldn't answer. Used by the chat in phase 2. */
export async function createVisitorQuery({ question, visitorName, visitorEmail, context }) {
  const [row] = await getDb()
    .insert(visitorQueries)
    .values({ question, visitorName, visitorEmail, context })
    .returning();
  return row;
}

export async function setVisitorQueryStatus(id, status) {
  const [row] = await getDb()
    .update(visitorQueries)
    .set({ status, resolvedAt: status === QUERY_STATUSES.RESOLVED ? new Date() : null })
    .where(eq(visitorQueries.id, id))
    .returning();
  return row ?? null;
}
