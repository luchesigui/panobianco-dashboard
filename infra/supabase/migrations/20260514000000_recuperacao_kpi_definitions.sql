-- Recovery (Recuperação) KPI definitions
insert into public.kpi_definitions (code, label, unit, category)
values
  ('recovered_default_count', 'Inadimplência recuperados (qtd)', 'count',        'retention'),
  ('recovered_default_value', 'Inadimplência recuperados (R$)',  'currency_brl', 'retention')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
