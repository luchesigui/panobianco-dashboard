import type { KpiPageData } from "@/lib/data/kpis";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateRetentionInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção RETENÇÃO E INADIMPLÊNCIA do dashboard.
O objetivo é identificar comportamentos e variações de churn (saídas, cancelamentos e dropouts/não renovados), a eficácia e velocidade de recuperação de inadimplência (valores recuperados, em aberto, tempos de atraso), e o equilíbrio de alunos ativos.
`;

  const payload = {
    periodo_atual: data.currentPeriodLabel,
    kpis_mes_atual: data.current,
    kpis_mes_anterior: data.previous,
    dados_inadimplencia: data.retentionCharts.inadimplencia,
    historico_base_alunos: data.retentionCharts.baseHistoric,
  };

  const userPrompt = `
Aqui estão os dados brutos de cancelamentos, renovações e inadimplência em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça uma análise crítica da evasão de alunos e do fluxo de cobrança/recuperação de atrasados. Gere de 3 a 5 insights específicos.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
