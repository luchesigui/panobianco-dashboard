import { getGym } from "@/lib/data/gym";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { ForecastInsight } from "../types";

export async function getForecastInsights(periodId: string): Promise<ForecastInsight[]> {
	const [supabase, gym] = await Promise.all([
		Promise.resolve(getServiceSupabase()),
		getGym(),
	]);
	const { data } = await supabase
		.from("kpi_insights")
		.select("insight_type,title,body,sort_order")
		.eq("gym_id", gym.id)
		.eq("period_id", periodId)
		.eq("category", "forecast")
		.eq("insight_scope", "kpi")
		.order("sort_order", { ascending: true });

	return (data ?? []).map((row) => ({
		type: row.insight_type ?? "info",
		title: row.title ?? "",
		body: row.body ?? "",
	}));
}
