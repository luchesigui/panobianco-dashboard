import type {
	SalesMarketingDashboardPayload,
	MonthlySalesBar,
} from "@/lib/data/sales-marketing-dashboard";

export type SmKpiCard = {
	value: number | null;
	previous: number | null;
	deltaPct: number | null;
	overrideDeltaPct: number | null;
};

export type SalesMarketingMonthlyKpis = {
	salesTotal: SmKpiCard & { goal: number | null; goalPct: number | null };
	noShowRate: SmKpiCard & { detailLine: string | null };
	presentConversionRate: SmKpiCard & { detailLine: string | null };
	leadsGenerated: SmKpiCard;
	avgTicket: SmKpiCard & { metaLine: string | null; breakdownLine: string | null };
	cacPerSale: SmKpiCard & { detailLine: string | null };
	metaAdsInvestment: SmKpiCard & { detailLine: string | null };
	instagramTotalReach: SmKpiCard & { detailLine: string | null };
};

export type SmDashboard = {
	payload: SalesMarketingDashboardPayload | null;
	primaryPayload: SalesMarketingDashboardPayload | null;
	comparisonPayload: SalesMarketingDashboardPayload | null;
	monthlySalesChart: MonthlySalesBar[];
	salesTarget: number;
	primaryPeriodLabel: string;
	comparisonPeriodLabel: string | null;
	weekSourcePeriod: string[];
	calendarCurrentMonthLabel: string;
};

export type SalesMarketingInsight = {
	type: string;
	title: string;
	body: string;
};

export type SalesMarketingData = {
	monthlyKpis: SalesMarketingMonthlyKpis;
	dashboard: SmDashboard;
	periodId: string;
	weeklyPeriodId: string;
	periodLabel: string;
	previousPeriodLabel?: string;
	leadsGenerated: number | null;
	salesTotal: number | null;
	monthlyMarketing: {
		reach: number | null;
		frequency: number | null;
		views: number | null;
		followers: number | null;
	};
};
