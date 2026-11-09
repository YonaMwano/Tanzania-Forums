# Tanzania Forums

Tanzania's open forum for ideas, truth, and community. Built with Next.js 15, Supabase (PostgreSQL), Google OAuth, and Groq AI.

**Read-first, login-to-participate.** Every thread, category, profile, and summary is publicly viewable. Posting, commenting, reacting, and reporting require Google sign-in.

---

## Features

### Group 1 — Foundation
- Professional 2026 editorial UI with bento-grid homepage
- Light / dark mode (system-aware)
- Swahili / English language toggle
- Google OAuth authentication (Supabase)
- First-user-is-admin bootstrap logic
- Full PostgreSQL schema with RLS
- Responsive layout: bottom nav mobile, full nav desktop
- Lucide icons (no emoji)
- Category seed data (Siasa, Uhusiano, Biashara, Tech, JamiiCheck, etc.)

### Group 2 — Core Forum
- Category pages with filters (latest / most replied / most viewed / language)
- Thread pages with nested replies, stats sidebar, related threads
- Create discussion flow (`/new`) with AI content moderation
- Reply composer (locked overlay for anonymous users)
- Reactions (like) with auth gating
- Share / bookmark / report actions
- AI summaries via Groq (`openai/gpt-oss-120b`) — auto after 20 replies or manual
- Global search (threads, posts, users)
- Public user profiles with reputation and activity
- Trending page

### Group 3 — Admin Panel
- Admin shell with sidebar navigation (separate from public UI)
- Dashboard with KPIs (users, threads, posts, reports, AI flags, fact-checks)
- User management (role, suspend, ban, reinstate)
- Moderation queue (AI-flagged posts + user reports)
- Full audit log
- Groq / AI controls (toggle moderation, summary threshold, usage stats)
- Category management (create / edit / reorder / AI overrides)
- JamiiCheck fact-check publisher
- Announcements
- Site settings (name, tagline, default language)
- Admin onboarding for first user
- All admin actions audited

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 15 (App Router)             |
| Language     | TypeScript                          |
| Styling      | Tailwind CSS 3                      |
| Database     | PostgreSQL via Supabase             |
| Auth         | Supabase Auth (Google OAuth)        |
| AI           | Groq (`openai/gpt-oss-120b`)        |
| Icons        | Lucide React                        |
| Theme        | next-themes                         |
| Deployment   | Netlify                             |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd tanzania-forums
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `GROQ_API_KEY` in the local environment or Netlify project settings. Never commit their values.

### 3. Database setup

1. Open your Supabase project SQL Editor
2. Paste and run the entire contents of `sql/001_schema.sql`
3. Confirm tables, RLS policies, and seed categories appear

### 4. Google OAuth

In Supabase Dashboard → Authentication → Providers:

- Google enabled with Client ID and Secret
- Redirect URL includes your Supabase auth callback
- Site URL and additional redirect URLs include local and production domains

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

The first Google sign-in becomes Admin and is redirected to `/admin/onboarding`.

---

## Project Structure

```
tanzania-forums/
├── sql/001_schema.sql
├── src/
│   ├── actions/          # threads.ts, admin.ts
│   ├── app/
│   │   ├── (public)/     # Public routes + AppShell
│   │   ├── admin/        # Admin panel + AdminShell
│   │   ├── auth/callback/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── providers/
│   │   ├── thread/
│   │   └── ui/
│   ├── lib/
│   │   ├── ai/groq.ts
│   │   ├── supabase/
│   │   └── utils.ts
│   ├── types/database.ts
│   └── middleware.ts
├── netlify.toml
└── package.json
```

---

## Admin routes

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard KPIs and quick actions |
| `/admin/onboarding` | First-admin setup wizard |
| `/admin/users` | Role and status management |
| `/admin/moderation` | AI flags + report queue |
| `/admin/logs` | Full audit log |
| `/admin/ai` | Groq settings and usage |
| `/admin/categories` | Category CRUD |
| `/admin/fact-checks` | JamiiCheck publisher |
| `/admin/announcements` | Site banners |
| `/admin/settings` | Site identity and security notes |

---

## Design System

- Brand: Deep teal/green (brand-600 #0d9488)
- Accent: Warm gold for verified / AI badges
- Surfaces: Warm neutral light / near-black dark
- Typography: Geist Sans + Geist Mono
- Icons: Lucide React only (no emoji)
- Layout: Mobile-first public UI; separate admin sidebar

---

## License

Private — Tanzania Forums team.

## Netlify deployment and 404 troubleshooting

The repository's `netlify.toml` sets `npm run build` as the build command and `.next` as the publish directory. Netlify automatically supplies its Next.js adapter for server rendering, middleware, authentication callbacks, and server actions. Deploy the repository root; do not publish it as a static folder or add an `index.html` catch-all redirect.

For an existing database created with the original schema, run `sql/002_fix_users_policy_recursion.sql` once in its SQL Editor as the database owner. This repairs the recursive administrator policy without deleting any data. The original policy causes PostgreSQL error `42P17` on categories, threads, and profiles. Fresh databases should use the corrected `sql/001_schema.sql` instead.

Confirm Google OAuth allows the deployed site's `/auth/callback` URL. After deploying, check `/`, `/trending`, `/search`, `/c/siasa`, and an existing `/t/<slug>` page. Signed-out requests to `/admin` and `/settings` should redirect to sign-in. Unknown categories, discussions, and profiles should return a proper 404 after the database policy repair.

Run `npx tsc --noEmit --incremental false` to check TypeScript without creating production build artifacts.
