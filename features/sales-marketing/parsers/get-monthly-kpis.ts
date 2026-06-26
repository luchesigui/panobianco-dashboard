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
	const previousValue = (previous[key] as number | undefined) ?? null;
	return {
		value,
		previous: previousValue,
		deltaPct: computeDeltaPct(value ?? undefined, previousValue ?? undefined),
		overrideDeltaPct: null,
	};
}

export function getSalesMarketingMonthlyKpis({
	current,
	previous,
	currentMeta,
}: Input): SalesMarketingMonthlyKpis {
	const salesTotalMeta = currentMeta["sales_total"] ?? {};
	const noShowRateMeta = currentMeta["no_show_rate"] ?? {};
	const presentConversionRateMeta = currentMeta["present_conversion_rate"] ?? {};
	const avgTicketMeta = currentMeta["avg_ticket"] ?? {};
	const cacPerSaleMeta = currentMeta["cac_per_sale"] ?? {};
	const metaAdsInvestmentMeta = currentMeta["meta_ads_investment"] ?? {};
	const instagramTotalReachMeta = currentMeta["instagram_total_reach"] ?? {};

	const salesTotalValue = (current["sales_total"] as number | undefined) ?? null;
	const salesTotalPreviousValue = (previous["sales_total"] as number | undefined) ?? null;

	return {
		salesTotal: {
			value: salesTotalValue,
			previous: salesTotalPreviousValue,
			deltaPct: computeDeltaPct(salesTotalValue ?? undefined, salesTotalPreviousValue ?? undefined),
			overrideDeltaPct:
				typeof salesTotalMeta.delta_pct_display === "number"
					? salesTotalMeta.delta_pct_display
					: null,
			goal: typeof salesTotalMeta.goal === "number" ? salesTotalMeta.goal : null,
			goalPct: typeof salesTotalMeta.goal_pct === "number" ? salesTotalMeta.goal_pct : null,
		},
		noShowRate: {
			...baseCard(current, previous, "no_show_rate"),
			overrideDeltaPct:
				typeof noShowRateMeta.delta_pct_display === "number"
					? noShowRateMeta.delta_pct_display
					: null,
			detailLine:
				typeof noShowRateMeta.detail_line === "string" ? noShowRateMeta.detail_line : null,
		},
		presentConversionRate: {
			...baseCard(current, previous, "present_conversion_rate"),
			overrideDeltaPct:
				typeof presentConversionRateMeta.delta_pct_display === "number"
					? presentConversionRateMeta.delta_pct_display
					: null,
			detailLine:
				typeof presentConversionRateMeta.detail_line === "string"
					? presentConversionRateMeta.detail_line
					: null,
		},
		leadsGenerated: baseCard(current, previous, "leads_generated"),
		avgTicket: {
			...baseCard(current, previous, "avg_ticket"),
			metaLine: typeof avgTicketMeta.meta_line === "string" ? avgTicketMeta.meta_line : null,
			breakdownLine:
				typeof avgTicketMeta.breakdown_line === "string" ? avgTicketMeta.breakdown_line : null,
		},
		cacPerSale: {
			...baseCard(current, previous, "cac_per_sale"),
			overrideDeltaPct:
				typeof cacPerSaleMeta.delta_pct_display === "number"
					? cacPerSaleMeta.delta_pct_display
					: null,
			detailLine:
				typeof cacPerSaleMeta.detail_line === "string" ? cacPerSaleMeta.detail_line : null,
		},
		metaAdsInvestment: {
			...baseCard(current, previous, "meta_ads_investment"),
			overrideDeltaPct:
				typeof metaAdsInvestmentMeta.delta_pct_display === "number"
					? metaAdsInvestmentMeta.delta_pct_display
					: null,
			detailLine:
				typeof metaAdsInvestmentMeta.detail_line === "string"
					? metaAdsInvestmentMeta.detail_line
					: null,
		},
		instagramTotalReach: {
			...baseCard(current, previous, "instagram_total_reach"),
			detailLine:
				typeof instagramTotalReachMeta.detail_line === "string"
					? instagramTotalReachMeta.detail_line
					: null,
		},
	};
}
