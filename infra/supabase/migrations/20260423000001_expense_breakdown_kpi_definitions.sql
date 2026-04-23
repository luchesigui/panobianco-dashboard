-- Expense breakdown KPIs (replaces single expenses_total manual entry)
insert into public.kpi_definitions (code, label, unit, category)
values
  ('expenses_products',   'Despesas de produtos',        'currency_brl', 'finance'),
  ('expenses_taxes',      'Despesas de impostos',        'currency_brl', 'finance'),
  ('expenses_payroll',    'Despesas de folha',           'currency_brl', 'finance'),
  ('expenses_property',   'Despesa de imóvel',           'currency_brl', 'finance'),
  ('expenses_other',      'Outras despesas',             'currency_brl', 'finance'),
  ('expenses_financing',  'Despesas com financiamento',  'currency_brl', 'finance')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
