"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";
import { decomposePayloadToRows } from "@/lib/data/vendas-marketing-assembler";

const saveSmSchema = z.object({
	gymSlug: z.string().min(1),
	periodId: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	payload: z.custom<SalesMarketingDashboardPayload>(
		(v) => v != null && typeof v === "object",
	),
});

export type SaveSmPayloadResult = { ok: true } | { ok: false; error: string };

export async function saveSmDashboardAction(
	raw: z.infer<typeof saveSmSchema>,
): Promise<SaveSmPayloadResult> {
	try {
		const input = saveSmSchema.parse(raw);

		const payload = input.payload as SalesMarketingDashboardPayload;
		if (!payload.weekly?.weekHeaders?.length) {
			return { ok: false, error: "payload.weekly.weekHeaders é obrigatório." };
		}

		recomputeWeeklyTotals(payload.weekly);

		const supabase = getServiceSupabase();
		const { data: gym, error: gymError } = await supabase
			.from("gyms")
			.select("id")
			.eq("slug", input.gymSlug)
			.single();
		if (gymError || !gym)
			return { ok: false, error: "Academia não encontrada." };

		const rows = decomposePayloadToRows(payload);

		const { error: funnelError } = await supabase.from("funil_mensal").upsert(
			{
				gym_id: gym.id,
				period_id: input.periodId,
				...rows.funilMensal,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "gym_id,period_id" },
		);
		if (funnelError) return { ok: false, error: funnelError.message };

		const weeklyTables = [
			{ table: "marketing_semanal", data: rows.marketingSemanal },
			{ table: "funil_semanal", data: rows.funilSemanal },
			{ table: "conversoes_semanais", data: rows.conversoesSemanal },
		] as const;

		for (const { table, data } of weeklyTables) {
			let onlineMap = new Map<number, number>();
			if (table === "conversoes_semanais") {
				const { data: existing } = await supabase
					.from("conversoes_semanais")
					.select("week_num, sales_online")
					.eq("gym_id", gym.id)
					.eq("period_id", input.periodId);
				if (existing) {
					for (const row of existing) {
						onlineMap.set(row.week_num, row.sales_online ?? 0);
					}
				}
			}

			await supabase
				.from(table)
				.delete()
				.eq("gym_id", gym.id)
				.eq("period_id", input.periodId);
			if (data.length > 0) {
				const { error } = await supabase.from(table).insert(
					data.map((row) => {
						const extra =
							table === "conversoes_semanais"
								? { sales_online: onlineMap.get(row.week_num) ?? 0 }
								: {};
						return { gym_id: gym.id, period_id: input.periodId, ...row, ...extra };
					}),
				);
				if (error) return { ok: false, error: error.message };
			}
		}

		if (rows.recepcaoSemanal.length > 0) {
			await supabase
				.from("recepcao_semanal")
				.delete()
				.eq("gym_id", gym.id)
				.eq("period_id", input.periodId);
			const { data: consultoras } = await supabase
				.from("consultoras")
				.select("id,name")
				.eq("gym_id", gym.id)
				.is("deleted_at", null);
			const consultoraIdByName = new Map(
				(consultoras ?? []).map((consultora) => [consultora.name, consultora.id]),
			);
			const { error } = await supabase.from("recepcao_semanal").insert(
				rows.recepcaoSemanal.map((row) => ({
					gym_id: gym.id,
					period_id: input.periodId,
					week_num: row.week_num,
					receptionist_name: row.receptionist_name,
					consultora_id: consultoraIdByName.get(row.receptionist_name) ?? null,
					leads: row.leads,
					sales: row.sales,
				})),
			);
			if (error) return { ok: false, error: error.message };
		}

		revalidatePath("/kpis");
		revalidatePath("/kpis/entrada-dados");
		return { ok: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erro ao salvar.";
		return { ok: false, error: message };
	}
}
