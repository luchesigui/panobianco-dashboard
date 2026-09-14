import type { KpiPageData } from "@/lib/data/kpis";
import { formatCompactBrl } from "@/lib/kpis/format";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateRoiInsights(
  data: KpiPageData,
  apiKey: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const current = data.current;
  const currentMeta = data.currentMeta;
  const totalInvested = current["total_invested"] ?? 1_020_000;
  const cashBalance = current["cash_balance"] ?? 0;
  const recoveryBalance = current["recovery_balance"] ?? 0;
  const paybackMonths = current["roi_payback_months"] ?? 0;
  const recMeta = currentMeta["recovery_balance"] ?? {};
  const payMeta = currentMeta["roi_payback_months"] ?? {};

  const totalDividendsAmortized = Math.max(0, totalInvested - recoveryBalance);
  const pctAmortized =
    totalInvested > 0
      ? Math.round((totalDividendsAmortized / totalInvested) * 1000) / 10
      : 0;

  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção RETORNO DO INVESTIMENTO (ROI) dos sócios/investidores da academia (Bruno e Guilherme).
O objetivo é avaliar o progresso da recuperação do capital investido através da distribuição de lucros (dividendos), o ritmo de amortização mês a mês e o payback estimado.

Regras e premissas do ROI:
1. Total Investido: ${formatCompactBrl(totalInvested)} (R$ 765,2k pré-inauguração + R$ 255,1k de aportes operacionais entre Abr e Ago/25). Sem novos aportes desde Set/25.
2. Gabriel entrou com trabalho gerencial e não com capital — a distribuição de lucro histórica dele (R$ 11.500) não entra na conta do retorno dos investidores.
3. Saldo a recuperar: Calculado de forma estritamente progressiva mês a mês como o Total Investido menos o total acumulado distribuído de lucros aos sócios.
4. Ritmo de Payback: Calculado dividindo o saldo a recuperar pela média de lucros distribuídos dos últimos 3 meses.
`;

  const payload = {
    periodo_atual: data.kpiDataPeriod,
    total_investido: totalInvested,
    saldo_em_caixa_atual: cashBalance,
    saldo_a_recuperar: recoveryBalance,
    total_lucro_distribuido_acumulado: totalDividendsAmortized,
    percentual_amortizado_pct: pctAmortized,
    payback_estimado_meses: paybackMonths,
    subline_recuperar: recMeta.subline,
    detalhes_recuperar: recMeta.detail_line,
    subline_payback: payMeta.subline,
    detalhes_payback: payMeta.detail_line,
    media_distribuicao_lucro_3m: payMeta.avg_dividends_3m,
    distribuicao_lucro_mes_atual: current["dividends_total"] ?? 0,
    resultado_operacional_mes_atual: current["operational_result"] ?? 0,
    evolucao_saldo_recuperar: data.roiCharts?.recoveryEvolution,
  };

  const userPrompt = `
Aqui estão os dados consolidados do Retorno do Investimento (ROI) em ${data.currentPeriodLabel}:
${JSON.stringify(payload, null, 2)}

Faça um diagnóstico executivo do ROI para os sócios Bruno e Guilherme, destacando:
1. O saldo restante a recuperar e o total amortizado via lucro distribuído.
2. A velocidade da amortização recente e a estimativa de payback no ritmo atual.
3. A sustentabilidade do fluxo de caixa e o impacto do resultado operacional na capacidade de continuar distribuindo dividendos.
Gere de 3 a 5 insights objetivos e acionáveis.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
