import type { KpiPageData } from "@/lib/data/kpis";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateForecastInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const forecast = data.nextMonthForecast;

  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção PREVISÃO DE RESULTADO da academia (projeção para o período ${forecast.nextPeriodLabel} com base em ${forecast.basisPeriodLabel}).
O objetivo é avaliar a viabilidade, riscos e pontos de atenção da previsão financeira e operacional para o próximo mês.
Premissas aplicadas na projeção:
1. Wellhub fixado em R$ 104.848.
2. Receita de matriculados projetada a partir da base de alunos do mês anterior somada ao saldo líquido das semanas já preenchidas do mês corrente, multiplicada pelo ticket médio atual.
3. Produtos e outros baseados na média dos últimos 3 meses.
4. Despesas projetadas a partir do ritmo recente de evolução operacional com limites de segurança.
`;

  const payload = {
    periodo_base: forecast.basisPeriodLabel,
    periodo_projetado: forecast.nextPeriodLabel,
    receita_total_prevista: forecast.revenueForecast,
    despesa_total_prevista: forecast.expenseForecast,
    resultado_previsto: forecast.resultForecast,
    margem_prevista_pct: forecast.marginPct,
    matriculados_previsto: forecast.matriculatedForecast,
    alunos_projetados: forecast.projectedStudents,
    saldo_semanal_alunos: forecast.weeklyNetBalance,
    ticket_medio: forecast.ticketMedio,
    variacao_receita_vs_base_pct: forecast.revenueVsBasisPct,
    variacao_matriculados_vs_base_pct: forecast.matriculatedVsBasisPct,
    detalhes_despesa: forecast.expenseSubline,
    detalhes_matriculados: forecast.matriculatedSubline,
  };

  const userPrompt = `
Aqui estão os dados consolidados da projeção de resultado para ${forecast.nextPeriodLabel}:
${JSON.stringify(payload, null, 2)}

Faça um diagnóstico executivo da previsão de resultado, destacando a segurança da receita previsível (matriculados + Wellhub), pressão de despesas e margem operacional projetada. Gere de 3 a 5 insights objetivos.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
