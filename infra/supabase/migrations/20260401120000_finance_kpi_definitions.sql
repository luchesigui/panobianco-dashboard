-- Financeiro deep-dive KPIs (reference dashboard cards + charts)
insert into public.kpi_definitions (code, label, unit, category)
values
  ('invoice_tax_nf', 'Imposto NF emitido', 'currency_brl', 'finance'),
  ('operational_result_100pct_nf', 'Resultado se 100% NF', 'currency_brl', 'finance'),
  (
    'accumulated_operational_no_contributions',
    'Acumulado sem aportes',
    'currency_brl',
    'finance'
  ),
  ('accumulated_with_contributions', 'Acumulado com aportes', 'currency_brl', 'finance'),
  ('royalties_validation', 'Royalties (validação)', 'currency_brl', 'finance')
on conflict (code) do update
set
  label = excluded.label,
  unit = excluded.unit,
  category = excluded.category,
  updated_at = now();
