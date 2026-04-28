-- Remove the three manual marketing cost fields; CAC is now derived from
-- the "Propaganda E Marketing" cost centre in the expense breakdown.
delete from kpi_definitions
where code in (
  'marketing_cost_traffic',
  'marketing_cost_labor',
  'marketing_cost_production'
);
