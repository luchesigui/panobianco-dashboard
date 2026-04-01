KPI dashboard migration for Panobianco using Next.js + Supabase (local Docker).

## Prerequisites
- Docker running locally
- Node 20+
- Supabase CLI (or `npx supabase`)

## Local Supabase setup
From project root:

```bash
npx supabase --workdir infra start
npx supabase --workdir infra db reset
```

This applies migrations in `infra/supabase/migrations` and seeds data from `infra/supabase/seed.sql`.

## App environment
Create `.env.local` from `.env.local.example`.

To get local service role key:

```bash
npx supabase --workdir infra status
```

Then copy `service_role key` to `SUPABASE_SERVICE_ROLE_KEY`.

## Run Next.js
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). It redirects to `/kpis`.

## What is implemented
- KPI-focused schema on Supabase
- Seed with current mocked dashboard data
- KPI page (`app/kpis/page.tsx`) loaded from Supabase only
- Analysis and Feature of Month persisted and rendered via `kpi_insights` (`insight_scope`)
- Optional debug endpoint: `GET /api/kpis/current`

## Notes
- This MVP covers only the KPI page scope.
- Secondary tabs/charts from static HTML were intentionally deferred.
