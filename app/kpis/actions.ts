"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getKpiPageData } from "@/lib/data/kpis";
import { generateOverviewInsights } from "@/lib/ai/services/overview";
import { generateSalesMarketingMonthlyInsights } from "@/lib/ai/services/salesMarketingMonthly";
import { generateSalesMarketingWeeklyInsights } from "@/lib/ai/services/salesMarketingWeekly";
import { generateRetentionInsights } from "@/lib/ai/services/retention";
import { generateFinanceInsights } from "@/lib/ai/services/finance";

const GYM_SLUG = "panobianco-sjc-satelite";

function mapType(t: string): string {
  const type = (t || "").toLowerCase().trim();
  if (type === "positive" || type === "good" || type === "success") return "good";
  if (type === "negative" || type === "bad" || type === "danger") return "bad";
  if (type === "warning" || type === "warn") return "warn";
  if (type === "neutral") return "neutral";
  return "info";
}

export async function generateAiInsightsAction(
  periodId: string,
  category: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getServiceSupabase();

    // 1. Fetch gym details
    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("id")
      .eq("slug", GYM_SLUG)
      .single();

    if (gymError || !gym) {
      return { ok: false, error: "Academia não encontrada no banco de dados." };
    }
    const gymId = gym.id;

    // 2. Fetch configured API Key from settings
    const { data: keyRow } = await supabase
      .from("gym_settings")
      .select("value")
      .eq("gym_id", gymId)
      .eq("key", "claudeApiKey")
      .maybeSingle();

    const apiKey =
      keyRow?.value ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        ok: false,
        error: "Chave da API da IA não configurada. Por favor, insira a Claude API Key na página de Configurações.",
      };
    }

    // 3. Load consolidated dashboard data
    const data = await getKpiPageData(GYM_SLUG);

    // 4. Dispatch to the specific analysis service
    let insights: Array<{ type: string; title: string; body: string }> = [];

    if (category === "overview") {
      insights = await generateOverviewInsights(data, apiKey);
    } else if (category === "sales_marketing") {
      insights = await generateSalesMarketingMonthlyInsights(data, apiKey);
    } else if (category === "sales_marketing_weekly") {
      insights = await generateSalesMarketingWeeklyInsights(data, apiKey, periodId);
    } else if (category === "retention") {
      insights = await generateRetentionInsights(data, apiKey);
    } else if (category === "finance") {
      insights = await generateFinanceInsights(data, apiKey);
    } else {
      return { ok: false, error: "Categoria de insights não suportada." };
    }

    // 5. Save generated insights into Supabase
    // Clear old insights under this scope/category/period
    const { error: deleteError } = await supabase
      .from("kpi_insights")
      .delete()
      .eq("gym_id", gymId)
      .eq("period_id", periodId)
      .eq("category", category)
      .eq("insight_scope", "kpi");

    if (deleteError) {
      console.error("Erro ao deletar insights antigos:", deleteError);
      return { ok: false, error: `Erro ao limpar insights antigos: ${deleteError.message}` };
    }

    // Insert new insights
    const newRows = insights.map((insight, idx) => ({
      gym_id: gymId,
      period_id: periodId,
      category: category,
      insight_scope: "kpi",
      insight_type: mapType(insight.type),
      title: (insight.title || "").trim(),
      body: (insight.body || "").trim(),
      sort_order: idx + 1,
      meta_json: {},
    }));

    if (newRows.length > 0) {
      const { error: insertError } = await supabase.from("kpi_insights").insert(newRows);
      if (insertError) {
        console.error("Erro ao salvar novos insights:", insertError);
        return { ok: false, error: `Erro ao salvar novos insights: ${insertError.message}` };
      }
    }

    // 6. Trigger page revalidation to update the view
    revalidatePath("/kpis");
    return { ok: true };
  } catch (err) {
    console.error("Falha geral ao gerar insights:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido na geração de insights.",
    };
  }
}
