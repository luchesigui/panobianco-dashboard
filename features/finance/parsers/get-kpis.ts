import { computeDeltaPct } from "@/lib/kpis/format";
import type { FinanceKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

const getValue = (map: Record<string, number>, key: string): number | null =>
	(map[key] as number | undefined) ?? null;

const getMeta = (
	meta: Record<string, Record<string, unknown>>,
	key: string,
): Record<string, unknown> => meta[key] ?? {};

function parseRevenueTotalKpi({ current, previous, currentMeta }: Input) {
	const value = getValue(current, "revenue_total");
	const previousValue = getValue(previous, "revenue_total");
	const meta = getMeta(currentMeta, "revenue_total");
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
	};
}

function parseExpensesTotalKpi({ current, previous, currentMeta }: Input) {
	const value = getValue(current, "expenses_total");
	const previousValue = getValue(previous, "expenses_total");
	const meta = getMeta(currentMeta, "expenses_total");
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
		deltaAbsLine: typeof meta.delta_abs_line === "string" ? meta.delta_abs_line : null,
	};
}

function parseOperationalResultKpi(
	{ previous, currentMeta }: Input,
	revenueTotalValue: number | null,
	expensesTotalValue: number | null,
) {
	const revenueTotalPreviousValue = getValue(previous, "revenue_total");
	const expensesTotalPreviousValue = getValue(previous, "expenses_total");
	const meta = getMeta(currentMeta, "operational_result");

	const value =
		revenueTotalValue != null && expensesTotalValue != null
			? revenueTotalValue - expensesTotalValue
			: null;
	const previousValue =
		revenueTotalPreviousValue != null && expensesTotalPreviousValue != null
			? revenueTotalPreviousValue - expensesTotalPreviousValue
			: null;
	const marginPercent =
		revenueTotalValue != null && revenueTotalValue > 0 && value != null
			? Math.round((value / revenueTotalValue) * 1000) / 10
			: null;

	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
		marginPercent,
	};
}

function parseMatriculatedRevenueKpi(
	{ current, previous, currentMeta }: Input,
	revenueTotalValue: number | null,
) {
	const value = getValue(current, "matriculated_revenue");
	const previousValue = getValue(previous, "matriculated_revenue");
	const meta = getMeta(currentMeta, "matriculated_revenue");
	const pctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && value != null
			? Math.round((value / revenueTotalValue) * 1000) / 10
			: null;
	const breakdown =
		typeof meta.recorrente === "number" &&
		typeof meta.anual === "number" &&
		typeof meta.mensal === "number"
			? { recorrente: meta.recorrente, anual: meta.anual, mensal: meta.mensal }
			: null;
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
		pctOfTotal,
		breakdown,
	};
}

function parseWellhubRevenueKpi(
	{ current, previous, currentMeta }: Input,
	revenueTotalValue: number | null,
) {
	const value = getValue(current, "wellhub_revenue");
	const previousValue = getValue(previous, "wellhub_revenue");
	const meta = getMeta(currentMeta, "wellhub_revenue");
	const pctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && value != null
			? Math.round((value / revenueTotalValue) * 1000) / 10
			: null;
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
		pctOfTotal,
	};
}

function parseTotalpassRevenueKpi(
	{ current, previous, currentMeta }: Input,
	revenueTotalValue: number | null,
) {
	const value = getValue(current, "totalpass_revenue");
	const previousValue = getValue(previous, "totalpass_revenue");
	const meta = getMeta(currentMeta, "totalpass_revenue");
	const pctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && value != null
			? Math.round((value / revenueTotalValue) * 1000) / 10
			: null;
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: typeof meta.delta_pct_display === "number" ? meta.delta_pct_display : null,
		pctOfTotal,
	};
}

function parseInvoiceTaxNfKpi({ current, currentMeta }: Input) {
	const value = getValue(current, "invoice_tax_nf");
	const meta = getMeta(currentMeta, "invoice_tax_nf");
	return {
		value,
		pctRevenueLine: typeof meta.pct_revenue_line === "string" ? meta.pct_revenue_line : null,
		refLine: typeof meta.ref_line === "string" ? meta.ref_line : null,
		footnote: typeof meta.footnote === "string" ? meta.footnote : null,
		isApproximate: meta.approximate_main === true || (value != null && Math.abs(value) < 500),
	};
}

function parseOperationalResult100PctNfKpi({ current, currentMeta }: Input) {
	const value = getValue(current, "operational_result_100pct_nf");
	const meta = getMeta(currentMeta, "operational_result_100pct_nf");
	return {
		value,
		marginLine: typeof meta.margin_line === "string" ? meta.margin_line : null,
		taxTheoryLine: typeof meta.tax_theory_line === "string" ? meta.tax_theory_line : null,
	};
}

function parseAccumulatedNoContributionsKpi({ current, currentMeta }: Input) {
	const value = getValue(current, "accumulated_operational_no_contributions");
	const meta = getMeta(currentMeta, "accumulated_operational_no_contributions");
	return {
		value,
		subline: typeof meta.subline === "string" ? meta.subline : null,
		deltaPill: typeof meta.delta_vs_prev_pill === "string" ? meta.delta_vs_prev_pill : null,
		footnote: typeof meta.footnote === "string" ? meta.footnote : null,
	};
}

function parseAccumulatedWithContributionsKpi({ current, currentMeta }: Input) {
	const value = getValue(current, "accumulated_with_contributions");
	const meta = getMeta(currentMeta, "accumulated_with_contributions");
	return {
		value,
		subline: typeof meta.subline === "string" ? meta.subline : null,
		deltaPill: typeof meta.delta_vs_prev_pill === "string" ? meta.delta_vs_prev_pill : null,
		aportesLine: typeof meta.aportes_line === "string" ? meta.aportes_line : null,
		isCompact: meta.compact_currency === true,
	};
}

function parseRoyaltiesValidationKpi({ current, currentMeta }: Input) {
	const value = getValue(current, "royalties_validation");
	const meta = getMeta(currentMeta, "royalties_validation");
	return {
		value,
		pctLine: typeof meta.pct_line === "string" ? meta.pct_line : null,
		shortfallPill: typeof meta.shortfall_pill === "string" ? meta.shortfall_pill : null,
	};
}

export function getFinanceKpis(input: Input): FinanceKpis {
	const revenueTotalValue = getValue(input.current, "revenue_total");
	const expensesTotalValue = getValue(input.current, "expenses_total");

	return {
		revenueTotal: parseRevenueTotalKpi(input),
		expensesTotal: parseExpensesTotalKpi(input),
		operationalResult: parseOperationalResultKpi(input, revenueTotalValue, expensesTotalValue),
		invoiceTaxNf: parseInvoiceTaxNfKpi(input),
		operationalResult100PctNf: parseOperationalResult100PctNfKpi(input),
		accumulatedNoContributions: parseAccumulatedNoContributionsKpi(input),
		accumulatedWithContributions: parseAccumulatedWithContributionsKpi(input),
		matriculatedRevenue: parseMatriculatedRevenueKpi(input, revenueTotalValue),
		wellhubRevenue: parseWellhubRevenueKpi(input, revenueTotalValue),
		totalpassRevenue: parseTotalpassRevenueKpi(input, revenueTotalValue),
		royaltiesValidation: parseRoyaltiesValidationKpi(input),
	};
}
