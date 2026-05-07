# ZARA Academy — Deployment Guide

## Stack
- **Frontend**: Vite + React + Tailwind (build → `dist/public/`)
- **Backend**: Hono on Vercel Node serverless function (`api/index.ts` → `api/_lib/`)
- **DB**: Neon Postgres via `drizzle-orm/neon-http`

## Environment Variables

Single required variable:

```
DATABASE_URL=postgresql://USER:PASS@HOST/DB?sslmode=require
```

In Vercel: **Project Settings → Environment Variables** → add for *Production*, *Preview*, *Development*.

## First-Time Database Setup

Run **once** against your Neon DB to create the `participants` table. Two options:

### Option A — Drizzle push (fastest, recommended)
```bash
npm install
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

### Option B — Run the SQL migration directly
Open Neon Console → SQL Editor → paste & run [db/migrations/0000_init.sql](db/migrations/0000_init.sql).

## Local Development

```bash
cp .env.example .env          # add DATABASE_URL
npm install
npm run dev                   # http://localhost:3000
```

Without a `DATABASE_URL`, the test still works via localStorage fallback (results won't appear in `/admin`).

## Vercel Deployment

The repo includes [vercel.json](vercel.json) which configures:
- `buildCommand: vite build` (frontend)
- `outputDirectory: dist/public`
- Single serverless function: `api/index.ts` (Hono + Vercel adapter)
- Rewrites: `/api/*` → function, everything else → SPA fallback

Push to GitHub and Vercel auto-deploys. The custom domain (zaratraining.online) will work as soon as the env var is set.

> **403 on `*.vercel.app` preview URLs?**  
> That's Vercel's "Deployment Protection" (SSO) for team accounts.  
> Project Settings → Deployment Protection → set to *Disabled* or *Only Preview Deployments* so the production custom domain is public.

## Post-Deploy Smoke Test

1. Visit `/` — landing loads
2. `/test` — answer 4 questions, click *Sonuçları Göster*
3. Should redirect to `/sonuc/<numeric-id>` (NOT `local-...`)  
   — that proves DB write succeeded
4. `/admin` (PIN: `000000`) — see the participant in the list
5. `/show` — toggle the cabins, names appear inside

## Routes Summary
| Path | Purpose |
| --- | --- |
| `/` | Landing + QR |
| `/test` | 4-question scenario quiz |
| `/sonuc/:id` | Personal cabin reveal + score |
| `/show` | Group reveal stage (sahnede oynat) |
| `/admin` | Live results dashboard |
| `/api/trpc/*` | tRPC endpoints |
| `/api/health` | Healthcheck JSON |

## File Structure (backend)
```
api/
  index.ts            ← Vercel serverless entry
  _lib/               ← internal modules (Vercel ignores _-prefixed)
    boot.ts           ← Hono app
    router.ts         ← tRPC router
    middleware.ts
    context.ts
    queries/
    lib/env.ts
db/
  schema.ts           ← drizzle pgTable
  migrations/
    0000_init.sql
```
