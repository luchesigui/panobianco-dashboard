alter table public.kpi_insights
  drop constraint if exists kpi_insights_insight_type_check;

alter table public.kpi_insights
  add constraint kpi_insights_insight_type_check
  check (insight_type in ('good', 'bad', 'warn', 'info', 'neutral'));
