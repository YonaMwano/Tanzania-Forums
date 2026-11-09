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
| Deployment   | Vercel                              |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd tanzania-forums
npm install
```

### 2. Environment

Configure the Supabase URL and publishable key in the Netlify project's environment settings using the names read by the Supabase client modules. Never commit credential values.

### 3. Database setup

For a fresh installation only, run `sql/001_schema.sql` in the existing Supabase project's SQL Editor. Do not rerun this file on an existing database.

### 4. Google OAuth on the deployed site

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to `https://lucent-elf-caf82b.netlify.app` (replace the localhost default).
- Add `https://lucent-elf-caf82b.netlify.app/auth/callback` to **Redirect URLs**. Supabase also checks query parameters against its redirect rules; add `https://lucent-elf-caf82b.netlify.app/auth/callback?**` for the app's `next` parameter.
- If testing a Deploy Preview, add its exact HTTPS callback URL and the equivalent query wildcard rule too.

In Authentication → Providers, enable Google. In Google Cloud Console, use the Supabase Auth callback shown by the Google provider settings as the authorized redirect URI. The Google callback and the app's `/auth/callback` are separate steps.

Open `https://lucent-elf-caf82b.netlify.app` to test sign-in. The first Google sign-in becomes Admin and is redirected to `/admin/onboarding`.

### Troubleshooting “Database error saving new user”

This error is returned by Supabase before the application receives a session. A redirect change alone cannot fix it.

1. Check Supabase Authentication logs and Postgres logs for the failing signup. The underlying SQL error identifies the actual cause.
2. If the existing database uses this repository's schema, run `sql/002_repair_auth_signup.sql` in that Supabase project's SQL Editor. This targeted repair qualifies the signup trigger's enum and helper function and pins its search path. It preserves accounts and forum data. It requires the original tables and helper function to exist.
3. Replace the localhost Site URL and configure allowed callbacks as above, then retry Google signup on the deployed HTTPS site.
4. If signup still fails, inspect the new underlying SQL error rather than deleting users or rerunning the initial schema.

If repair 002 has already succeeded but signup still fails, run `sql/003_diagnose_auth_signup.sql` in the same Supabase project's SQL Editor. This read-only script checks missing trigger dependencies, extra triggers on auth/profile tables, function-owner RLS privileges, mandatory columns, constraints, and self-referencing profile policies. It does not insert a test account or expose account rows. Use its results alongside the underlying Auth/Postgres error to select a targeted repair; do not disable triggers or row-level security to bypass the failure.

The existing `Admins full access users` policy selects from `public.users` inside a policy on that same table. This can cause infinite recursion on profile reads after login. It is a separate potential problem from a signup trigger running as a privileged owner, so it should not be assumed to explain an Auth account-creation failure without the database error.

The SQL repair is an existing Supabase Auth integration repair; it is not applied automatically by a Netlify deploy. No live Supabase configuration or database changes were made by this code change.

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
├── vercel.json
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
