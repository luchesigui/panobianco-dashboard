"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { ALL_KPI_CODES_FOR_MONTH } from "@/lib/data/dashboard-input-requirements";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";

const periodSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const saveMonthSchema = z.object({
  gymSlug: z.string().min(1),
  periodId: periodSchema,
  values: z.record(z.string(), z.number().finite()),
  metaByCode: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

export type SaveMonthlyKpisResult = { ok: true } | { ok: false; error: string };

export async function saveMonthlyKpisAction(raw: z.infer<typeof saveMonthSchema>): Promise<SaveMonthlyKpisResult> {
  try {
    const input = saveMonthSchema.parse(raw);

    const supabase = getServiceSupabase();
    const { data: gym, error: gErr } = await supabase
      .from("gyms")
      .select("id")
      .eq("slug", input.gymSlug)
      .single();
    if (gErr || !gym) return { ok: false, error: "Academia não encontrada." };

    const { data: defs, error: dErr } = await supabase.from("kpi_definitions").select("id,code");
    if (dErr || !defs?.length) return { ok: false, error: "Definições de KPI não encontradas." };

    const idByCode = new Map(defs.map((d) => [d.code, d.id]));
    const meta = input.metaByCode ?? {};
    const rows: Array<{
      gym_id: string;
      period_id: string;
      kpi_definition_id: string;
      value_numeric: number;
      meta_json: Record<string, unknown>;
    }> = [];

    for (const code of ALL_KPI_CODES_FOR_MONTH) {
      const v = input.values[code];
      if (v === undefined) continue;
      const defId = idByCode.get(code);
      if (!defId) continue;
      rows.push({
        gym_id: gym.id,
        period_id: input.periodId,
        kpi_definition_id: defId,
        value_numeric: v,
        meta_json: meta[code] ?? {},
      });
    }

    if (rows.length === 0) {
      return { ok: false, error: "Nenhum valor numérico para gravar." };
    }

    const { error: uErr } = await supabase.from("kpi_values").upsert(rows, {
      onConflict: "gym_id,period_id,kpi_definition_id",
    });
    if (uErr) return { ok: false, error: uErr.message };

    revalidatePath("/kpis");
    revalidatePath("/kpis/entrada-dados");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar.";
    return { ok: false, error: msg };
  }
}

const saveSmSchema = z.object({
  gymSlug: z.string().min(1),
  periodId: periodSchema,
  payload: z.custom<SalesMarketingDashboardPayload>((v) => v != null && typeof v === "object"),
});

export type SaveSmPayloadResult = { ok: true } | { ok: false; error: string };

export async function saveSmDashboardAction(raw: z.infer<typeof saveSmSchema>): Promise<SaveSmPayloadResult> {
  try {
    const input = saveSmSchema.parse(raw);

    const p = input.payload as SalesMarketingDashboardPayload;
    if (!p.weekly?.weekHeaders?.length) {
      return { ok: false, error: "payload.weekly.weekHeaders é obrigatório." };
    }

    recomputeWeeklyTotals(p.weekly);

    const supabase = getServiceSupabase();
    const { data: gym, error: gErr } = await supabase
      .from("gyms")
      .select("id")
      .eq("slug", input.gymSlug)
      .single();
    if (gErr || !gym) return { ok: false, error: "Academia não encontrada." };

    const { error: uErr } = await supabase.from("sales_marketing_dashboard_payload").upsert(
      {
        gym_id: gym.id,
        period_id: input.periodId,
        payload: p as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "gym_id,period_id" },
    );
    if (uErr) return { ok: false, error: uErr.message };

    revalidatePath("/kpis");
    revalidatePath("/kpis/entrada-dados");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar.";
    return { ok: false, error: msg };
  }
}
