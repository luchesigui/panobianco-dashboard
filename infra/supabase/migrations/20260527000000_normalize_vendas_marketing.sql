-- ============================================================
-- Normalização do payload de vendas e marketing
-- Substitui: sales_marketing_dashboard_payload (JSONB blob)
-- Por: 5 tabelas normalizadas + 2 novos kpi_definitions
-- ============================================================

-- ============================================================
-- FASE 1: DDL — novas tabelas
-- ============================================================

create table if not exists public.funil_mensal (
  gym_id    uuid     not null references public.gyms(id) on delete cascade,
  period_id date     not null,
  scheduled integer  not null default 0,
  present   integer  not null default 0,
  closings  integer  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id)
);

create table if not exists public.marketing_semanal (
  gym_id     uuid     not null references public.gyms(id) on delete cascade,
  period_id  date     not null,
  week_num   smallint not null check (week_num between 1 and 5),
  reach      numeric,
  frequency  numeric,
  views      numeric,
  followers  numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id, week_num)
);

create table if not exists public.funil_semanal (
  gym_id     uuid     not null references public.gyms(id) on delete cascade,
  period_id  date     not null,
  week_num   smallint not null check (week_num between 1 and 5),
  scheduled  integer,
  attendance integer,
  closings   integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id, week_num)
);

create table if not exists public.conversoes_semanais (
  gym_id    uuid     not null references public.gyms(id) on delete cascade,
  period_id date     not null,
  week_num  smallint not null check (week_num between 1 and 5),
  leads     integer,
  sales     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id, week_num)
);

create table if not exists public.recepcao_semanal (
  gym_id            uuid     not null references public.gyms(id) on delete cascade,
  period_id         date     not null,
  week_num          smallint not null check (week_num between 1 and 5),
  receptionist_name text     not null,
  consultora_id     uuid     references public.consultoras(id) on delete set null,
  leads             integer,
  sales             integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id, week_num, receptionist_name)
);

create index if not exists idx_recepcao_semanal_consultora
  on public.recepcao_semanal(consultora_id)
  where consultora_id is not null;

create index if not exists idx_recepcao_semanal_period
  on public.recepcao_semanal(gym_id, period_id);

-- ============================================================
-- FASE 1b: RLS — mesmo padrão das tabelas existentes
-- ============================================================

alter table public.funil_mensal enable row level security;
alter table public.marketing_semanal enable row level security;
alter table public.funil_semanal enable row level security;
alter table public.conversoes_semanais enable row level security;
alter table public.recepcao_semanal enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'funil_mensal' and policyname = 'service_role_all_funil_mensal') then
    create policy service_role_all_funil_mensal on public.funil_mensal for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'marketing_semanal' and policyname = 'service_role_all_marketing_semanal') then
    create policy service_role_all_marketing_semanal on public.marketing_semanal for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'funil_semanal' and policyname = 'service_role_all_funil_semanal') then
    create policy service_role_all_funil_semanal on public.funil_semanal for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'conversoes_semanais' and policyname = 'service_role_all_conversoes_semanais') then
    create policy service_role_all_conversoes_semanais on public.conversoes_semanais for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'recepcao_semanal' and policyname = 'service_role_all_recepcao_semanal') then
    create policy service_role_all_recepcao_semanal on public.recepcao_semanal for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

-- ============================================================
-- FASE 2: kpi_definitions para salesComposition
-- ============================================================

insert into public.kpi_definitions (code, label, unit, category) values
  ('vendas_via_experimental', 'Vendas via aula experimental', 'count', 'sales_marketing'),
  ('vendas_outros_canais',    'Vendas por outros canais',     'count', 'sales_marketing')
on conflict (code) do nothing;

-- ============================================================
-- FASE 3: Migração dos dados históricos do JSONB
-- ============================================================

-- funil_mensal
insert into public.funil_mensal (gym_id, period_id, scheduled, present, closings)
select
  gym_id,
  period_id,
  coalesce((payload->'funnel'->'scheduled'->>'value')::integer, 0),
  coalesce((payload->'funnel'->'present'->>'value')::integer, 0),
  coalesce((payload->'funnel'->'closings'->>'value')::integer, 0)
from public.sales_marketing_dashboard_payload
where payload ? 'funnel'
on conflict (gym_id, period_id) do nothing;

-- marketing_semanal (semanas 1-5 via cross join)
insert into public.marketing_semanal (gym_id, period_id, week_num, reach, frequency, views, followers)
select
  s.gym_id,
  s.period_id,
  w.week_num,
  nullif(s.payload->'weekly'->'marketing'->'reach'->>(w.week_num - 1), 'null')::numeric,
  nullif(s.payload->'weekly'->'marketing'->'frequency'->>(w.week_num - 1), 'null')::numeric,
  nullif(s.payload->'weekly'->'marketing'->'views'->>(w.week_num - 1), 'null')::numeric,
  nullif(s.payload->'weekly'->'marketing'->'followers'->>(w.week_num - 1), 'null')::numeric
from public.sales_marketing_dashboard_payload s
cross join (values (1),(2),(3),(4),(5)) as w(week_num)
where s.payload ? 'weekly'
  and jsonb_array_length(coalesce(s.payload->'weekly'->'marketing'->'reach', '[]'::jsonb)) >= w.week_num
on conflict (gym_id, period_id, week_num) do nothing;

-- funil_semanal
insert into public.funil_semanal (gym_id, period_id, week_num, scheduled, attendance, closings)
select
  s.gym_id,
  s.period_id,
  w.week_num,
  nullif(s.payload->'weekly'->'funnelWeekly'->'scheduled'->>(w.week_num - 1), 'null')::integer,
  nullif(s.payload->'weekly'->'funnelWeekly'->'attendance'->>(w.week_num - 1), 'null')::integer,
  nullif(s.payload->'weekly'->'funnelWeekly'->'closings'->>(w.week_num - 1), 'null')::integer
from public.sales_marketing_dashboard_payload s
cross join (values (1),(2),(3),(4),(5)) as w(week_num)
where s.payload ? 'weekly'
  and jsonb_array_length(coalesce(s.payload->'weekly'->'funnelWeekly'->'scheduled', '[]'::jsonb)) >= w.week_num
on conflict (gym_id, period_id, week_num) do nothing;

-- conversoes_semanais
insert into public.conversoes_semanais (gym_id, period_id, week_num, leads, sales)
select
  s.gym_id,
  s.period_id,
  w.week_num,
  nullif(s.payload->'weekly'->'salesWeekly'->'leadsByWeek'->>(w.week_num - 1), 'null')::integer,
  nullif(s.payload->'weekly'->'salesWeekly'->'totals'->>(w.week_num - 1), 'null')::integer
from public.sales_marketing_dashboard_payload s
cross join (values (1),(2),(3),(4),(5)) as w(week_num)
where s.payload ? 'weekly'
  and jsonb_array_length(coalesce(s.payload->'weekly'->'salesWeekly'->'leadsByWeek', '[]'::jsonb)) >= w.week_num
on conflict (gym_id, period_id, week_num) do nothing;

-- recepcao_semanal: cross join byReceptionist × semanas
insert into public.recepcao_semanal
  (gym_id, period_id, week_num, receptionist_name, consultora_id, leads, sales)
select
  s.gym_id,
  s.period_id,
  w.week_num,
  r.value->>'name',
  c.id,
  nullif(r.value->'leadsByWeek'->>(w.week_num - 1), 'null')::integer,
  nullif(r.value->'salesByWeek'->>(w.week_num - 1), 'null')::integer
from public.sales_marketing_dashboard_payload s
cross join jsonb_array_elements(
  coalesce(s.payload->'weekly'->'salesWeekly'->'byReceptionist', '[]'::jsonb)
) as r(value)
cross join (values (1),(2),(3),(4),(5)) as w(week_num)
left join public.consultoras c
  on c.gym_id = s.gym_id and c.name = r.value->>'name'
where s.payload ? 'weekly'
  and jsonb_array_length(coalesce(r.value->'leadsByWeek', '[]'::jsonb)) >= w.week_num
on conflict (gym_id, period_id, week_num, receptionist_name) do nothing;

-- salesComposition → kpi_values
insert into public.kpi_values (gym_id, period_id, kpi_definition_id, value_numeric)
select
  s.gym_id,
  s.period_id,
  d.id,
  (s.payload->'salesComposition'->'experimental'->>'value')::numeric
from public.sales_marketing_dashboard_payload s
join public.kpi_definitions d on d.code = 'vendas_via_experimental'
where s.payload->'salesComposition'->'experimental'->>'value' is not null
on conflict (gym_id, period_id, kpi_definition_id) do nothing;

insert into public.kpi_values (gym_id, period_id, kpi_definition_id, value_numeric)
select
  s.gym_id,
  s.period_id,
  d.id,
  (s.payload->'salesComposition'->'otherChannels'->>'value')::numeric
from public.sales_marketing_dashboard_payload s
join public.kpi_definitions d on d.code = 'vendas_outros_canais'
where s.payload->'salesComposition'->'otherChannels'->>'value' is not null
on conflict (gym_id, period_id, kpi_definition_id) do nothing;

-- ============================================================
-- FASE 4: Reconciliar consultora_id nulo por nome
-- ============================================================

update public.recepcao_semanal r
set consultora_id = c.id
from public.consultoras c
where r.gym_id = c.gym_id
  and r.consultora_id is null
  and r.receptionist_name = c.name
  and c.deleted_at is null;
