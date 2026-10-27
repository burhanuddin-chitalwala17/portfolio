import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Files uploaded through the admin panel. The bytes live in object storage under `storageKey`. */
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  contentType: text("content_type").notNull(),
  sizeInBytes: integer("size_in_bytes").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
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
