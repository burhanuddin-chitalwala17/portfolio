import "server-only";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { chatConversations, chatMessages } from "../db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the existing conversation for `id`, or starts a new one. */
export async function getOrCreateConversation(id, ipHash) {
  const db = getDb();
  if (id && UUID.test(id)) {
    const [existing] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    if (existing) return existing;
  }
  const [created] = await db.insert(chatConversations).values({ ipHash }).returning();
  return created;
}

/** The latest `limit` messages of a conversation, oldest first, as API message params. */
export async function loadHistory(conversationId, limit) {
  const rows = await getDb()
    .select({ role: chatMessages.role, content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  const history = rows.reverse();
  // The API expects the first message to come from the user.
  while (history.length && history[0].role !== "user") history.shift();
  return history;
}

export async function appendMessage(conversationId, role, content) {
  const db = getDb();
  await db.insert(chatMessages).values({ conversationId, role, content });
  await db
    .update(chatConversations)
    .set({ lastMessageAt: new Date(), messageCount: sql`${chatConversations.messageCount} + 1` })
    .where(eq(chatConversations.id, conversationId));
}

/** Visitor messages sent since `since`, optionally only from one visitor. */
export async function countVisitorMessages({ since, ipHash }) {
  const conditions = [eq(chatMessages.role, "user"), gte(chatMessages.createdAt, since)];
  if (ipHash) conditions.push(eq(chatConversations.ipHash, ipHash));
  const [row] = await getDb()
    .select({ value: count() })
    .from(chatMessages)
    .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
    .where(and(...conditions));
  return row.value;
}

export async function listConversations(limit = 50) {
  const db = getDb();
  if (!db) return [];
  return db.select().from(chatConversations).orderBy(desc(chatConversations.lastMessageAt)).limit(limit);
}

export async function getTranscripts(conversationIds) {
  if (!conversationIds.length) return [];
  const rows = await getDb()
    .select()
    .from(chatMessages)
    .where(sql`${chatMessages.conversationId} in ${conversationIds}`)
    .orderBy(asc(chatMessages.createdAt));
  return rows;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Conversations started in the last seven days. */
export async function countConversationsThisWeek() {
  const db = getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - ONE_WEEK_MS);
  const [row] = await db.select({ value: count() }).from(chatConversations).where(gte(chatConversations.startedAt, since));
  return row.value;
}
