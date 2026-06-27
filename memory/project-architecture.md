---
name: project-architecture
description: Agreed folder structure and architectural conventions for the panobianco-dashboard refactor
metadata:
  type: project
---

# Frontend Architecture (agreed June 2026)

## Folder Structure

```
app/                   ← routing only, pages stay thin
  kpis/
    page.tsx           ← orchestrates features, no business logic
    layout.tsx
  entrada-dados/
    page.tsx
  ...

features/              ← one folder per domain/section
  overview/
    components/
    data-access/       ← async, server-only supabase queries
    parsers/           ← pure functions + types
    types.ts
  sales-marketing/
    components/
    data-access/
    parsers/
    types.ts
  retention/
  finance/
  forecast/
  roi/

components/            ← shared UI across features
  ui/                  ← shadcn components
  kpis/                ← SectionCard, KpiCard, SectionInsights...

lib/                   ← infrastructure with no domain (supabase, auth, ai, utils)
  supabase/
  ai/
  auth.ts
  utils.ts
```

## Data Layer

- `data-access/` fetches raw data from Supabase. Two entry points per page:
  - `monthlyComparisonData(gymSlug)` → kpi_values + funil_mensal + histórico + settings (self-contained, fetches gym/consultoras internally)
  - `weeklyComparisonData(gymSlug)` → funil_semanal + marketing_semanal + conversoes_semanais + recepcao_semanal + consultoras (self-contained)
- Both run in parallel via `Promise.all` in the page component.

## Domain Services (parsers/)

- Pure functions, no async, no DB.
- Receive raw data from data-access, return strongly-typed domain KPI objects.
- Each domain computes its own derived metrics from its own data source:
  - `no_show_rate` and `present_conversion_rate` for monthly scope → computed from `funil_mensal`
  - Same metrics for weekly scope → computed from `funil_semanal`
  - Monthly KPIs must NOT depend on weekly data (current bug to fix).

## Insights

- Fetched from DB only on page load (`kpi_insights` table). No LLM calls in the render path.
- Empty array = no insights generated yet → UI shows "generate" button.
- LLM generation stays as an on-demand server action (existing pattern).

## Page Component Pattern

```tsx
// app/kpis/page.tsx — Server Component
const [monthly, weekly] = await Promise.all([
  monthlyComparisonData(),
  weeklyComparisonData(),
]);

const overviewKpis = overviewParsers.getKpis(monthly);
// ...

return (
  <Overview data={{ kpis: overviewKpis, insights: overviewInsights }} />
  <SalesAndMarketing data={{ monthly: {...}, weekly: {...} }} />
  ...
);
```

## Section Components

- Each `features/<domain>/components/index.tsx` is the section entry point.
- Receives typed props scoped to its domain only (`OverviewData`, `RetentionData`, etc.).
- No component knows about another domain's types.
- Shared components (SectionCard, SectionInsights, KpiCard) live in `components/kpis/`.

## Why: Key Decisions

- `lib/data/kpis.ts` today is 780 lines doing everything: queries, transforms, chart assembly, derived metrics — all mixed. Impossible to maintain.
- Current components all receive the full `KpiPageData` blob (`Record<string, number>` with string keys) — no type safety, no clear contract.
- `features/` at root (not inside `app/`) keeps routing and business logic separated, and allows future reuse across routes.
