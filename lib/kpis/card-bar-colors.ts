/**
 * Semantic KPI edge colors. These identify a metric domain only; positive or
 * negative meaning remains in nearby text and icons, never in color alone.
 */
export const CHART_COLOR = {
	primary: "#FF6100",
	secondary: "#CC3300",
	comparison: "#330000",
	neutral: "#3D3336",
	muted: "#87756B",
	white: "#FFFFFF",
	surface: "#F4EDE4",
} as const;

/**
 * Chart.js cannot consume CSS custom properties reliably from its canvas. Keep
 * every canvas paint in this adapter so dashboard modules do not duplicate
 * palette literals or inherit legacy visual treatments.
 */
export const CHART_PAINT = {
	axisText: CHART_COLOR.neutral,
	grid: "rgba(61, 51, 54, 0.14)",
	gridEmphasis: "rgba(61, 51, 54, 0.32)",
	historicFill: "rgba(61, 51, 54, 0.10)",
	projectionFill: "rgba(255, 97, 0, 0.12)",
	recoveryFill: "rgba(51, 0, 0, 0.08)",
	canvasSurface: CHART_COLOR.white,
} as const;

/** Deliberately distinct operational revenue series, ordered for legends. */
export const REVENUE_SOURCE_COLOR = {
	matriculated: CHART_COLOR.primary,
	wellhub: CHART_COLOR.neutral,
	totalpass: CHART_COLOR.secondary,
	products: CHART_COLOR.comparison,
	uncategorized: CHART_COLOR.muted,
} as const;

export const MONTHLY_SALES_THRESHOLD = {
	belowPace: { minimum: 0, color: CHART_COLOR.comparison, label: "Abaixo de 120 vendas" },
	onPace: { minimum: 120, color: CHART_COLOR.secondary, label: "De 120 a 149 vendas" },
	exceedingPace: { minimum: 150, color: CHART_COLOR.primary, label: "150 vendas ou mais" },
} as const;

export const PROJECTION_KPI_COLOR = {
	revenue: CHART_COLOR.primary,
	expense: CHART_COLOR.neutral,
	result: CHART_COLOR.primary,
	matriculated: CHART_COLOR.primary,
} as const;

export const EXPENSE_DONUT_COLOR = {
	people: CHART_COLOR.comparison,
	infrastructure: CHART_COLOR.secondary,
	marketing: CHART_COLOR.primary,
	other: CHART_COLOR.neutral,
} as const;

export const ROI_COMPOSITION_COLOR = {
	materials: CHART_COLOR.primary,
	services: CHART_COLOR.comparison,
	franchise: CHART_COLOR.secondary,
	other: CHART_COLOR.neutral,
} as const;

export const HISTORY_BAR_COLORS = [
	CHART_COLOR.primary,
	CHART_COLOR.secondary,
	CHART_COLOR.comparison,
	CHART_COLOR.neutral,
] as const;

const PRIMARY = CHART_COLOR.primary;
const SECONDARY = CHART_COLOR.secondary;
const COMPARISON = CHART_COLOR.comparison;
const NEUTRAL = CHART_COLOR.neutral;
const MUTED = CHART_COLOR.muted;

export const KPI_BAR: Record<string, string> = {
	base_students_end: PRIMARY,
	sales_total: PRIMARY,
	revenue_total: PRIMARY,
	operational_result: COMPARISON,
	leads_generated: SECONDARY,
	experimental_scheduled: SECONDARY,
	experimental_attendance: PRIMARY,
	experimental_closings: PRIMARY,
	no_show_rate: COMPARISON,
	present_conversion_rate: PRIMARY,
	open_default_count: COMPARISON,
	open_default_value: COMPARISON,
	recovered_default_count: PRIMARY,
	recovered_default_value: PRIMARY,
	expenses_total: NEUTRAL,
	matriculated_revenue: PRIMARY,
	wellhub_revenue: NEUTRAL,
	totalpass_revenue: MUTED,
	products_revenue: SECONDARY,
	total_invested: NEUTRAL,
	cash_balance: PRIMARY,
	recovery_balance: COMPARISON,
	roi_payback_months: MUTED,
	avg_ticket: SECONDARY,
	cac_per_sale: NEUTRAL,
	meta_ads_investment: NEUTRAL,
	instagram_total_reach: SECONDARY,
	invoice_tax_nf: COMPARISON,
	operational_result_100pct_nf: NEUTRAL,
	accumulated_operational_no_contributions: COMPARISON,
	accumulated_with_contributions: PRIMARY,
	royalties_validation: COMPARISON,
};

export const SALES_VM_BAR: Record<string, string> = {
	sales_total: PRIMARY,
	no_show_rate: COMPARISON,
	present_conversion_rate: PRIMARY,
	leads_generated: SECONDARY,
	avg_ticket: SECONDARY,
	cac_per_sale: NEUTRAL,
	meta_ads_investment: NEUTRAL,
	instagram_total_reach: SECONDARY,
};

export function barColor(key: string): string {
	return KPI_BAR[key] ?? MUTED;
}

export function salesMarketingBarColor(cardKey: string): string {
	return SALES_VM_BAR[cardKey] ?? MUTED;
}
