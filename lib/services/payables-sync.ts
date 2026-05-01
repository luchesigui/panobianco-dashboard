import { CRMService } from "./crm-service";
import { slugifyExpenseCode, titleFromExpenseCode } from "@/lib/data/expense-mapping";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 50;
const PAGE_DELAY_MS = 300;
const BASE_RETRY_MS = 2_000;
const MAX_RETRY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const INCLUDED_STATUSES = new Set([1, 2]);

export async function runPayablesSyncJob(jobId: string): Promise<void> {
	const supabase = getServiceSupabase();

	const { data: job } = await supabase
		.from("crm_payables_sync_jobs")
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
			.from("crm_payables_sync_jobs")
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

	const partialGroups = { ...(job.partial_groups as Record<string, number>) };
	let skipPosition = job.skip_position as number;
	let totalFetched = job.total_fetched as number;
	let retryDelay = BASE_RETRY_MS;

	try {
		while (true) {
			let page: Awaited<ReturnType<typeof crm.getPayablesPage>>;

			try {
				page = await crm.getPayablesPage({
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

			for (const payable of page) {
				if (
					!INCLUDED_STATUSES.has(payable.status.id) ||
					payable.cancellationDate !== null
				) {
					continue;
				}

				const centerName = payable.costCenter?.name ?? "Outros";
				const code = slugifyExpenseCode(centerName);
				const value = payable.ammountPaid || payable.ammount;
				partialGroups[code] = (partialGroups[code] ?? 0) + value;
				totalFetched++;
			}

			skipPosition += page.length;
			const isLast = page.length < PAGE_SIZE;

			await supabase
				.from("crm_payables_sync_jobs")
				.update({
					status: isLast ? "completed" : "running",
					skip_position: skipPosition,
					total_fetched: totalFetched,
					partial_groups: partialGroups,
					updated_at: new Date().toISOString(),
				})
				.eq("id", jobId);

			if (isLast) {
				await saveExpenseKpis(
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
			.from("crm_payables_sync_jobs")
			.update({ status: "failed", error, updated_at: new Date().toISOString() })
			.eq("id", jobId);
	}
}

async function saveExpenseKpis(
	gymId: string,
	dueDateStart: string,
	groups: Record<string, number>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: SupabaseClient<any>,
): Promise<void> {
	const periodId = dueDateStart.slice(0, 7) + "-01";

	const expensesTotal = Object.values(groups).reduce((a, v) => a + v, 0);
	const allGroups = { ...groups, expenses_total: expensesTotal };

	const definitions = Object.entries(allGroups).map(([code]) => ({
		code,
		label: code === "expenses_total" ? "Total de despesas" : titleFromExpenseCode(code),
		unit: "currency_brl",
		category: "finance",
	}));

	await supabase
		.from("kpi_definitions")
		.upsert(definitions, { onConflict: "code" });

	const { data: defs } = await supabase
		.from("kpi_definitions")
		.select("id,code")
		.in("code", Object.keys(allGroups));

	if (!defs?.length) return;

	const idByCode = new Map(defs.map((d) => [d.code as string, d.id as string]));

	const rows = Object.entries(allGroups)
		.map(([code, value]) => {
			const defId = idByCode.get(code);
			if (!defId) return null;
			return {
				gym_id: gymId,
				period_id: periodId,
				kpi_definition_id: defId,
				value_numeric: value,
				meta_json:
					code === "expenses_total" ? { breakdown: groups } : {},
			};
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	if (rows.length > 0) {
		await supabase
			.from("kpi_values")
			.upsert(rows, { onConflict: "gym_id,period_id,kpi_definition_id" });
	}
}
