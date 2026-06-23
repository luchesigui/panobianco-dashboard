import type { KpiPageData } from "@/lib/data/kpis";
import { getServiceSupabase } from "@/lib/supabase/server";
import { PROMPT_MASTER, runAnalysis } from "./base";

export async function generateSalesMarketingWeeklyInsights(
  data: KpiPageData,
  apiKey: string,
  periodId: string
): Promise<Array<{ type: string; title: string; body: string }>> {
  const sm = data.salesMarketingDashboard.payload;
  const prevSm = data.salesMarketingDashboard.comparisonPayload;
  
  if (!sm || !sm.weekly) {
    throw new Error("Dados semanais de vendas e marketing não encontrados para o período.");
  }

  // Detect the last filled week in the current month (June 2026, etc.)
  const weeksCount = sm.weekly.weekHeaders.length;
  let lastFilledWeekIdx = -1;
  for (let i = weeksCount - 1; i >= 0; i--) {
    const hasData =
      sm.weekly.marketing.reach[i] != null ||
      sm.weekly.marketing.followers[i] != null ||
      sm.weekly.funnelWeekly.closings[i] != null ||
      sm.weekly.salesWeekly.totals[i] != null;
    if (hasData) {
      lastFilledWeekIdx = i;
      break;
    }
  }

  const weekHeader = lastFilledWeekIdx !== -1 ? sm.weekly.weekHeaders[lastFilledWeekIdx] : "S1";

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
Foco principal de análise: Semana ${weekHeader} do mês de ${data.salesMarketingDashboard.calendarCurrentMonthLabel}.

Seu objetivo é analisar as flutuações de tráfego pago (Instagram/Meta Ads) semana a semana, a constância do funil semanal (agendadas, comparecimentos e fechamentos) e as oscilações de conversão WoW.

REGRAS COMERCIAIS IMPORTANTES (EVITE CONFUSÃO DE CONCEITOS):
1. "leads" representa o volume de potenciais clientes contatados/recebidos.
2. "vendas" (ou "sales" / "conversões" / "fechamentos") representa a quantidade de planos efetivamente vendidos (contratos fechados).
3. A meta individual comercial das consultoras (que é de 50 vendas/contratos por pessoa) refere-se estritamente à quantidade de **vendas (conversões/fechamentos)**, e NÃO ao número de leads.
4. Para qualquer avaliação de meta individual, compare apenas as vendas ("sales") com a meta de 50 (ou com o "goal" indicado).
`;

  const payload = {
    semana_foco: weekHeader,
    mes_atual_label: data.salesMarketingDashboard.calendarCurrentMonthLabel,
    mes_anterior_label: data.salesMarketingDashboard.comparisonPeriodLabel,
    semanas_mes_atual_dados_brutos: sm.weekly,
    semanas_mes_anterior_dados_brutos: prevSm?.weekly || null,
    dados_brutos_mes_ano_passado: lastYearRawData,
  };

  const userPrompt = `
Aqui estão os dados brutos semanais das campanhas e do funil de vendas em formato JSON:
${JSON.stringify(payload, null, 2)}

Faça uma análise focando principalmente na semana de foco (${weekHeader}) e compare com a mesma semana do mês anterior, com as outras semanas preenchidas deste mês e com os dados do ano passado (se houver). Gere de 3 a 5 insights específicos.
`;

  return runAnalysis(systemPrompt, userPrompt, apiKey);
}
