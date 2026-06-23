import type { KpiPageData } from "@/lib/data/kpis";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateFinanceInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção FINANCEIRO da academia.
O objetivo é avaliar a saúde e lucratividade operacional. Preste especial atenção a:
1. Composição de receitas (Matriculados com seus planos, Wellhub/Gympass, Totalpass, Vendas de Produtos).
2. Detalhamento de custos operacionais (Leasing de equipamentos, aluguel, salários, etc.).
3. Diferenças entre royalties de franquia devidos (12% da receita total) versus royalties declarados/pagos no banco.
4. Passivo fiscal oculto gerado por emissão mínima de notas fiscais sob a alíquota do Fator R (13,4% da receita).
`;

  // Royalties calculation
  const royaltiesDue = data.current.revenue_total ? Math.round(data.current.revenue_total * 0.12) : 0;
  const royaltiesPaid = data.current.royalties_validation || 0;
  const royaltiesDiff = royaltiesPaid - royaltiesDue;

  const payload = {
    periodo_atual: data.currentPeriodLabel,
    receitas_e_despesas_totais_atuais: data.current,
    receitas_e_despesas_totais_anteriores: data.previous,
    finance_charts_stacked_revenue: data.financeCharts,
    royalties: {
      devido_12pct: royaltiesDue,
      pago_declarado: royaltiesPaid,
      diferenca_mes: royaltiesDiff,
    },
    passivo_fiscal_simulado: {
      aliquota_fator_r: "13.4%",
      imposto_devido_simulado: data.current.revenue_total ? Math.round(data.current.revenue_total * 0.134) : 0,
      resultado_estimado_se_100pct_nf: data.current.operational_result_100pct_nf || 0,
    }
  };

  const userPrompt = `
Aqui estão os dados brutos de faturamento, categorias de despesa, simulação fiscal e conciliação em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça um diagnóstico financeiro detalhado, com foco especial nas divergências de royalties, custos operacionais chaves e passivo de NF. Gere de 4 a 8 insights.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
