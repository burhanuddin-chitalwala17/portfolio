-- Supabase publishes tables in the public schema through its REST API. Turning on row-level
-- security with no policies blocks that API, while the site's own database connection is unaffected.
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "visitor_queries" ENABLE ROW LEVEL SECURITY;
