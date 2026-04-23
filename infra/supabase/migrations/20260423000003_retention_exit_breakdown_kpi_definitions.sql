-- Retention exit breakdown: cancellations and non-renewed contracts
insert into public.kpi_definitions (code, label, unit, category)
values
  ('monthly_cancellations', 'Cancelamentos',          'count', 'retention'),
  ('monthly_non_renewed',   'Contratos não renovados', 'count', 'retention')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
