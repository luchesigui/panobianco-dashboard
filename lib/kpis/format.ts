/** Formatting helpers shared across the /kpis dashboard. */

export type KpiUnit = "currency" | "percent" | "count";

export function formatCompactBrl(value: number): string {
	const k = Math.round(value / 1000);
	return `R$ ${k}k`;
}

export function formatCompactBrlOneDecimal(value: number): string {
	const k = value / 1000;
	return `R$ ${k.toFixed(1).replace(".", ",")}k`;
}

export function formatCurrencySignedK(value: number): string {
	const sign = value >= 0 ? "+" : "-";
	const k = Math.round(Math.abs(value) / 1000);
	return `${sign}R$ ${k}k`;
}

export function formatValue(value?: number, unit?: KpiUnit): string {
	if (value == null) return "N/A";
	if (unit === "currency") {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
			maximumFractionDigits: 0,
		}).format(value);
	}
	if (unit === "percent") return `${value.toFixed(0)}%`;
	return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDeltaPill(pct: number, asInteger: boolean): string {
	if (asInteger) {
		const r = Math.round(pct);
		return `${r > 0 ? "+" : ""}${r}%`;
	}
	return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/** Returns the % delta between current and previous, or null if undefined / divide-by-zero. */
export function computeDeltaPct(
	current?: number,
	previous?: number,
): number | null {
	if (current == null || previous == null || previous === 0) return null;
	return ((current - previous) / Math.abs(previous)) * 100;
}

const MONTH_MAP: Record<string, string> = {
	janeiro: "Jan",
	fevereiro: "Fev",
	marco: "Mar",
	abril: "Abr",
	maio: "Mai",
	junho: "Jun",
	julho: "Jul",
	agosto: "Ago",
	setembro: "Set",
	outubro: "Out",
	novembro: "Nov",
	dezembro: "Dez",
};

/** Abbreviate "marco/26" → "Mar"; preserves input shape when not matching. */
export function abbreviatePeriodLabel(
	periodLabel?: string,
): string | undefined {
	if (!periodLabel) return periodLabel;
	const [monthRaw] = periodLabel.split("/");
	if (!monthRaw) return periodLabel;
	const month = monthRaw.trim().toLowerCase();
	const shortMonth = MONTH_MAP[month] ?? monthRaw.trim();
	return shortMonth;
}
