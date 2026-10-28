import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Files uploaded through the admin panel. The bytes live in object storage under `storageKey`. */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  contentType: text("content_type").notNull(),
  sizeInBytes: integer("size_in_bytes").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  /** Plain text pulled from the file when it was uploaded; what the chat reads. */
  extractedText: text("extracted_text"),
  /** Whether the chat may use this document. Off by default when the scan finds sensitive data. */
  useInChat: boolean("use_in_chat").notNull().default(false),
  /** Kinds of sensitive data the upload scan found, e.g. ["phone", "bank_account"]. */
  sensitiveFindings: jsonb("sensitive_findings").notNull().default([]),
});

/** Questions from visitors that the chat couldn't answer, shown in the admin inbox. */
export const visitorQueries = pgTable("visitor_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  context: text("context"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

/** Versions of the homepage content. Exactly one is "published" at a time; the rest are drafts or history. */
export const siteContent = pgTable("site_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("draft"),
  content: jsonb("content").notNull(),
  summary: text("summary"),
  sourceDocumentId: uuid("source_document_id").references(() => documents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

/** One visitor chat session. The IP is stored only as a salted hash, for rate limiting. */
export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipHash: text("ip_hash").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    messageCount: integer("message_count").notNull().default(0),
  },
  (table) => [index("chat_conversations_ip_idx").on(table.ipHash, table.lastMessageAt)]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("chat_messages_conversation_idx").on(table.conversationId, table.createdAt)]
);

/** Admin sign-in attempts, used to lock out password guessing. */
export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipHash: text("ip_hash").notNull(),
    succeeded: boolean("succeeded").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_login_attempts_ip_idx").on(table.ipHash, table.attemptedAt)]
);

/** Small key/value settings edited from the admin panel, e.g. which AI provider and model to use. */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * AI provider API keys added from the admin panel, encrypted with a key derived from
 * SETTINGS_ENCRYPTION_KEY (or ADMIN_SESSION_SECRET). Only the last four characters are kept in clear.
 * Also holds other integration secrets, such as the GitHub token, keyed by integration id.
 */
export const providerKeys = pgTable("provider_keys", {
  provider: text("provider").primaryKey(),
  encryptedKey: text("encrypted_key").notNull(),
  keyHint: text("key_hint").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
