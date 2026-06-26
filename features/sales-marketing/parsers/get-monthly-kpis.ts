import { computeDeltaPct } from "@/lib/kpis/format";
import type { SalesMarketingMonthlyKpis, SmKpiCard } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

function baseCard(
	current: Record<string, number>,
	previous: Record<string, number>,
	key: string,
): SmKpiCard {
	const value = (current[key] as number | undefined) ?? null;
	const prev = (previous[key] as number | undefined) ?? null;
	return {
		value,
		previous: prev,
		deltaPct: computeDeltaPct(value ?? undefined, prev ?? undefined),
		overrideDeltaPct: null,
	};
}

export function getSalesMarketingMonthlyKpis({
	current,
	previous,
	currentMeta,
}: Input): SalesMarketingMonthlyKpis {
	const salesM = currentMeta["sales_total"] ?? {};
	const noShowM = currentMeta["no_show_rate"] ?? {};
	const presentM = currentMeta["present_conversion_rate"] ?? {};
	const avgTicketM = currentMeta["avg_ticket"] ?? {};
	const cacM = currentMeta["cac_per_sale"] ?? {};
	const metaAdsM = currentMeta["meta_ads_investment"] ?? {};
	const reachM = currentMeta["instagram_total_reach"] ?? {};

	const salesValue = (current["sales_total"] as number | undefined) ?? null;
	const salesPrev = (previous["sales_total"] as number | undefined) ?? null;

	return {
		salesTotal: {
			value: salesValue,
			previous: salesPrev,
			deltaPct: computeDeltaPct(salesValue ?? undefined, salesPrev ?? undefined),
			overrideDeltaPct:
				typeof salesM.delta_pct_display === "number" ? salesM.delta_pct_display : null,
			goal: typeof salesM.goal === "number" ? salesM.goal : null,
			goalPct: typeof salesM.goal_pct === "number" ? salesM.goal_pct : null,
		},
		noShowRate: {
			...baseCard(current, previous, "no_show_rate"),
			overrideDeltaPct:
				typeof noShowM.delta_pct_display === "number" ? noShowM.delta_pct_display : null,
			detailLine: typeof noShowM.detail_line === "string" ? noShowM.detail_line : null,
		},
		presentConversionRate: {
			...baseCard(current, previous, "present_conversion_rate"),
			overrideDeltaPct:
				typeof presentM.delta_pct_display === "number" ? presentM.delta_pct_display : null,
			detailLine: typeof presentM.detail_line === "string" ? presentM.detail_line : null,
		},
		leadsGenerated: baseCard(current, previous, "leads_generated"),
		avgTicket: {
			...baseCard(current, previous, "avg_ticket"),
			metaLine: typeof avgTicketM.meta_line === "string" ? avgTicketM.meta_line : null,
			breakdownLine:
				typeof avgTicketM.breakdown_line === "string" ? avgTicketM.breakdown_line : null,
		},
		cacPerSale: {
			...baseCard(current, previous, "cac_per_sale"),
			overrideDeltaPct:
				typeof cacM.delta_pct_display === "number" ? cacM.delta_pct_display : null,
			detailLine: typeof cacM.detail_line === "string" ? cacM.detail_line : null,
		},
		metaAdsInvestment: {
			...baseCard(current, previous, "meta_ads_investment"),
			overrideDeltaPct:
				typeof metaAdsM.delta_pct_display === "number" ? metaAdsM.delta_pct_display : null,
			detailLine: typeof metaAdsM.detail_line === "string" ? metaAdsM.detail_line : null,
		},
		instagramTotalReach: {
			...baseCard(current, previous, "instagram_total_reach"),
			detailLine: typeof reachM.detail_line === "string" ? reachM.detail_line : null,
		},
	};
}
