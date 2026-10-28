-- Same as 0001: block Supabase's public REST API from the settings tables. provider_keys holds
-- encrypted API keys, so it must never be reachable outside the site's own connection.
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "provider_keys" ENABLE ROW LEVEL SECURITY;
