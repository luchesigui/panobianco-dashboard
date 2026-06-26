import type { FinanceChartPayload } from "@/lib/data/kpis";

export type FinanceKpiCard = {
	value: number | null;
	previous: number | null;
	deltaPct: number | null;
	overrideDeltaPct: number | null;
};

export type FinanceKpis = {
	revenueTotal: FinanceKpiCard;
	expensesTotal: FinanceKpiCard & { deltaAbsLine: string | null };
	operationalResult: FinanceKpiCard & { marginPercent: number | null };
	invoiceTaxNf: {
		value: number | null;
		pctRevenueLine: string | null;
		refLine: string | null;
		footnote: string | null;
		isApproximate: boolean;
	};
	operationalResult100PctNf: {
		value: number | null;
		marginLine: string | null;
		taxTheoryLine: string | null;
	};
	accumulatedNoContributions: {
		value: number | null;
		subline: string | null;
		deltaPill: string | null;
		footnote: string | null;
	};
	accumulatedWithContributions: {
		value: number | null;
		subline: string | null;
		deltaPill: string | null;
		aportesLine: string | null;
		isCompact: boolean;
	};
	matriculatedRevenue: FinanceKpiCard & {
		pctOfTotal: number | null;
		breakdown: { recorrente: number; anual: number; mensal: number } | null;
	};
	wellhubRevenue: FinanceKpiCard & { pctOfTotal: number | null };
	totalpassRevenue: FinanceKpiCard & { pctOfTotal: number | null };
	royaltiesValidation: {
		value: number | null;
		pctLine: string | null;
		shortfallPill: string | null;
	};
};

export type FinanceInsight = {
	type: string;
	title: string;
	body: string;
};

export type FinanceData = {
	kpis: FinanceKpis;
	charts: FinanceChartPayload;
	periodId: string;
	periodLabel: string;
	previousPeriodLabel?: string;
};
