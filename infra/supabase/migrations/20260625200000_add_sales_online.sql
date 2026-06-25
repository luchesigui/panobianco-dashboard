-- Alter conversoes_semanais to add sales_online column
alter table public.conversoes_semanais 
add column if not exists sales_online integer default 0;

-- Add vendas_online definition
insert into public.kpi_definitions (code, label, unit, category) values
  ('vendas_online', 'Vendas online', 'count', 'sales_marketing')
on conflict (code) do nothing;
