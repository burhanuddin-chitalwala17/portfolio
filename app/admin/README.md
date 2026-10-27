# Admin Dashboard

Password-protected panel at `/admin` with two tabs:

- **Documents**: upload, preview, download and delete files (PDF, Word, images, text; up to 4 MB each).
- **Inbox**: questions from visitors that the portfolio chat couldn't answer. Mark them resolved or reopen them.

## Environment variables

Set these in Vercel → Settings → Environment Variables (or `.env.local` for local development; see `.env.example`).

| Variable | Needed for |
| --- | --- |
| `ADMIN_PASSWORD` | Logging in |
| `ADMIN_SESSION_SECRET` | Signing the session cookie (any long random string) |
| `DATABASE_URL` | Document library and inbox. Any Postgres; for Supabase use the transaction pooler URL (port 6543) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` | File uploads. Any S3-compatible storage (Supabase Storage, Cloudflare R2, AWS S3) |
| `CRON_SECRET` | Optional. Protects the daily keep-alive job |

Without the database and storage variables the panel still works: it shows the resume that ships with the site and explains what to connect.

## Database setup

The schema lives in `app/services/db/schema.js` and the SQL migrations in `drizzle/`. To create or update the tables:

```bash
DATABASE_URL="postgres://…" npm run db:migrate
```

After changing the schema, run `npm run db:generate` to write a new migration.

## Switching providers

Nothing is tied to Supabase. To move to another Postgres host, point `DATABASE_URL` at it and run the migrations. To move files to Cloudflare R2 or S3, copy the bucket and change the `S3_*` variables.

## Authentication

- Sessions are HMAC-signed cookies that expire after 1 hour and are cleared when the browser closes.
- Every admin API route checks the session.
- A daily Vercel cron (`vercel.json`) pings the database so a free-tier project isn't paused for inactivity.
