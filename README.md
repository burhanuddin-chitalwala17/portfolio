# Burhanuddin Chitalwala — Portfolio

A cinematic, streaming-inspired portfolio with an AI version of me that visitors can chat with, and a small CMS that rewrites the site from a new resume once I approve it.

Built with Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, Lenis, the Claude API, Drizzle (Postgres) and S3-compatible storage.

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in what you need; only ADMIN_PASSWORD is required
npm run dev
```

Open http://localhost:3000. The admin panel is at `/admin`; see [`app/admin/README.md`](app/admin/README.md).

Without a database the site runs on the built-in content in `app/data/siteData.js`, and the chat stays hidden.

## How it fits together

- **Homepage** (`app/page.js`) renders the latest *published* content version, falling back to `defaultContent` in `app/data/siteData.js`. Publishing a version rebuilds the page.
- **Chat** (`app/api/chat/route.js`) streams answers from Claude, speaking as me, grounded in the published content plus the documents I allow. When it can't answer, it calls a `raise_query` tool that files the question in the admin inbox.
- **CMS** (`app/admin/content`): upload a resume → Claude returns updated content as schema-validated JSON → I review a diff, preview it, edit it if needed, and publish. Every version is kept for rollback.
- **Privacy**: uploads are scanned for ID numbers, bank/card details, secrets, phone numbers, addresses, dates of birth and salary. Risky files stay out of the chat unless I confirm, and detected values are always redacted before any text reaches the model. Chat is rate-limited per visitor and per day, transcripts are kept, and admin logins lock after repeated failures.

## Design tokens

All colours, font sizes, radii and layout spacing are CSS variables in `app/globals.css`, exposed through `tailwind.config.js`:

- **Primitives** (raw values) → **semantic tokens** (`canvas`, `surface`, `fg`, `inverse`, `scrim`, `accent`, `on-accent`, `success`, `warning`, `danger`, `info`, `category-*`).
- The site uses the dark theme on `:root`; the admin panel opts into `.theme-light`, which redefines the same names.
- Type sizes are fluid (`clamp()`), from `text-2xs` to `text-7xl`, plus display sizes (`text-display-hero`, `-intro`, `-section`, `-numeral`). `text-input` keeps form fields at 16px so iOS doesn't zoom.
- `px-gutter` and `py-section` scale page padding with the viewport.

Components use only these tokens (for example `bg-canvas text-fg/70 border-danger/20`), never raw palette classes or hex values.

## Code layout

```
app/
  page.js                    ← homepage (published content + chat switch)
  preview/[id]/              ← admin-only preview of any content version
  _portfolio/                ← public site: sections, chat panel, motion helpers, content context
  admin/                     ← dashboard: documents, content, inbox, chats
  api/                       ← chat, resume link, admin APIs, keep-alive cron
  services/
    auth/                    ← signed sessions, login lockout
    chat/                    ← config, persona, knowledge, history
    content/                 ← schema (zod), versions, resume → draft, diff
    documents/               ← upload, text extraction, listing
    privacy/                 ← sensitive-data scan and redaction
    db/, storage/            ← Drizzle schema + client, S3 client
drizzle/                     ← SQL migrations
```
