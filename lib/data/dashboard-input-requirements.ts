/**
 * Single source for KPI data-entry fields: mirrors dashboard consumption
 * (app/kpis/page.tsx, lib/data/kpis.ts, deep dives). Dados_Panobianco.md is human reference only.
 *
 * Fields listed here are MANUALLY entered. Calculated fields (no_show_rate,
 * present_conversion_rate, cac_per_sale, revenue_total in overview,
 * operational_result, operational_result_100pct_nf, recovered_default_*,
 * monthly_exits) are derived by the dashboard and must NOT appear here.
 */

export type KpiInputUnit = "currency" | "percent" | "count";

export type KpiFormField = {
  code: string;
  label: string;
  unit: KpiInputUnit;
  /** Short tooltip shown next to the label (replaces inline description spans). */
  hint?: string;
};

export type KpiFormGroup = {
  id: string;
  title: string;
  description?: string;
  fields: KpiFormField[];
};

/** Card KPIs + values used in section bodies (aligned with KpisPage). */
export const KPI_FORM_GROUPS: KpiFormGroup[] = [
  {
    id: "overview",
    title: "Visão geral",
    fields: [
      { code: "base_students_end", label: "Base de alunos (fim do mês)", unit: "count" },
      { code: "base_students_goal", label: "Meta de base de alunos", unit: "count" },
      {
        code: "sales_total",
        label: "Vendas no mês",
        unit: "count",
        hint: "Cartões VM e gráfico de vendas mensais",
      },
    ],
  },
  {
    id: "sales_marketing",
    title: "Vendas e marketing",
    fields: [
      { code: "leads_generated", label: "Total de leads", unit: "count" },
      { code: "marketing_reach", label: "Alcance", unit: "count" },
      { code: "marketing_frequency", label: "Frequência", unit: "count" },
      { code: "marketing_views", label: "Visualizações", unit: "count" },
      { code: "marketing_followers", label: "Novos seguidores", unit: "count" },
      {
        code: "marketing_cost_traffic",
        label: "Custo com tráfego",
        unit: "currency",
        hint: "Tráfego pago (Meta Ads e outros canais)",
      },
      {
        code: "marketing_cost_labor",
        label: "Custo com mão de obra",
        unit: "currency",
        hint: "Gestores de tráfego, closers, SDRs",
      },
      {
        code: "marketing_cost_production",
        label: "Custo de produção",
        unit: "currency",
        hint: "Fotografia, vídeo, design e conteúdo",
      },
    ],
  },
  {
    id: "retention",
    title: "Retenção",
    description: "Inadimplência em aberto no mês. Taxa de recuperação e saídas são calculadas automaticamente.",
    fields: [
      { code: "open_default_count", label: "Inadimplência em aberto (qtd)", unit: "count" },
      { code: "open_default_value", label: "Inadimplência em aberto (R$)", unit: "currency" },
      { code: "monthly_cancellations", label: "Cancelamentos", unit: "count" },
      { code: "monthly_non_renewed", label: "Contratos não renovados", unit: "count" },
    ],
  },
  {
    id: "finance_revenues",
    title: "Financeiro — Receitas",
    description: "Receita total calculada automaticamente.",
    fields: [
      {
        code: "matriculated_revenue",
        label: "Receita matriculados",
        unit: "currency",
        hint: "Gráfico de receita empilhada",
      },
      {
        code: "wellhub_revenue",
        label: "Receita Wellhub",
        unit: "currency",
        hint: "Gráfico de receita empilhada",
      },
      {
        code: "totalpass_revenue",
        label: "Receita Totalpass",
        unit: "currency",
        hint: "Gráfico de receita empilhada",
      },
      {
        code: "products_revenue",
        label: "Receita produtos",
        unit: "currency",
        hint: "Gráfico de receita empilhada",
      },
    ],
  },
  {
    id: "roi",
    title: "Retorno do investimento",
    fields: [
      { code: "cash_balance", label: "Saldo em caixa", unit: "currency" },
      { code: "recovery_balance", label: "Saldo a recuperar", unit: "currency" },
    ],
  },
];

/** Unique KPI codes across groups.
 *  revenue_total and expenses_total are calculated (not entered) but still saved to DB.
 *  roi_payback_months is computed by the dashboard from revenue/expenses/recovery — not saved. */
export const ALL_KPI_CODES_FOR_MONTH = [
  "revenue_total",
  "expenses_total",
  ...new Set(KPI_FORM_GROUPS.flatMap((g) => g.fields.map((f) => f.code))),
];

/** Hint text: Dados_Panobianco.md aligns with overview + finance + retention tables. */
export const REFERENCE_DOC_HINT =
  "Referência humana: arquivo Dados_Panobianco (não substitui este manifesto).";
