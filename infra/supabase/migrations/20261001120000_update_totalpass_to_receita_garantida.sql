-- Update totalpass_revenue label to Receita Garantida
update public.kpi_definitions
set
  label = 'Receita Garantida',
  updated_at = now()
where code = 'totalpass_revenue';
