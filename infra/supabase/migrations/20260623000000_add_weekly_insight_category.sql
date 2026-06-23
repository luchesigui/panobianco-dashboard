-- Add 'sales_marketing_weekly' to the category check constraint of kpi_insights table
alter table public.kpi_insights
  drop constraint if exists kpi_insights_category_check;

alter table public.kpi_insights
  add constraint kpi_insights_category_check
  check (category in ('overview', 'sales_marketing', 'sales_marketing_weekly', 'retention', 'finance', 'roi'));
