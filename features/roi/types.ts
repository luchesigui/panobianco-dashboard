import type { RoiChartPayload } from "@/lib/data/kpis";

export type RoiKpis = {
	totalInvested: {
		value: number | null;
		title: string;
		subline: string | null;
		detailLine: string | null;
	};
	cashBalance: {
		value: number | null;
		title: string;
		subline: string | null;
		pctPill: string | null;
	};
	recoveryBalance: {
		value: number | null;
		title: string;
		subline: string | null;
	};
	paybackMonths: {
		value: number | null;
		subline: string | null;
		detailLine: string | null;
	};
};

export type RoiInsight = {
	type: string;
	title: string;
	body: string;
};

export type RoiData = {
	kpis: RoiKpis;
	charts: RoiChartPayload;
	periodId: string;
	periodLabel: string;
};
