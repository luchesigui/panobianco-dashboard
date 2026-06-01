-- Migration to add monthly_renewed KPI definition
insert into public.kpi_definitions (code, label, unit, category)
values
  ('monthly_renewed', 'Contratos renovados', 'count', 'retention')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
