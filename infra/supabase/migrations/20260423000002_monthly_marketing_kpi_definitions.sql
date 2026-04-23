-- Monthly marketing reach/engagement KPIs (used on the Mensal tab; override weekly totals)
insert into public.kpi_definitions (code, label, unit, category)
values
  ('marketing_reach',      'Alcance',           'count', 'sales_marketing'),
  ('marketing_frequency',  'Frequência',        'count', 'sales_marketing'),
  ('marketing_views',      'Visualizações',     'count', 'sales_marketing'),
  ('marketing_followers',  'Novos seguidores',  'count', 'sales_marketing')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
