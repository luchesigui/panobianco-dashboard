insert into public.kpi_definitions (code, label, unit, category)
values
  ('avg_ticket', 'Ticket medio', 'currency_brl', 'sales_marketing'),
  ('cac_per_sale', 'CAC por venda', 'currency_brl', 'sales_marketing'),
  ('meta_ads_investment', 'Investimento Meta Ads', 'currency_brl', 'sales_marketing'),
  ('instagram_total_reach', 'Alcance total', 'count', 'sales_marketing')
on conflict (code) do update
set label = excluded.label,
    unit = excluded.unit,
    category = excluded.category,
    updated_at = now();
