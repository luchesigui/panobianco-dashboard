import type { KpiPageData } from "@/lib/data/kpis";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateSalesMarketingMonthlyInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const systemPrompt = `${PROMPT_MASTER}

 Você está analisando a seção VENDAS E MARKETING MENSAL do dashboard.
O objetivo é avaliar a eficiência geral do funil de vendas (leads, agendados, presenças e fechamentos), a produtividade comercial da equipe de consultoras comercial, ticket médio, CAC (Custo de Aquisição de Clientes) e retorno das mídias digitais.

REGRAS COMERCIAIS IMPORTANTES (EVITE CONFUSÃO DE CONCEITOS):
1. "leads" representa o volume de potenciais clientes atraídos/contatados.
2. "vendas" (ou "sales" / "conversões" / "fechamentos") representa os planos de fato vendidos/contratos fechados.
3. A meta individual comercial das consultoras/recepcionistas (que é de 50 vendas/contratos por pessoa, ou o valor dinâmico listado na propriedade "goal" de cada uma) refere-se estritamente à quantidade de **vendas (fechamentos)**, e NÃO ao número de leads.
4. Para saber se alguém atingiu a meta, compare apenas o campo "sales" (ou "vendas") com a meta individual ("goal"). Não compare "leads" com a meta.
`;

  const payload = {
    periodo_atual: data.currentPeriodLabel,
    kpis_mes_atual: data.current,
    kpis_mes_anterior: data.previous,
    painel_comercial_e_marketing: data.salesMarketingDashboard.payload,
  };

  const userPrompt = `
Aqui estão os dados operacionais de vendas, funil e marketing em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça uma análise crítica do funil e do desempenho comercial das consultoras/recepcionistas, gerando de 3 a 6 insights.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
