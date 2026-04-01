create table if not exists public.sales_marketing_dashboard_payload (
  gym_id uuid not null references public.gyms (id) on delete cascade,
  period_id date not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (gym_id, period_id)
);

create index if not exists idx_sm_dashboard_period on public.sales_marketing_dashboard_payload (period_id);

alter table public.sales_marketing_dashboard_payload enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sales_marketing_dashboard_payload'
      and policyname = 'service_role_all_sales_marketing_dashboard_payload'
  ) then
    create policy service_role_all_sales_marketing_dashboard_payload
      on public.sales_marketing_dashboard_payload
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
