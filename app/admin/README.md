# Admin Dashboard

Password-protected panel at `/admin` with five tabs:

- **Documents**: upload, preview, download and delete files (PDF, Word, images, text; up to 4 MB each), and choose which ones the chat may use. Every upload is scanned for sensitive data first.
- **Content**: generate a draft of the homepage from a new resume (or edit by hand), review the changes, preview, publish, and roll back.
- **Inbox**: questions from visitors that the portfolio chat couldn't answer. Mark them resolved or reopen them.
- **Chats**: transcripts of recent chat conversations.
- **AI**: choose the provider and model for the chat and for resume drafts (Anthropic, OpenAI, Google Gemini, OpenRouter, Groq, or any OpenAI-compatible URL), load the models a key can use, test them, and add, replace or remove API keys. Changes apply immediately.

## Privacy model

- Anything the chat can read, a visitor can get it to repeat. Treat chat documents as public.
- Uploads are scanned for ID numbers (Aadhaar, PAN, passport), bank/card details, passwords and API keys, phone numbers, home addresses, dates of birth and salary. A file with findings is stored privately and kept out of the chat unless you explicitly confirm the risk.
- Even for confirmed files, every detected value is replaced with a placeholder before the text reaches the model. The scan is pattern-based, so review files yourself too.
- Files are never public: storage is private, links expire after five minutes and require the admin session.
- New resumes used for content drafts are kept out of the chat, and their personal details are removed before they're sent to the model.
- API keys saved in Admin → AI are encrypted (AES-256-GCM) before they reach the database, are never sent back to the browser (only the last four characters are shown), and their table is closed to Supabase's public API.

## Environment variables

Set these in Vercel → Settings → Environment Variables (or `.env.local` for local development; see `.env.example`).

| Variable | Needed for |
| --- | --- |
| `ADMIN_PASSWORD` | Logging in |
| `ADMIN_SESSION_SECRET` | Signing the session cookie (any long random string) |
| `DATABASE_URL` | Document library and inbox. Any Postgres; for Supabase use the transaction pooler URL (port 6543) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` | File uploads. Any S3-compatible storage (Supabase Storage, Cloudflare R2, AWS S3) |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `CUSTOM_LLM_API_KEY` + `CUSTOM_LLM_BASE_URL` | Optional. Keys can be added in Admin → AI instead; a key saved there wins. Set a monthly spend limit on every key |
| `ANTHROPIC_CHAT_MODEL`, `ANTHROPIC_CONTENT_MODEL` | Optional. Models used until a choice is saved in Admin → AI. Default `claude-opus-5-5` |
| `SETTINGS_ENCRYPTION_KEY` | Optional. Encrypts keys saved in Admin → AI; defaults to `ADMIN_SESSION_SECRET`. Changing either means re-entering the keys |
| `CHAT_HOURLY_LIMIT_PER_VISITOR`, `CHAT_DAILY_LIMIT` | Optional. Default 20 per visitor per hour and 300 per day |
| `CRON_SECRET` | Optional. Protects the daily keep-alive job |

Without the database and storage variables the panel still works: it shows the resume that ships with the site and explains what to connect.

## Database setup

The schema lives in `app/services/db/schema.js` and the SQL migrations in `drizzle/`.

On a new Supabase project, paste `supabase/setup.sql` into the SQL Editor and run it once. It creates every table, turns on row-level security, and records the migrations as applied.

When a later version adds migrations, run only the new files from `supabase/migrations/`, in number order, the same way. Alternatively, from a terminal:

```bash
DATABASE_URL="postgres://…" npm run db:migrate
```

After changing the schema, run `npm run db:generate` to write a new migration, then `npm run db:setup-sql` to refresh `supabase/setup.sql`.

## Switching providers

Nothing is tied to Supabase. To move to another Postgres host, point `DATABASE_URL` at it and run the migrations. To move files to Cloudflare R2 or S3, copy the bucket and change the `S3_*` variables.

## Authentication

- Sessions are HMAC-signed cookies that expire after 1 hour and are cleared when the browser closes.
- Five wrong passwords from the same visitor within 15 minutes lock sign-in for that visitor for 15 minutes.
- Every admin API route checks the session.
- A daily Vercel cron (`vercel.json`) pings the database so a free-tier project isn't paused for inactivity.
