# WFLK STAFF (wflk-kb)

This is the internal staff application for WFLK ("The Flock"). It is built with **Next.js**, **Prisma**, **NextAuth.js**, and **Tailwind CSS**.

The database is hosted on **Supabase** (PostgreSQL) and the application is deployed on **Vercel**.

---

## ⚠️ DATABASE SAFETY WARNING ⚠️

**CRITICAL: DO NOT RUN COMMANDS THAT MODIFY THE DATABASE SCHEMA WITHOUT AUTHORIZATION.**

The production database is on Supabase and contains live data.

- ❌ **DO NOT RUN** `npx prisma migrate dev` or `npx prisma db push` unless you are explicitly updating the schema and know what you are doing. These commands can alter or reset the database schema.
- ✅ **SAFE COMMAND:** `npx prisma generate` (Creates the Prisma Client based on your local schema, does not touch the DB).

---

## Getting Started

### 1. Prerequisites

- Node.js (v18+ recommended)
- Access to the Supabase project credentials

### 2. Environment Variables

Create a `.env` file in the root directory. You will need the following variables:

```bash
# Database Connection (Supabase)
# Connect to the transaction pooler (port 6543) for best performance in serverless envs
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (if ever needed)
# DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[your-generated-secret]" # Run `npx auth secret` to generate one

# Optional: Seed Data (if running seed script)
# See prisma/seed.ts for details
```

### 3. Installation

Install the dependencies:

```bash
npm install
```

### 4. Setup Prisma Client

Generate the Prisma Client to ensure type safety (does not touch the database):

```bash
npx prisma generate
```

### 5. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Deployment (Vercel)

The application is deployed on Vercel.

- Pushing to the `main` branch usually triggers a deployment (depending on project settings).
- Ensure all environment variables (especially `DATABASE_URL` and `NEXTAUTH_SECRET`) are correctly set in the Vercel Project Settings.

## Project Structure

- `/src/app`: App Router pages and layouts
- `/src/components`: UI components
- `/src/lib/db.ts`: Prisma DB connection instance
- `/src/auth.ts`: NextAuth configuration
- `/prisma/schema.prisma`: Database schema definition

## Scripts

- `npm run dev`: Starts the local dev server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint.
- `postinstall`: Automatically runs `prisma generate` after installation.
