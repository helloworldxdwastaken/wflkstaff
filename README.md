# WFLK Staff Portal (wflk-kb)

Internal staff application for **WFLK ("The Flock")** — a knowledge base, team resource manager, analytics dashboard, and decision polls for staff.

Built with **Next.js 16**, **Prisma**, **NextAuth.js**, **Tailwind CSS**, and **Radix UI**. Database on **Supabase** (PostgreSQL), deployed on **Vercel**.

---

## Features

- **Authentication** — Email + password + secure word. Role-based access (Staff / Admin).
- **Dashboard** — Team time zones (live clocks), shared resources (links, secrets, file refs). Copy/open from cards.
- **Analytics** — Live listener stats from **AzuraCast**; historical charts (daily, weekly, hourly) from JSON data.
- **Polls** — Create polls, vote, optional expiry. Notifications for new polls and reminder badge for unvoted polls.
- **Admin** — User management (create/delete), activity log. Admin-only route.
- **Settings** — Profile (name, job title, timezone with UTC offsets), secure word, Discord ID for avatar sync.
- **Responsive** — Mobile-friendly sidebar (hamburger), responsive layouts across pages.

---

## ⚠️ DATABASE SAFETY

**Do not run schema-changing commands without approval.** Production data lives on Supabase.

- ❌ **Do not run** `npx prisma migrate dev` or `npx prisma db push` unless you are intentionally changing the schema.
- ✅ **Safe:** `npx prisma generate` — only regenerates the Prisma client; does not touch the database.

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- Access to **Supabase** project and env vars (see below)

### Environment Variables

Create a `.env` file in the project root (and set the same in Vercel for production):

```bash
# Database (Supabase) — use pooler URL for serverless
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"            # Use your production URL on Vercel
NEXTAUTH_SECRET="[your-secret]"                # e.g. openssl rand -base64 32

# AzuraCast (optional — for live listener stats on /dashboard/stats)
AZURACAST_API_URL="https://your-azuracast.instance/api"
AZURACAST_STATION_ID="1"
AZURACAST_API_KEY="your-api-key"
```

- **DATABASE_URL** and **NEXTAUTH_*** are required for auth and data.
- **AZURACAST_*** are optional; without them, the stats page still works using historical data from `src/data/analytics-jan-2026.json`.

### Install and Run

```bash
npm install
npx prisma generate   # optional; runs automatically on postinstall
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`.

---

## Deployment (Vercel)

- **Deploy from CLI (no GitHub push):**  
  `npx vercel --yes --prod`
- **Deploy from Git:**  
  Connect the repo in Vercel; pushes to `main` (or your production branch) trigger deploys.

In **Vercel → Project → Settings → Environment Variables**, set at least:

- `DATABASE_URL`
- `NEXTAUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`

Add `AZURACAST_*` if you use live AzuraCast stats.

---

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin panel (user management, activity)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API
│   │   └── azuracast/
│   │       ├── history/          # Historical analytics JSON
│   │       └── listeners/        # Live AzuraCast listeners
│   ├── dashboard/          # Main dashboard
│   │   └── stats/          # Analytics (daily/weekly/hourly charts)
│   ├── login/
│   ├── polls/              # Team polls and voting
│   ├── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Redirects to /login
├── actions/
│   ├── auth-actions.ts    # Sign out
│   └── poll-actions.ts    # Create poll, vote, close, notifications
├── components/
│   ├── admin/             # Admin forms (create user, delete user)
│   ├── dashboard/         # Resources manager, stats charts
│   ├── polls/             # Poll list, poll card, create poll dialog
│   ├── settings/          # Settings forms (profile, security, Discord)
│   ├── side-nav.tsx       # Main nav + mobile hamburger
│   └── ui/                # Button, card, dialog, input, tabs, etc.
├── data/
│   └── analytics-jan-2026.json   # Historical stats for charts
├── lib/
│   ├── db.ts              # Prisma client
│   ├── actions.ts         # User CRUD, profile, info items
│   ├── timezones.ts       # Timezone list with UTC offsets
│   ├── notifications.ts   # Unread count helper
│   └── utils.ts
├── auth.ts                # NextAuth config (credentials + Prisma)
├── auth.config.ts
├── middleware.ts          # Protects routes, redirects unauthenticated
└── next-auth.d.ts         # NextAuth type extensions

prisma/
├── schema.prisma          # Account, User, ActivityLog, InfoItem, Poll, PollOption, Vote, Notification
└── seed.ts                # Seed script (run only when intended: npx prisma db seed)
```

---

## Scripts

| Command                 | Description                              |
|-------------------------|------------------------------------------|
| `npm run dev`           | Start dev server (Next.js + Turbopack)   |
| `npm run build`         | Production build                         |
| `npm run start`         | Run production server (after `build`)    |
| `npm run lint`          | Run ESLint                               |

- **postinstall** runs `prisma generate` automatically after `npm install`.
- **Seed DB** (optional, modifies data): `npx prisma db seed`

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth.js v5 (Credentials + Prisma adapter)
- **DB:** PostgreSQL (Supabase), Prisma ORM
- **Styling:** Tailwind CSS 4, Radix UI
- **Charts:** Recharts (stats page)
