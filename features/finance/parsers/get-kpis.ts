import { computeDeltaPct } from "@/lib/kpis/format";
import type { FinanceKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getFinanceKpis({ current, previous, currentMeta }: Input): FinanceKpis {
	const getValue = (map: Record<string, number>, key: string) =>
		(map[key] as number | undefined) ?? null;
	const getMeta = (key: string) => currentMeta[key] ?? {};

	const revenueTotalValue = getValue(current, "revenue_total");
	const revenueTotalPreviousValue = getValue(previous, "revenue_total");
	const revenueTotalMeta = getMeta("revenue_total");

	const expensesTotalValue = getValue(current, "expenses_total");
	const expensesTotalPreviousValue = getValue(previous, "expenses_total");
	const expensesTotalMeta = getMeta("expenses_total");

	const operationalResultValue =
		revenueTotalValue != null && expensesTotalValue != null
			? revenueTotalValue - expensesTotalValue
			: null;
	const operationalResultPreviousValue =
		revenueTotalPreviousValue != null && expensesTotalPreviousValue != null
			? revenueTotalPreviousValue - expensesTotalPreviousValue
			: null;
	const operationalResultMeta = getMeta("operational_result");
	const operationalResultMarginPercent =
		revenueTotalValue != null && revenueTotalValue > 0 && operationalResultValue != null
			? Math.round((operationalResultValue / revenueTotalValue) * 1000) / 10
			: null;

	const matriculatedRevenueValue = getValue(current, "matriculated_revenue");
	const matriculatedRevenuePreviousValue = getValue(previous, "matriculated_revenue");
	const matriculatedRevenueMeta = getMeta("matriculated_revenue");
	const matriculatedRevenuePctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && matriculatedRevenueValue != null
			? Math.round((matriculatedRevenueValue / revenueTotalValue) * 1000) / 10
			: null;
	const matriculatedRevenueBreakdown =
		typeof matriculatedRevenueMeta.recorrente === "number" &&
		typeof matriculatedRevenueMeta.anual === "number" &&
		typeof matriculatedRevenueMeta.mensal === "number"
			? {
					recorrente: matriculatedRevenueMeta.recorrente,
					anual: matriculatedRevenueMeta.anual,
					mensal: matriculatedRevenueMeta.mensal,
				}
			: null;

	const wellhubRevenueValue = getValue(current, "wellhub_revenue");
	const wellhubRevenuePreviousValue = getValue(previous, "wellhub_revenue");
	const wellhubRevenueMeta = getMeta("wellhub_revenue");
	const wellhubRevenuePctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && wellhubRevenueValue != null
			? Math.round((wellhubRevenueValue / revenueTotalValue) * 1000) / 10
			: null;

	const totalpassRevenueValue = getValue(current, "totalpass_revenue");
	const totalpassRevenuePreviousValue = getValue(previous, "totalpass_revenue");
	const totalpassRevenueMeta = getMeta("totalpass_revenue");
	const totalpassRevenuePctOfTotal =
		revenueTotalValue != null && revenueTotalValue > 0 && totalpassRevenueValue != null
			? Math.round((totalpassRevenueValue / revenueTotalValue) * 1000) / 10
			: null;

	const invoiceTaxNfValue = getValue(current, "invoice_tax_nf");
	const invoiceTaxNfMeta = getMeta("invoice_tax_nf");

	const operationalResult100PctNfValue = getValue(current, "operational_result_100pct_nf");
	const operationalResult100PctNfMeta = getMeta("operational_result_100pct_nf");

	const accumulatedNoContributionsValue = getValue(
		current,
		"accumulated_operational_no_contributions",
	);
	const accumulatedNoContributionsMeta = getMeta("accumulated_operational_no_contributions");

	const accumulatedWithContributionsValue = getValue(current, "accumulated_with_contributions");
	const accumulatedWithContributionsMeta = getMeta("accumulated_with_contributions");

	const royaltiesValidationValue = getValue(current, "royalties_validation");
	const royaltiesValidationMeta = getMeta("royalties_validation");

	return {
		revenueTotal: {
			value: revenueTotalValue,
			previous: revenueTotalPreviousValue,
			deltaPct: computeDeltaPct(revenueTotalValue ?? undefined, revenueTotalPreviousValue ?? undefined),
			overrideDeltaPct:
				typeof revenueTotalMeta.delta_pct_display === "number"
					? revenueTotalMeta.delta_pct_display
					: null,
		},
		expensesTotal: {
			value: expensesTotalValue,
			previous: expensesTotalPreviousValue,
			deltaPct: computeDeltaPct(expensesTotalValue ?? undefined, expensesTotalPreviousValue ?? undefined),
			overrideDeltaPct:
				typeof expensesTotalMeta.delta_pct_display === "number"
					? expensesTotalMeta.delta_pct_display
					: null,
			deltaAbsLine:
				typeof expensesTotalMeta.delta_abs_line === "string"
					? expensesTotalMeta.delta_abs_line
					: null,
		},
		operationalResult: {
			value: operationalResultValue,
			previous: operationalResultPreviousValue,
			deltaPct: computeDeltaPct(operationalResultValue ?? undefined, operationalResultPreviousValue ?? undefined),
			overrideDeltaPct:
				typeof operationalResultMeta.delta_pct_display === "number"
					? operationalResultMeta.delta_pct_display
					: null,
			marginPercent: operationalResultMarginPercent,
		},
		invoiceTaxNf: {
			value: invoiceTaxNfValue,
			pctRevenueLine:
				typeof invoiceTaxNfMeta.pct_revenue_line === "string"
					? invoiceTaxNfMeta.pct_revenue_line
					: null,
			refLine: typeof invoiceTaxNfMeta.ref_line === "string" ? invoiceTaxNfMeta.ref_line : null,
			footnote:
				typeof invoiceTaxNfMeta.footnote === "string" ? invoiceTaxNfMeta.footnote : null,
			isApproximate:
				invoiceTaxNfMeta.approximate_main === true ||
				(invoiceTaxNfValue != null && Math.abs(invoiceTaxNfValue) < 500),
		},
		operationalResult100PctNf: {
			value: operationalResult100PctNfValue,
			marginLine:
				typeof operationalResult100PctNfMeta.margin_line === "string"
					? operationalResult100PctNfMeta.margin_line
					: null,
			taxTheoryLine:
				typeof operationalResult100PctNfMeta.tax_theory_line === "string"
					? operationalResult100PctNfMeta.tax_theory_line
					: null,
		},
		accumulatedNoContributions: {
			value: accumulatedNoContributionsValue,
			subline:
				typeof accumulatedNoContributionsMeta.subline === "string"
					? accumulatedNoContributionsMeta.subline
					: null,
			deltaPill:
				typeof accumulatedNoContributionsMeta.delta_vs_prev_pill === "string"
					? accumulatedNoContributionsMeta.delta_vs_prev_pill
					: null,
			footnote:
				typeof accumulatedNoContributionsMeta.footnote === "string"
					? accumulatedNoContributionsMeta.footnote
					: null,
		},
		accumulatedWithContributions: {
			value: accumulatedWithContributionsValue,
			subline:
				typeof accumulatedWithContributionsMeta.subline === "string"
					? accumulatedWithContributionsMeta.subline
					: null,
			deltaPill:
				typeof accumulatedWithContributionsMeta.delta_vs_prev_pill === "string"
					? accumulatedWithContributionsMeta.delta_vs_prev_pill
					: null,
			aportesLine:
				typeof accumulatedWithContributionsMeta.aportes_line === "string"
					? accumulatedWithContributionsMeta.aportes_line
					: null,
			isCompact: accumulatedWithContributionsMeta.compact_currency === true,
		},
		matriculatedRevenue: {
			value: matriculatedRevenueValue,
			previous: matriculatedRevenuePreviousValue,
			deltaPct: computeDeltaPct(matriculatedRevenueValue ?? undefined, matriculatedRevenuePreviousValue ?? undefined),
			overrideDeltaPct:
				typeof matriculatedRevenueMeta.delta_pct_display === "number"
					? matriculatedRevenueMeta.delta_pct_display
					: null,
			pctOfTotal: matriculatedRevenuePctOfTotal,
			breakdown: matriculatedRevenueBreakdown,
		},
		wellhubRevenue: {
			value: wellhubRevenueValue,
			previous: wellhubRevenuePreviousValue,
			deltaPct: computeDeltaPct(wellhubRevenueValue ?? undefined, wellhubRevenuePreviousValue ?? undefined),
			overrideDeltaPct:
				typeof wellhubRevenueMeta.delta_pct_display === "number"
					? wellhubRevenueMeta.delta_pct_display
					: null,
			pctOfTotal: wellhubRevenuePctOfTotal,
		},
		totalpassRevenue: {
			value: totalpassRevenueValue,
			previous: totalpassRevenuePreviousValue,
			deltaPct: computeDeltaPct(totalpassRevenueValue ?? undefined, totalpassRevenuePreviousValue ?? undefined),
			overrideDeltaPct:
				typeof totalpassRevenueMeta.delta_pct_display === "number"
					? totalpassRevenueMeta.delta_pct_display
					: null,
			pctOfTotal: totalpassRevenuePctOfTotal,
		},
		royaltiesValidation: {
			value: royaltiesValidationValue,
			pctLine:
				typeof royaltiesValidationMeta.pct_line === "string"
					? royaltiesValidationMeta.pct_line
					: null,
			shortfallPill:
				typeof royaltiesValidationMeta.shortfall_pill === "string"
					? royaltiesValidationMeta.shortfall_pill
					: null,
		},
	};
}
