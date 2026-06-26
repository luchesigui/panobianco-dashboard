import type { RetentionChartPayload } from "@/lib/data/kpis";

export type RetentionKpis = {
	baseStudents: {
		value: number | null;
		isPartial: boolean;
		pendingNote: string | null;
	};
	openDefault: {
		count: number | null;
		value: number | null;
	};
	recoveryRate: {
		pct: number | null;
		recovered: number;
		total: number;
		pill3d: string | null;
	};
	renewals: {
		value: number;
		nonRenewed: number | null;
		renewalRatePct: number | null;
	} | null;
	exits: {
		current: number | null;
		previous: number | null;
		deltaPct: number | null;
	};
};

export type RetentionInsight = {
	type: string;
	title: string;
	body: string;
};

export type RetentionData = {
	kpis: RetentionKpis;
	charts: RetentionChartPayload;
	periodId: string;
	periodLabel: string;
	previousPeriodLabel?: string;
};
