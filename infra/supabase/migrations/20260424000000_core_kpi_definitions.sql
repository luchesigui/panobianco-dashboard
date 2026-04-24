-- Core KPI definitions that were only in seed.sql and missing from migrations
insert into public.kpi_definitions (code, label, unit, category)
values
  -- Overview
  ('base_students_end', 'Base de alunos (fim do mês)', 'count',        'overview'),
  ('sales_total',       'Vendas no mês',               'count',        'overview'),

  -- Sales & marketing
  ('leads_generated',   'Total de leads',              'count',        'sales_marketing'),

  -- Retention
  ('open_default_count', 'Inadimplência em aberto (qtd)', 'count',     'retention'),
  ('open_default_value', 'Inadimplência em aberto (R$)',  'currency_brl', 'retention'),

  -- Finance — revenues
  ('matriculated_revenue', 'Receita matriculados', 'currency_brl', 'finance'),
  ('wellhub_revenue',      'Receita Wellhub',      'currency_brl', 'finance'),
  ('totalpass_revenue',    'Receita Totalpass',    'currency_brl', 'finance'),
  ('products_revenue',     'Receita produtos',     'currency_brl', 'finance'),

  -- Finance — totals (calculated, but saved to DB)
  ('revenue_total',   'Receita total',   'currency_brl', 'finance'),
  ('expenses_total',  'Despesas totais', 'currency_brl', 'finance'),

  -- ROI
  ('cash_balance',     'Saldo em caixa',     'currency_brl', 'roi'),
  ('recovery_balance', 'Saldo a recuperar',  'currency_brl', 'roi')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
