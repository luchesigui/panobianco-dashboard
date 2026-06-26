export type OverviewKpis = {
	baseStudents: {
		value: number | null;
		previous: number | null;
		deltaPct: number | null;
		goal: number | null;
		isPartial: boolean;
	};
	salesTotal: {
		value: number | null;
		previous: number | null;
		deltaPct: number | null;
		goal: number | null;
	};
	revenueTotal: {
		value: number | null;
		previous: number | null;
		deltaPct: number | null;
	};
	operationalResult: {
		value: number | null;
		previous: number | null;
		deltaPct: number | null;
		marginPercent: number | null;
		isRecord: boolean;
	};
};

export type OverviewInsight = {
	type: string;
	title: string;
	body: string;
};

export type OverviewData = {
	kpis: OverviewKpis;
	periodId: string;
	periodLabel: string;
	previousPeriodLabel?: string;
};
