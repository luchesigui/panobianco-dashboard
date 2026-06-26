import type { NextMonthForecastPayload } from "@/lib/data/kpis";

export type ForecastInsight = {
	type: string;
	title: string;
	body: string;
};

export type ForecastData = {
	forecast: NextMonthForecastPayload;
	periodId: string;
	periodLabel: string;
};
