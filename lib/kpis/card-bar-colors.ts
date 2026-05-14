/** Bottom accent-bar colors for KPI cards (reference palette). */

export const KPI_BAR: Record<string, string> = {
	base_students_end: "#0f6e56",
	sales_total: "#d85a30",
	revenue_total: "#0f6e56",
	operational_result: "#0f6e56",
	leads_generated: "#185fa5",
	experimental_scheduled: "#534ab7",
	experimental_attendance: "#d85a30",
	experimental_closings: "#0f6e56",
	no_show_rate: "#a32d2d",
	present_conversion_rate: "#0f6e56",
	open_default_count: "#a32d2d",
	open_default_value: "#a32d2d",
	recovered_default_count: "#0f6e56",
	recovered_default_value: "#0f6e56",
	expenses_total: "#854f0b",
	matriculated_revenue: "#378add",
	wellhub_revenue: "#0f6e56",
	totalpass_revenue: "#ef9f27",
	products_revenue: "#d85a30",
	total_invested: "#854f0b",
	cash_balance: "#0f6e56",
	recovery_balance: "#8b4513",
	roi_payback_months: "#378add",
	avg_ticket: "#d85a30",
	cac_per_sale: "#534ab7",
	meta_ads_investment: "#534ab7",
	instagram_total_reach: "#534ab7",
	invoice_tax_nf: "#a32d2d",
	operational_result_100pct_nf: "#8b6914",
	accumulated_operational_no_contributions: "#a32d2d",
	accumulated_with_contributions: "#0f6e56",
	royalties_validation: "#a32d2d",
};

/** Sales & marketing section uses a different blue for sales_total. */
export const SALES_VM_BAR: Record<string, string> = {
	sales_total: "#185fa5",
	no_show_rate: "#a32d2d",
	present_conversion_rate: "#0f6e56",
	leads_generated: "#185fa5",
	avg_ticket: "#d85a30",
	cac_per_sale: "#534ab7",
	meta_ads_investment: "#534ab7",
	instagram_total_reach: "#534ab7",
};

const FALLBACK = "#6b6a65";

export function barColor(key: string): string {
	return KPI_BAR[key] ?? FALLBACK;
}

export function salesMarketingBarColor(cardKey: string): string {
	return SALES_VM_BAR[cardKey] ?? FALLBACK;
}
