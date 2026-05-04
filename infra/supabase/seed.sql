begin;

insert into public.gyms (slug, name, city, state, opened_at)
values ('panobianco-sjc-satelite', 'Panobianco Jd. Satelite', 'Sao Jose dos Campos', 'SP', '2025-03-01')
on conflict (slug) do update
set name = excluded.name,
    city = excluded.city,
    state = excluded.state,
    opened_at = excluded.opened_at,
    updated_at = now();

with definitions(code, label, unit, category) as (
  values
    ('base_students_end', 'Base de alunos', 'count', 'overview'),
    ('sales_total', 'Vendas no mes', 'count', 'overview'),
    ('revenue_total', 'Receita total', 'currency_brl', 'overview'),
    ('operational_result', 'Resultado operacional', 'currency_brl', 'overview'),
    ('leads_generated', 'Leads gerados', 'count', 'sales_marketing'),
    ('experimental_scheduled', 'Agendadas experimental', 'count', 'sales_marketing'),
    ('experimental_attendance', 'Presencas experimental', 'count', 'sales_marketing'),
    ('experimental_closings', 'Fechamentos experimental', 'count', 'sales_marketing'),
    ('no_show_rate', 'No-show percentual', 'percent', 'sales_marketing'),
    ('present_conversion_rate', 'Conversao presentes', 'percent', 'sales_marketing'),
    ('avg_ticket', 'Ticket medio', 'currency_brl', 'sales_marketing'),
    ('cac_per_sale', 'CAC por venda', 'currency_brl', 'sales_marketing'),
    ('meta_ads_investment', 'Investimento Meta Ads', 'currency_brl', 'sales_marketing'),
    ('instagram_total_reach', 'Alcance total', 'count', 'sales_marketing'),
    ('marketing_reach',      'Alcance',          'count', 'sales_marketing'),
    ('marketing_frequency',  'Frequência',       'count', 'sales_marketing'),
    ('marketing_views',      'Visualizações',    'count', 'sales_marketing'),
    ('marketing_followers',  'Novos seguidores', 'count', 'sales_marketing'),
    ('expenses_total', 'Despesas totais', 'currency_brl', 'finance'),
    ('expenses_products', 'Despesas de produtos', 'currency_brl', 'finance'),
    ('expenses_taxes', 'Despesas de impostos', 'currency_brl', 'finance'),
    ('expenses_payroll', 'Despesas de folha', 'currency_brl', 'finance'),
    ('expenses_property', 'Despesa de imóvel', 'currency_brl', 'finance'),
    ('expenses_other', 'Outras despesas', 'currency_brl', 'finance'),
    ('expenses_financing', 'Despesas com financiamento', 'currency_brl', 'finance'),
    ('matriculated_revenue', 'Receita matriculados', 'currency_brl', 'finance'),
    ('wellhub_revenue', 'Receita Wellhub', 'currency_brl', 'finance'),
    ('totalpass_revenue', 'Receita Totalpass', 'currency_brl', 'finance'),
    ('products_revenue', 'Receita Produtos', 'currency_brl', 'finance'),
    ('open_default_count', 'Inadimplencia em aberto (qtd)', 'count', 'retention'),
    ('open_default_value', 'Inadimplencia em aberto (R$)', 'currency_brl', 'retention'),
    ('recovered_default_count', 'Inadimplencia recuperados (qtd)', 'count', 'retention'),
    ('recovered_default_value', 'Inadimplencia recuperados (R$)', 'currency_brl', 'retention'),
    ('monthly_exits',          'Saidas no mes',            'count', 'retention'),
    ('monthly_cancellations',  'Cancelamentos',             'count', 'retention'),
    ('monthly_non_renewed',    'Contratos nao renovados',   'count', 'retention'),
    ('total_invested', 'Total investido', 'currency_brl', 'roi'),
    ('cash_balance', 'Saldo em caixa', 'currency_brl', 'roi'),
    ('recovery_balance', 'Saldo a recuperar', 'currency_brl', 'roi'),
    ('roi_payback_months', 'Payback estimado (meses)', 'count', 'roi'),
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
)
insert into public.kpi_definitions (code, label, unit, category)
select code, label, unit, category from definitions
on conflict (code) do update
set label = excluded.label,
    unit = excluded.unit,
    category = excluded.category,
    updated_at = now();

with gym as (
  select id as gym_id from public.gyms where slug = 'panobianco-sjc-satelite'
),
defs as (
  select id as def_id, code from public.kpi_definitions
),
rows(period_month, code, numeric_value, text_value, meta_json) as (
  values
    ('2025-04-01'::date, 'base_students_end', 334::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'base_students_end', 420::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'base_students_end', 481::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'base_students_end', 591::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'base_students_end', 700::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'base_students_end', 754::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'base_students_end', 760::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'base_students_end', 773::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'base_students_end', 714::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'base_students_end', 808::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'base_students_end', 827::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'base_students_end', 827::numeric, null, '{"partial": true, "goal": 875, "pending_note": "Fev — crescimento mar pendente", "pending_note_overview": "Fev — mar pendente"}'::jsonb),
    ('2026-04-01'::date, 'base_students_goal', 880::numeric, null, '{}'::jsonb),
    ('2026-05-01'::date, 'base_students_goal', 930::numeric, null, '{}'::jsonb),
    ('2026-06-01'::date, 'base_students_goal', 985::numeric, null, '{}'::jsonb),
    ('2026-07-01'::date, 'base_students_goal', 1038::numeric, null, '{}'::jsonb),
    ('2026-08-01'::date, 'base_students_goal', 1090::numeric, null, '{}'::jsonb),
    ('2026-09-01'::date, 'base_students_goal', 1100::numeric, null, '{}'::jsonb),
    ('2026-10-01'::date, 'base_students_goal', 1100::numeric, null, '{}'::jsonb),
    ('2026-11-01'::date, 'base_students_goal', 1100::numeric, null, '{}'::jsonb),
    ('2026-12-01'::date, 'base_students_goal', 1100::numeric, null, '{}'::jsonb),
    ('2025-04-01'::date, 'sales_total', 106::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'sales_total', 120::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'sales_total', 109::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'sales_total', 163::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'sales_total', 175::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'sales_total', 125::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'sales_total', 112::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'sales_total', 124::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'sales_total', 43::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'sales_total', 151::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'sales_total', 112::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'sales_total', 100::numeric, null, '{"partial": true, "goal": 150, "goal_pct": 67, "delta_pct_display": -5}'::jsonb),
    ('2025-04-01'::date, 'revenue_total', 3316::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'revenue_total', 81944::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'revenue_total', 100299::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'revenue_total', 112274::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'revenue_total', 123791::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'revenue_total', 146059::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'revenue_total', 173442::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'revenue_total', 165637::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'revenue_total', 166640::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'revenue_total', 156416::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'revenue_total', 182673::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'revenue_total', 198963::numeric, null, '{"partial": true, "compact_currency": true, "delta_pct_display": 8.9}'::jsonb),
    ('2025-04-01'::date, 'operational_result', -111996::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'operational_result', -69478::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'operational_result', -25144::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'operational_result', -23149::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'operational_result', -15283::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'operational_result', 8734::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'operational_result', 4742::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'operational_result', -12225::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'operational_result', -8321::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'operational_result', 4129::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'operational_result', 21597::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'operational_result', 32661::numeric, null, '{"partial": true, "margin_percent": 16.4, "record": true, "delta_pct_display": 51.2}'::jsonb),
    ('2026-02-01'::date, 'leads_generated', 430::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'leads_generated', 339::numeric, null, '{"partial": true}'::jsonb),
    ('2026-02-01'::date, 'experimental_scheduled', 105::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'experimental_scheduled', 93::numeric, null, '{"partial": true}'::jsonb),
    ('2026-02-01'::date, 'experimental_attendance', 45::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'experimental_attendance', 22::numeric, null, '{"partial": true}'::jsonb),
    ('2026-02-01'::date, 'experimental_closings', 26::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'experimental_closings', 17::numeric, null, '{"partial": true}'::jsonb),
    ('2026-02-01'::date, 'no_show_rate', 57::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'no_show_rate', 77::numeric, null, '{"partial": true, "detail_line": "71 faltas de 93 agendados", "previous_rate": 57}'::jsonb),
    ('2026-02-01'::date, 'present_conversion_rate', 58::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'present_conversion_rate', 77::numeric, null, '{"partial": true, "detail_line": "17 de 22", "previous_rate": 58}'::jsonb),
    ('2025-04-01'::date, 'expenses_total', 115312::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'expenses_total', 151422::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'expenses_total', 125443::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'expenses_total', 135423::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'expenses_total', 139074::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'expenses_total', 137325::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'expenses_total', 168700::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'expenses_total', 177862::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'expenses_total', 174961::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'expenses_total', 152287::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'expenses_total', 161076::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'expenses_total', 166302::numeric, null, '{"partial": true, "delta_abs_line": "+R$ 5,2k"}'::jsonb),
    ('2025-04-01'::date, 'matriculated_revenue', 678::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'matriculated_revenue', 19181::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'matriculated_revenue', 26458::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'matriculated_revenue', 32954::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'matriculated_revenue', 40014::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'matriculated_revenue', 51554::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'matriculated_revenue', 66374::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'matriculated_revenue', 68311::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'matriculated_revenue', 73677::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'matriculated_revenue', 73806::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'matriculated_revenue', 79506::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'matriculated_revenue', 102884::numeric, null, '{"partial": true, "recorrente": 79286, "anual": 12548, "mensal": 9475, "nao_categorizado": 1575, "delta_pct_display": 29.4}'::jsonb),
    ('2025-04-01'::date, 'wellhub_revenue', 1948::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'wellhub_revenue', 45516::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'wellhub_revenue', 52497::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'wellhub_revenue', 55167::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'wellhub_revenue', 56859::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'wellhub_revenue', 62407::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'wellhub_revenue', 68549::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'wellhub_revenue', 60156::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'wellhub_revenue', 55181::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'wellhub_revenue', 46783::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'wellhub_revenue', 81329::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'wellhub_revenue', 74738::numeric, null, '{"partial": true, "delta_pct_display": -8.1}'::jsonb),
    ('2025-04-01'::date, 'totalpass_revenue', 407::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'totalpass_revenue', 10199::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'totalpass_revenue', 12670::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'totalpass_revenue', 14391::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'totalpass_revenue', 16098::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'totalpass_revenue', 19265::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'totalpass_revenue', 23199::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'totalpass_revenue', 22462::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'totalpass_revenue', 22908::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'totalpass_revenue', 21793::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'totalpass_revenue', 17243::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'totalpass_revenue', 16848::numeric, null, '{"partial": true}'::jsonb),
    ('2025-04-01'::date, 'products_revenue', 85::numeric, null, '{}'::jsonb),
    ('2025-05-01'::date, 'products_revenue', 2131::numeric, null, '{}'::jsonb),
    ('2025-06-01'::date, 'products_revenue', 2655::numeric, null, '{}'::jsonb),
    ('2025-07-01'::date, 'products_revenue', 3024::numeric, null, '{}'::jsonb),
    ('2025-08-01'::date, 'products_revenue', 3392::numeric, null, '{}'::jsonb),
    ('2025-09-01'::date, 'products_revenue', 4070::numeric, null, '{}'::jsonb),
    ('2025-10-01'::date, 'products_revenue', 4914::numeric, null, '{}'::jsonb),
    ('2025-11-01'::date, 'products_revenue', 4769::numeric, null, '{}'::jsonb),
    ('2025-12-01'::date, 'products_revenue', 4876::numeric, null, '{}'::jsonb),
    ('2026-01-01'::date, 'products_revenue', 4649::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'products_revenue', 3299::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'products_revenue', 4493::numeric, null, '{"partial": true}'::jsonb),
    ('2026-03-01'::date, 'invoice_tax_nf', 25::numeric, null, '{"partial": true, "approximate_main": true, "pct_revenue_line": "0,01% da receita", "ref_line": "ref: 13,4%"}'::jsonb),
    ('2026-03-01'::date, 'operational_result_100pct_nf', 6000::numeric, null, '{"partial": true}'::jsonb),
    ('2026-03-01'::date, 'accumulated_operational_no_contributions', -194000::numeric, null, '{"partial": true, "subline": "resultado operacional puro", "footnote": "Só receita − despesas, sem aportes dos sócios", "delta_vs_prev_pill": "+R$ 32.661 vs Fev"}'::jsonb),
    ('2026-03-01'::date, 'accumulated_with_contributions', 61367::numeric, null, '{"partial": true, "compact_currency": true, "subline": "inclui R$ 255k aportes pós-inauguração", "aportes_line": "Aportes: Abr R$ 158k · Jun R$ 51k · Jul R$ 18,5k · Ago R$ 27,6k", "delta_vs_prev_pill": "+R$ 32.661 vs Fev"}'::jsonb),
    ('2026-03-01'::date, 'royalties_validation', 18497::numeric, null, '{"partial": true, "pct_line": "9,3% da receita (deveria ser 12%)", "shortfall_pill": "−R$ 5.385"}'::jsonb),
    ('2026-01-01'::date, 'monthly_exits', 89::numeric, null, '{}'::jsonb),
    ('2026-02-01'::date, 'monthly_exits', 115::numeric, null, '{}'::jsonb),
    ('2026-03-01'::date, 'open_default_count', 107::numeric, null, '{"partial": true, "cancelled_count": 12, "month_total_records": 232, "recovery_rate_pct": 49, "recovery_3d_pill": "50% em até 3 dias"}'::jsonb),
    ('2026-03-01'::date, 'open_default_value', 13619::numeric, null, '{"partial": true}'::jsonb),
    ('2026-03-01'::date, 'recovered_default_count', 113::numeric, null, '{"partial": true}'::jsonb),
    ('2026-03-01'::date, 'recovered_default_value', 14439::numeric, null, '{"partial": true}'::jsonb),
    ('2026-03-01'::date, 'total_invested', 1020300::numeric, null,
      '{"card_title": "Total investido (Bruno+Guilherme)", "subline": "R$ 765k pré + R$ 255k pós inauguração", "detail_line": "Pré: materiais R$ 497k, serviços R$ 351k, franquia R$ 80k, outros R$ 65k"}'::jsonb),
    ('2026-03-01'::date, 'cash_balance', 61367::numeric, null,
      '{"card_title": "Saldo em caixa (fluxo real)", "subline": "aportes pós (R$ 255k) + resultado acum. (-R$ 194k)", "pct_of_investment_pill": "6% do investimento", "pct_of_investment": 6}'::jsonb),
    ('2026-03-01'::date, 'recovery_balance', 958933::numeric, null,
      '{"card_title": "A recuperar", "subline": "investido - saldo em caixa"}'::jsonb),
    ('2026-03-01'::date, 'roi_payback_months', 49::numeric, null,
      '{"subline": "no ritmo atual (R$ 19.462/mês)", "detail_line": "Com Wellhub (Ago/26): ~19 meses (-R$ 50.133/mês)"}'::jsonb),
    ('2026-03-01'::date, 'avg_ticket', 124::numeric, null, '{"partial": true, "goal_brl": 116, "meta_line": "meta: R$ 116 (gap R$ -6.616/mês)", "breakdown_line": "Recorrente R$ 96 · Anual R$ 100 · Mensal R$ 95"}'::jsonb),
    ('2026-03-01'::date, 'cac_per_sale', 47::numeric, null, '{"detail_line": "R$ 4.661 marketing / 100 vendas"}'::jsonb),
    ('2026-03-01'::date, 'meta_ads_investment', 2000::numeric, null, '{"detail_line": "R$ 1.500 mídia + R$ 500 gestão"}'::jsonb),
    ('2026-03-01'::date, 'instagram_total_reach', 442000::numeric, null, '{"detail_line": "1.273.000 views · +310 seguidores"}'::jsonb)
)
insert into public.kpi_values (gym_id, period_id, kpi_definition_id, value_numeric, value_text, meta_json)
select gym.gym_id, rows.period_month, defs.def_id, rows.numeric_value, rows.text_value, rows.meta_json
from rows
join gym on true
join defs on defs.code = rows.code
on conflict (gym_id, period_id, kpi_definition_id) do update
set value_numeric = excluded.value_numeric,
    value_text = excluded.value_text,
    meta_json = excluded.meta_json,
    updated_at = now();

delete from public.kpi_insights
where gym_id = (select id from public.gyms where slug = 'panobianco-sjc-satelite')
  and period_id = '2026-03-01'::date;

with gym as (
  select id as gym_id from public.gyms where slug = 'panobianco-sjc-satelite'
)
insert into public.kpi_insights (gym_id, period_id, category, insight_scope, insight_type, title, body, sort_order, meta_json)
values
  ((select gym_id from gym), '2026-03-01', 'overview', 'kpi', 'good', '', 'Novo recorde operacional: +R$ 32,7k (margem 16,4%), superando Fev (+R$ 21,6k). Terceiro mês consecutivo positivo.', 1, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'overview', 'kpi', 'good', '', 'Receita recorde R$ 199k puxada pela alta de +29% em matriculados (R$ 102,9k). Matriculados voltaram a liderar receita.', 2, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'overview', 'kpi', 'bad', '', 'No-show explodiu para 77% (era 57%). Apenas 22 de 93 agendados apareceram. Régua de confirmação (ação 2.1) é urgente.', 3, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'overview', 'kpi', 'warn', '', 'Leads caíram 21% (339 vs 430). Alcance do Instagram recuou semana a semana. Investimento de R$ 1.500 em mídia tem espaço para escalar.', 4, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'bad', 'No-show é o maior gargalo:', 'subiu de 57% para 77%. De 93 agendamentos, 71 não apareceram. Estima-se perda de 20+ vendas potenciais.', 1, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'good', 'Quando o lead aparece, fecha:', 'conversão dos presentes subiu de 58% para 77%. A academia se vende — o problema é trazer o lead.', 2, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'info', 'Vendas via experimental (17)', 'representam apenas 17% do total (100). Os outros 83 vieram de indicação, passou na frente, sistema online e outros canais.', 3, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'warn', 'Meta individual por recepcionista: 38/mês.', 'Nenhuma bateu — Tamires chegou mais perto (31). Susana: 21, Gabriela: 23, Kathleen: 4 (nova). O gap é estrutural (no-show + leads).', 4, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'info', 'CAC de R$ 47 por venda', '(R$ 4.661 marketing total / 100 vendas). Via Meta Ads o custo é R$ 20/venda considerando só mídia digital. Há espaço para escalar o investimento.', 5, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'kpi', 'warn', 'Alcance Instagram caiu semana a semana:', '130k -> 120k -> 110k -> 82k. Semana 3 teve melhor taxa de seguidores (1,65%) — investigar o que foi diferente.', 6, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'retention', 'kpi', 'warn', 'Inadimplência março (parcial):', '107 em aberto (R$ 13,6k) mas 113 já recuperados (R$ 14,4k). Taxa de recuperação em até 3 dias é 50%.', 1, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'retention', 'kpi', 'bad', '53 cobranças com 16-30 dias', '— metade do em aberto. São as mais difíceis de recuperar. Ação 5.3 (limpar dívida velha) continua pendente.', 2, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'retention', 'kpi', 'info', 'Crescimento de março', '(entradas, saídas, base final) será atualizado quando o mês fechar no EVO.', 3, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'good', '', 'Terceiro mês positivo consecutivo e novo recorde: +R$ 32,7k (margem 16,4%). Tendência: Jan +R$ 4,1k → Fev +R$ 21,6k → Mar +R$ 32,7k.', 1, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'bad', '', 'Passivo fiscal (NF): emissão de NF hoje é mínima (~0% da receita). Se emitisse 100% (13,4%), o imposto seria R$ 26.661/mês. O resultado cairia de +R$ 33k para +R$ 6.000 (margem 3%). A operação se sustenta, mas com margem apertada. Esse passivo acumula mês a mês.', 2, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'bad', '', 'Royalties divergentes pelo 2º mês: pagou R$ 18,5k (9,3%) vs R$ 23,9k devidos (12%). Faltam R$ 5.385 em março. Acumulado: R$ 9.902 a menos. Investigar com a franqueadora.', 3, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'good', '', 'Matriculados ultrapassaram Wellhub: R$ 102,9k (51,6%). 77% vem do recorrente (R$ 79,3k) — receita previsível e saudável.', 4, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'bad', '', 'Insumos disparou +79%: de R$ 2,9k para R$ 5,2k — maior variação proporcional do mês.', 5, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'warn', '', 'Água subiu 39%: de R$ 3,4k para R$ 4,8k. Monitorar.', 6, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'info', '', 'Despesas pontuais: IPTU R$ 1,9k + Rescisões R$ 1,6k = R$ 3,5k não recorrente.', 7, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'kpi', 'warn', '', 'Wellhub recuou R$ 6,6k (R$ 74,7k vs R$ 81,3k). Acordo de R$ 112k/mês em Ago/26 elimina volatilidade.', 8, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'info', '', 'Investimento total: R$ 1.020.300 (Bruno + Guilherme) — R$ 765,2k antes da inauguração + R$ 255,1k de aportes operacionais (Abr a Ago/25). Sem aportes desde Set/25.', 1, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'info', '', 'Saldo em caixa: R$ 61.367 — fluxo real considerando que meses negativos consomem caixa e meses positivos geram. Representa 6% do investimento total.', 2, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'neutral', '', 'Faltam R$ 958.933 para recuperar. No ritmo atual (média R$ 19.462/mês), o payback levaria ~49 meses (4 anos e 1 meses).', 3, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'good', '', 'Com o acordo Wellhub (+R$ 30,7k/mês a partir de Ago/26), a média projetada sobe para ~R$ 50.133/mês e o payback cai para ~19 meses.', 4, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'good', '', 'Aceleração nos últimos 3 meses: Jan +R$ 4k, Fev +R$ 22k, Mar +R$ 33k = R$ 58k gerados. A operação está ganhando tração.', 5, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'kpi', 'info', '', 'Distribuição de lucro (Gabriel): R$ 11.500 acumulados. Gabriel entrou com trabalho, não com capital — não entra na conta do retorno.', 6, '{}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'overview', 'analysis', 'info', 'Analise mensal overview', 'Mar/26 combina receita recorde (R$ 198.963) com pressao comercial por no-show elevado. Prioridade: recuperar presenca em experimental.', 100, '{"section":"overview"}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'analysis', 'info', 'Analise mensal vendas/marketing', 'Conversao dos presentes foi forte (77%), mas gargalo principal esta em comparecimento. Melhor alocacao de esforco: confirmacao e lembrete de aula experimental.', 100, '{"section":"sales_marketing"}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'retention', 'analysis', 'info', 'Analise mensal retencao', 'Inadimplencia parcial mostra boa recuperacao em ate 3 dias, mas risco concentrado em atrasos de 16-30 dias exige acao ativa.', 100, '{"section":"retention"}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'finance', 'analysis', 'info', 'Analise mensal financeiro', 'Terceiro mes positivo consecutivo. Estrutura de custos segue sensivel a variacoes em insumos e divergencia de royalties.', 100, '{"section":"finance"}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'roi', 'analysis', 'info', 'Analise mensal ROI', 'Operacao acelera geracao de caixa, mas saldo a recuperar ainda e relevante (R$ 958.933).', 100, '{"section":"roi"}'::jsonb),
  ((select gym_id from gym), '2026-03-01', 'sales_marketing', 'feature_of_month', 'warn', 'Feature do mes: reducao de no-show', 'Programa focado em confirmacao ativa de aulas experimentais para reduzir no-show e recuperar vendas potenciais.', 200, '{"feature_code":"no_show_reduction_program","status":"active","impact":{"current_no_show_rate":77,"previous_no_show_rate":57,"target_no_show_rate":45}}'::jsonb);

insert into public.sales_marketing_dashboard_payload (gym_id, period_id, payload)
select
  id,
  '2026-03-01'::date,
  $sm$
{
  "salesComposition": {
    "sectionTitle": "Composição das vendas",
    "experimental": {
      "title": "Via aula experimental",
      "value": 17,
      "subtext": "17% do total · 77% conversão presentes"
    },
    "otherChannels": {
      "title": "Outros canais",
      "value": 83,
      "subtext": "Indicação, passou na frente, sistema, outros"
    }
  },
  "funnel": {
    "scheduled": { "value": 93, "subtext": "de 339 leads" },
    "present": { "value": 22, "subtext": "24%" },
    "closings": { "value": 17, "subtext": "77%" },
    "conversion": { "value": 18.3, "subtext": "dos agendados", "isPercent": true }
  },
  "weekly": {
    "weekHeaders": ["S1", "S2", "S3", "S4"],
    "marketingTitle": "MARKETING — META ADS / INSTAGRAM",
    "marketing": {
      "reach": [130000, 120000, 110000, 82000],
      "frequency": [2.2, 2.7, 3.7, 3.0],
      "views": [295000, 324000, 409000, 245000],
      "followers": [51, 60, 130, 69],
      "totals": { "reach": 442000, "frequency": 2.9, "views": 1273000, "followers": 310 }
    },
    "funnelTitle": "FUNIL DE AULA EXPERIMENTAL",
    "funnelNote": "Dados semanais a partir de Abr/26",
    "funnelWeekly": {
      "scheduled": [null, null, null, null],
      "attendance": [null, null, null, null],
      "closings": [null, null, null, null],
      "totals": { "scheduled": 93, "attendance": 22, "closings": 17 }
    },
    "salesTitle": "VENDAS TOTAIS",
    "salesNote": "Dados semanais a partir de Abr/26",
    "salesWeekly": {
      "totals": [null, null, null, null],
      "grandTotal": 100
    }
  },
  "receptionistsPeriodLabel": "Mar/26",
  "receptionists": [
    { "name": "Susana", "leads": 71, "sales": 21, "goal": 38, "conversion_pct": 29.6 },
    { "name": "Tamires", "leads": 113, "sales": 31, "goal": 38, "conversion_pct": 27.4 },
    { "name": "Gabriela", "leads": 111, "sales": 23, "goal": 38, "conversion_pct": 20.7 },
    { "name": "Kathleen", "badge": "nova", "leads": 23, "sales": 4, "goal": 38, "conversion_pct": 17.4, "bar_variant": "accent" }
  ]
}
$sm$::jsonb
from public.gyms
where slug = 'panobianco-sjc-satelite'
on conflict (gym_id, period_id) do update
set payload = excluded.payload,
    updated_at = now();

commit;
