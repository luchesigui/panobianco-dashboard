import { AccountStatus, CRMService, type ReceivableItem } from "./crm-service";
import { mapRevenueGroupsToCodes } from "@/lib/data/revenue-mapping";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 50;
const PAGE_DELAY_MS = 300;
const BASE_RETRY_MS = 2_000;
const MAX_RETRY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const INCLUDED_STATUSES = new Set<AccountStatus>([
	AccountStatus.Received,
	AccountStatus.Overdue,
]);

export async function runSyncJob(jobId: string): Promise<void> {
	const supabase = getServiceSupabase();

	const { data: job } = await supabase
		.from("crm_sync_jobs")
		.select("*")
		.eq("id", jobId)
		.maybeSingle();

	if (!job || job.status === "completed" || job.status === "failed") return;

	const { data: settingsRows } = await supabase
		.from("gym_settings")
		.select("key,value")
		.eq("gym_id", job.gym_id as string);

	const settingsMap = new Map(
		(settingsRows ?? []).map((r) => [r.key as string, r.value as string]),
	);
	const evoApiToken = settingsMap.get("evoApiToken") ?? "";

	if (!evoApiToken) {
		await supabase
			.from("crm_sync_jobs")
			.update({
				status: "failed",
				error: "Token EVO não configurado.",
				updated_at: new Date().toISOString(),
			})
			.eq("id", jobId);
		return;
	}

	const crm = new CRMService(evoApiToken);
	const dueDateStart = job.due_date_start as string;
	const dueDateEnd = job.due_date_end as string;
	const revenueCenters = job.revenue_centers as Record<string, string>;

	const partialGroups = { ...(job.partial_groups as Record<string, number>) };
	let skipPosition = job.skip_position as number;
	let totalFetched = job.total_fetched as number;
	let retryDelay = BASE_RETRY_MS;

	try {
		while (true) {
			let page: ReceivableItem[];

			try {
				page = await crm.getReceivablesPage({
					dueDateStart,
					dueDateEnd,
					skip: skipPosition,
					take: PAGE_SIZE,
				});
				retryDelay = BASE_RETRY_MS;
			} catch (err) {
				const msg = err instanceof Error ? err.message : "";
				if (msg.includes("429")) {
					await sleep(retryDelay);
					retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
					continue;
				}
				throw err;
			}

			for (const receivable of page) {
				if (
					!INCLUDED_STATUSES.has(receivable.status.id) ||
					receivable.cancellationDate !== null
				) {
					continue;
				}

				if (receivable.idRevenueCenter === null) {
					if (receivable.description.toLowerCase().includes("wellhub")) continue;
					partialGroups["Outros"] =
						(partialGroups["Outros"] ?? 0) + receivable.ammountPaid;
					totalFetched++;
					continue;
				}

				const centerName =
					revenueCenters[String(receivable.idRevenueCenter)] ?? "Outros";
				partialGroups[centerName] =
					(partialGroups[centerName] ?? 0) + receivable.ammountPaid;
				totalFetched++;
			}

			skipPosition += page.length;
			const isLast = page.length < PAGE_SIZE;

			await supabase
				.from("crm_sync_jobs")
				.update({
					status: isLast ? "completed" : "running",
					skip_position: skipPosition,
					total_fetched: totalFetched,
					partial_groups: partialGroups,
					updated_at: new Date().toISOString(),
				})
				.eq("id", jobId);

			if (isLast) {
				await saveRevenueKpis(
					job.gym_id as string,
					dueDateStart,
					partialGroups,
					supabase,
				);
				break;
			}
			await sleep(PAGE_DELAY_MS);
		}
	} catch (err) {
		const error = err instanceof Error ? err.message : "Erro desconhecido";
		await supabase
			.from("crm_sync_jobs")
			.update({ status: "failed", error, updated_at: new Date().toISOString() })
			.eq("id", jobId);
	}
}

async function saveRevenueKpis(
	gymId: string,
	dueDateStart: string,
	groups: Record<string, number>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: SupabaseClient<any>,
): Promise<void> {
	const periodId = dueDateStart.slice(0, 7) + "-01";

	const mapped = mapRevenueGroupsToCodes(groups);
	const revenueTotal = Object.values(mapped).reduce((a, v) => a + v, 0);
	const values: Record<string, number> = {
		...mapped,
		revenue_total: revenueTotal,
	};

	const { data: defs } = await supabase
		.from("kpi_definitions")
		.select("id,code")
		.in("code", Object.keys(values));

	if (!defs?.length) return;

	const idByCode = new Map(defs.map((d) => [d.code as string, d.id as string]));

	const rows = Object.entries(values)
		.map(([code, value]) => {
			const defId = idByCode.get(code);
			if (!defId) return null;
			return {
				gym_id: gymId,
				period_id: periodId,
				kpi_definition_id: defId,
				value_numeric: value,
				meta_json: code === "revenue_total" ? { breakdown: groups } : {},
			};
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	if (rows.length > 0) {
		await supabase
			.from("kpi_values")
			.upsert(rows, { onConflict: "gym_id,period_id,kpi_definition_id" });
	}
}
