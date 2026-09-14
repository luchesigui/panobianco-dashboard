-- Add dividends_total and operational_result KPI definitions
insert into public.kpi_definitions (code, label, unit, category)
values
  ('dividends_total', 'Dividendos distribuídos', 'currency_brl', 'finance'),
  ('operational_result', 'Resultado operacional', 'currency_brl', 'finance')
on conflict (code) do update
set
  label = excluded.label,
  unit = excluded.unit,
  category = excluded.category,
  updated_at = now();
