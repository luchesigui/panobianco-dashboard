import type { KpiPageData } from "@/lib/data/kpis";
import { getServiceSupabase } from "@/lib/supabase/server";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateSalesMarketingWeeklyInsights(
  data: KpiPageData,
  apiKey: string,
  periodId: string,
  weekHeader?: string
): Promise<{
  insights: Array<{ type: string; title: string; body: string }>;
  weekHeader: string;
}> {
  const sm = data.salesMarketingDashboard.payload;
  const prevSm = data.salesMarketingDashboard.comparisonPayload;
  
  if (!sm || !sm.weekly) {
    throw new Error("Dados semanais de vendas e marketing não encontrados para o período.");
  }

  const primarySm = data.salesMarketingDashboard.primaryPayload || sm;

  // Helper to calculate the calendar week index (0-based) for a given date
  function getWeekIdx(date: Date): number {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const wednesday = new Date(startOfWeek);
    wednesday.setDate(startOfWeek.getDate() + 3);

    const ownerYear = wednesday.getFullYear();
    const ownerMonthNum = wednesday.getMonth();

    const firstDayOfMonth = new Date(ownerYear, ownerMonthNum, 1);
    const firstWednesday = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    firstWednesday.setDate(firstDayOfMonth.getDate() + daysUntilWednesday);

    const firstWeekSunday = new Date(firstWednesday);
    firstWeekSunday.setDate(firstWednesday.getDate() - 3);

    const diffMs = startOfWeek.getTime() - firstWeekSunday.getTime();
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  }

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const currentMonthPeriod = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const isCurrentMonth = periodId === currentMonthPeriod;

  const weeksCount = primarySm.weekly.weekHeaders.length;
  let targetWeekHeader = weekHeader;
  let targetWeekIdx = -1;

  if (targetWeekHeader) {
    targetWeekIdx = primarySm.weekly.weekHeaders.indexOf(targetWeekHeader);
  }

  if (targetWeekIdx === -1) {
    // Detect the last filled week in the current month using the raw unmerged primary payload
    // If analyzing the current month, limit the search to weeks before the current calendar week (we always analyze the completed previous week)
    const maxSearchIdx = isCurrentMonth 
      ? Math.min(weeksCount - 1, getWeekIdx(today) - 1)
      : weeksCount - 1;

    let lastFilledWeekIdx = -1;
    for (let i = maxSearchIdx; i >= 0; i--) {
      const hasData =
        primarySm.weekly.marketing.reach[i] != null ||
        primarySm.weekly.marketing.followers[i] != null ||
        primarySm.weekly.funnelWeekly.closings[i] != null ||
        primarySm.weekly.salesWeekly.totals[i] != null;
      if (hasData) {
        lastFilledWeekIdx = i;
        break;
      }
    }

    targetWeekIdx = lastFilledWeekIdx !== -1 ? lastFilledWeekIdx : 0;
    targetWeekHeader = primarySm.weekly.weekHeaders[targetWeekIdx];
  }

  // Query raw data from the same month last year (e.g. June 2025 if current is June 2026)
  let lastYearRawData: any = null;
  try {
    const supabase = getServiceSupabase();
    const parts = periodId.split("-");
    if (parts.length === 3) {
      const lastYearPeriod = `${Number(parts[0]) - 1}-${parts[1]}-01`;
      
      const { data: gymRow } = await supabase
        .from("gyms")
        .select("id")
        .eq("slug", "panobianco-sjc-satelite")
        .single();

      if (gymRow?.id) {
        const [marketingRes, funnelRes, conversioesRes] = await Promise.all([
          supabase.from("marketing_semanal").select("week_num,reach,frequency,views,followers").eq("gym_id", gymRow.id).eq("period_id", lastYearPeriod),
          supabase.from("funil_semanal").select("week_num,scheduled,attendance,closings").eq("gym_id", gymRow.id).eq("period_id", lastYearPeriod),
          supabase.from("conversoes_semanais").select("week_num,leads,sales").eq("gym_id", gymRow.id).eq("period_id", lastYearPeriod),
        ]);
        
        lastYearRawData = {
          period_id: lastYearPeriod,
          marketing: marketingRes.data || [],
          funnel: funnelRes.data || [],
          conversoes: conversioesRes.data || [],
        };
      }
    }
  } catch (err) {
    console.error("Failed to fetch last year's weekly data, proceeding without it:", err);
  }

  const systemPrompt = `${PROMPT_MASTER}

Você está analisando a seção VENDAS E MARKETING SEMANAL.
Foco principal de análise: Semana ${targetWeekHeader} do mês de ${data.salesMarketingDashboard.calendarCurrentMonthLabel}.

Seu objetivo é analisar as flutuações de tráfego pago (Instagram/Meta Ads) semana a semana, a constância do funil semanal (agendadas, comparecimentos e fechamentos) e as oscilações de conversão WoW.

REGRAS COMERCIAIS IMPORTANTES (EVITE CONFUSÃO DE CONCEITOS):
1. "leads" representa o volume de potenciais clientes contatados/recebidos.
2. "vendas" (ou "sales" / "conversões" / "fechamentos") representa a quantidade de planos efetivamente vendidos (contratos fechados).
3. A meta individual comercial das consultoras (que é de 50 vendas/contratos por pessoa) refere-se estritamente à quantidade de **vendas (conversões/fechamentos)**, e NÃO ao número de leads.
4. Para qualquer avaliação de meta individual, compare apenas as vendas ("sales") com a meta de 50 (ou com o "goal" indicado).
`;

  const payload = {
    semana_foco: targetWeekHeader,
    mes_atual_label: data.salesMarketingDashboard.calendarCurrentMonthLabel,
    mes_anterior_label: data.salesMarketingDashboard.comparisonPeriodLabel,
    semanas_mes_atual_dados_brutos: primarySm.weekly,
    semanas_mes_anterior_dados_brutos: prevSm?.weekly || null,
    dados_brutos_mes_ano_passado: lastYearRawData,
  };

  const prevWeekHeader = targetWeekIdx > 0 ? primarySm.weekly.weekHeaders[targetWeekIdx - 1] : null;

  const userPrompt = `
Aqui estão os dados brutos semanais das campanhas e do funil de vendas em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça uma análise altamente focada e específica sobre o desempenho da semana ${targetWeekHeader} de ${payload.mes_atual_label}.
Compare obrigatoriamente a semana de foco com os seguintes períodos/contextos:
1. Semana anterior (semana passada) deste mesmo mês (semana ${prevWeekHeader || "não disponível"}).
2. Mesma semana do mês anterior (semana ${targetWeekHeader} de ${payload.mes_anterior_label}).
3. Desempenho geral do mês como um todo, focando na comparação direta do desempenho desta semana de foco contra o desempenho médio semanal das métricas do mês atual.

Gere de 3 a 5 insights muito específicos, práticos e acionáveis. Cada insight deve explicar com precisão o que mudou nessas comparações e sugerir uma ação prática corretiva ou de aceleração. Evite generalidades.
`;

  const insights = await runAnalysis(systemPrompt, userPrompt, apiKey);
  return { insights, weekHeader: targetWeekHeader || "S1" };
}
