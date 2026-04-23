-- Marketing cost breakdown KPIs (replaces meta_ads_investment as the only marketing field)
insert into public.kpi_definitions (code, label, unit, category)
values
  ('marketing_cost_traffic',    'Custo com tráfego',      'currency_brl', 'sales_marketing'),
  ('marketing_cost_labor',      'Custo com mão de obra',  'currency_brl', 'sales_marketing'),
  ('marketing_cost_production', 'Custo de produção',      'currency_brl', 'sales_marketing')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
