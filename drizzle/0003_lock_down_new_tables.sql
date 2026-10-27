-- Same as 0001: block Supabase's public REST API from the new tables.
ALTER TABLE "site_content" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "chat_conversations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "admin_login_attempts" ENABLE ROW LEVEL SECURITY;
