create extension if not exists "pgcrypto";

create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  state text not null,
  opened_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  unit text not null check (unit in ('count', 'currency_brl', 'percent', 'text')),
  category text not null check (category in ('overview', 'sales_marketing', 'retention', 'finance', 'roi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  period_id date not null,
  kpi_definition_id uuid not null references public.kpi_definitions(id) on delete cascade,
  value_numeric numeric(14, 2),
  value_text text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, period_id, kpi_definition_id),
  check (value_numeric is not null or value_text is not null)
);

create table if not exists public.kpi_insights (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  period_id date not null,
  category text not null check (category in ('overview', 'sales_marketing', 'retention', 'finance', 'roi')),
  insight_scope text not null default 'kpi' check (insight_scope in ('kpi', 'analysis', 'feature_of_month')),
  insight_type text not null check (insight_type in ('good', 'bad', 'warn', 'info')),
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kpi_values_period on public.kpi_values(period_id, kpi_definition_id);
create index if not exists idx_kpi_values_gym_period on public.kpi_values(gym_id, period_id);
create index if not exists idx_kpi_definitions_category on public.kpi_definitions(category);
create index if not exists idx_kpi_insights_period_category on public.kpi_insights(period_id, category, sort_order);

alter table public.gyms enable row level security;
alter table public.kpi_definitions enable row level security;
alter table public.kpi_values enable row level security;
alter table public.kpi_insights enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'gyms' and policyname = 'service_role_all_gyms'
  ) then
    create policy service_role_all_gyms on public.gyms for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_definitions' and policyname = 'service_role_all_kpi_definitions'
  ) then
    create policy service_role_all_kpi_definitions on public.kpi_definitions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_values' and policyname = 'service_role_all_kpi_values'
  ) then
    create policy service_role_all_kpi_values on public.kpi_values for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_insights' and policyname = 'service_role_all_kpi_insights'
  ) then
    create policy service_role_all_kpi_insights on public.kpi_insights for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;
