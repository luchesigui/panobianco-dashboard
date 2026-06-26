import { computeDeltaPct } from "@/lib/kpis/format";
import type { FinanceKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getFinanceKpis({ current, previous, currentMeta }: Input): FinanceKpis {
	const get = (map: Record<string, number>, key: string) =>
		(map[key] as number | undefined) ?? null;
	const m = (key: string) => currentMeta[key] ?? {};

	const revenue = get(current, "revenue_total");
	const revenuePrev = get(previous, "revenue_total");
	const revM = m("revenue_total");

	const expenses = get(current, "expenses_total");
	const expensesPrev = get(previous, "expenses_total");
	const expM = m("expenses_total");

	const opResult = revenue != null && expenses != null ? revenue - expenses : null;
	const opResultPrev =
		revenuePrev != null && expensesPrev != null ? revenuePrev - expensesPrev : null;
	const opM = m("operational_result");
	const marginPercent =
		revenue != null && revenue > 0 && opResult != null
			? Math.round((opResult / revenue) * 1000) / 10
			: null;

	const matRev = get(current, "matriculated_revenue");
	const matRevPrev = get(previous, "matriculated_revenue");
	const matM = m("matriculated_revenue");
	const matPctOfTotal =
		revenue != null && revenue > 0 && matRev != null
			? Math.round((matRev / revenue) * 1000) / 10
			: null;
	const matBreakdown =
		typeof matM.recorrente === "number" &&
		typeof matM.anual === "number" &&
		typeof matM.mensal === "number"
			? { recorrente: matM.recorrente, anual: matM.anual, mensal: matM.mensal }
			: null;

	const wellhub = get(current, "wellhub_revenue");
	const wellhubPrev = get(previous, "wellhub_revenue");
	const whM = m("wellhub_revenue");
	const wellhubPct =
		revenue != null && revenue > 0 && wellhub != null
			? Math.round((wellhub / revenue) * 1000) / 10
			: null;

	const totalpass = get(current, "totalpass_revenue");
	const totalpassPrev = get(previous, "totalpass_revenue");
	const tpM = m("totalpass_revenue");
	const totalpassPct =
		revenue != null && revenue > 0 && totalpass != null
			? Math.round((totalpass / revenue) * 1000) / 10
			: null;

	const invoiceVal = get(current, "invoice_tax_nf");
	const invoiceM = m("invoice_tax_nf");

	const acc100Val = get(current, "operational_result_100pct_nf");
	const acc100M = m("operational_result_100pct_nf");

	const accNoVal = get(current, "accumulated_operational_no_contributions");
	const accNoM = m("accumulated_operational_no_contributions");

	const accWithVal = get(current, "accumulated_with_contributions");
	const accWithM = m("accumulated_with_contributions");

	const royVal = get(current, "royalties_validation");
	const royM = m("royalties_validation");

	return {
		revenueTotal: {
			value: revenue,
			previous: revenuePrev,
			deltaPct: computeDeltaPct(revenue ?? undefined, revenuePrev ?? undefined),
			overrideDeltaPct:
				typeof revM.delta_pct_display === "number" ? revM.delta_pct_display : null,
		},
		expensesTotal: {
			value: expenses,
			previous: expensesPrev,
			deltaPct: computeDeltaPct(expenses ?? undefined, expensesPrev ?? undefined),
			overrideDeltaPct:
				typeof expM.delta_pct_display === "number" ? expM.delta_pct_display : null,
			deltaAbsLine: typeof expM.delta_abs_line === "string" ? expM.delta_abs_line : null,
		},
		operationalResult: {
			value: opResult,
			previous: opResultPrev,
			deltaPct: computeDeltaPct(opResult ?? undefined, opResultPrev ?? undefined),
			overrideDeltaPct:
				typeof opM.delta_pct_display === "number" ? opM.delta_pct_display : null,
			marginPercent,
		},
		invoiceTaxNf: {
			value: invoiceVal,
			pctRevenueLine:
				typeof invoiceM.pct_revenue_line === "string" ? invoiceM.pct_revenue_line : null,
			refLine: typeof invoiceM.ref_line === "string" ? invoiceM.ref_line : null,
			footnote: typeof invoiceM.footnote === "string" ? invoiceM.footnote : null,
			isApproximate:
				invoiceM.approximate_main === true ||
				(invoiceVal != null && Math.abs(invoiceVal) < 500),
		},
		operationalResult100PctNf: {
			value: acc100Val,
			marginLine: typeof acc100M.margin_line === "string" ? acc100M.margin_line : null,
			taxTheoryLine:
				typeof acc100M.tax_theory_line === "string" ? acc100M.tax_theory_line : null,
		},
		accumulatedNoContributions: {
			value: accNoVal,
			subline: typeof accNoM.subline === "string" ? accNoM.subline : null,
			deltaPill:
				typeof accNoM.delta_vs_prev_pill === "string" ? accNoM.delta_vs_prev_pill : null,
			footnote: typeof accNoM.footnote === "string" ? accNoM.footnote : null,
		},
		accumulatedWithContributions: {
			value: accWithVal,
			subline: typeof accWithM.subline === "string" ? accWithM.subline : null,
			deltaPill:
				typeof accWithM.delta_vs_prev_pill === "string" ? accWithM.delta_vs_prev_pill : null,
			aportesLine: typeof accWithM.aportes_line === "string" ? accWithM.aportes_line : null,
			isCompact: accWithM.compact_currency === true,
		},
		matriculatedRevenue: {
			value: matRev,
			previous: matRevPrev,
			deltaPct: computeDeltaPct(matRev ?? undefined, matRevPrev ?? undefined),
			overrideDeltaPct:
				typeof matM.delta_pct_display === "number" ? matM.delta_pct_display : null,
			pctOfTotal: matPctOfTotal,
			breakdown: matBreakdown,
		},
		wellhubRevenue: {
			value: wellhub,
			previous: wellhubPrev,
			deltaPct: computeDeltaPct(wellhub ?? undefined, wellhubPrev ?? undefined),
			overrideDeltaPct:
				typeof whM.delta_pct_display === "number" ? whM.delta_pct_display : null,
			pctOfTotal: wellhubPct,
		},
		totalpassRevenue: {
			value: totalpass,
			previous: totalpassPrev,
			deltaPct: computeDeltaPct(totalpass ?? undefined, totalpassPrev ?? undefined),
			overrideDeltaPct:
				typeof tpM.delta_pct_display === "number" ? tpM.delta_pct_display : null,
			pctOfTotal: totalpassPct,
		},
		royaltiesValidation: {
			value: royVal,
			pctLine: typeof royM.pct_line === "string" ? royM.pct_line : null,
			shortfallPill: typeof royM.shortfall_pill === "string" ? royM.shortfall_pill : null,
		},
	};
}
