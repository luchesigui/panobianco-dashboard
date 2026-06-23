import type { KpiPageData } from "@/lib/data/kpis";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateOverviewInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const currentMonthIdx = new Date(data.kpiDataPeriod).getMonth();
  const currentStudentGoal = data.gymConfiguration.goal[currentMonthIdx] || null;

  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção VISÃO GERAL (Overview) do dashboard da academia.
O objetivo é extrair conclusões de alto nível sobre a saúde do negócio, focando no equilíbrio geral, crescimento da base, capacidade de faturamento e geração de caixa.
`;

  const payload = {
    periodo_atual: data.currentPeriodLabel,
    periodo_atual_raw: data.kpiDataPeriod,
    meta_base_alunos_periodo_atual: currentStudentGoal,
    kpis_mes_atual: data.current,
    kpis_mes_anterior: data.previous,
    kpis_dois_meses_atras: data.previousPrevious,
  };

  const userPrompt = `
Aqui estão os dados brutos de KPIs gerais do mês atual e meses anteriores em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça uma análise de alto nível contendo de 3 a 5 insights.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
