import type { ReactNode } from "react";
import type { KpiPageData } from "@/lib/data/kpis";
import { barColor } from "@/lib/kpis/card-bar-colors";
import {
	abbreviatePeriodLabel,
	formatCompactBrl,
	formatCompactBrlOneDecimal,
	formatCurrencySignedK,
	formatValue,
} from "@/lib/kpis/format";
import styles from "../../page.module.css";
import { renderDelta } from "./render-delta";

type KpiCard = {
	key: string;
	label: string;
	unit?: "currency" | "percent" | "count";
};

type KpiMeta = Record<string, unknown>;

const CARDS: KpiCard[] = [
	{ key: "revenue_total", label: "Receita total", unit: "currency" },
	{ key: "expenses_total", label: "Despesa total", unit: "currency" },
	{
		key: "operational_result",
		label: "Resultado operacional",
		unit: "currency",
	},
	{ key: "invoice_tax_nf", label: "Imposto NF emitido", unit: "currency" },
	{
		key: "operational_result_100pct_nf",
		label: "Resultado se 100% NF",
		unit: "currency",
	},
	{
		key: "accumulated_operational_no_contributions",
		label: "Acumulado sem aportes",
		unit: "currency",
	},
	{
		key: "accumulated_with_contributions",
		label: "Acumulado com aportes",
		unit: "currency",
	},
	{
		key: "matriculated_revenue",
		label: "Receita matriculados",
		unit: "currency",
	},
	{ key: "wellhub_revenue", label: "Receita Wellhub", unit: "currency" },
	{ key: "totalpass_revenue", label: "Receita Totalpass", unit: "currency" },
	{
		key: "royalties_validation",
		label: "Royalties (validação)",
		unit: "currency",
	},
];

function financeMainDisplay(
	cardKey: string,
	current: number | undefined,
	meta: KpiMeta | undefined,
): string {
	const m = meta ?? {};
	if (current == null) return "N/A";
	if (cardKey === "revenue_total") return formatCompactBrl(current);
	if (
		cardKey === "expenses_total" ||
		cardKey === "matriculated_revenue" ||
		cardKey === "wellhub_revenue" ||
		cardKey === "totalpass_revenue"
	) {
		return formatCompactBrl(current);
	}
	if (
		cardKey === "operational_result" ||
		cardKey === "operational_result_100pct_nf" ||
		cardKey === "accumulated_operational_no_contributions"
	) {
		return formatCurrencySignedK(current);
	}
	if (cardKey === "accumulated_with_contributions") {
		if (m.compact_currency === true) {
			const k = Math.round(Math.abs(current) / 1000);
			const sign = current >= 0 ? "+" : "-";
			return `${sign}R$ ${k}k`;
		}
		return formatCurrencySignedK(current);
	}
	if (cardKey === "invoice_tax_nf") {
		if (m.approximate_main === true || Math.abs(current) < 500) return "~R$ 0";
		return formatValue(current, "currency");
	}
	if (cardKey === "royalties_validation") {
		return formatCompactBrlOneDecimal(current);
	}
	return formatValue(current, "currency");
}

export function FinanceiroCardGrid({ data }: { data: KpiPageData }) {
	const vsLabel = abbreviatePeriodLabel(data.previousPeriodLabel);
	const revenueTotal = data.current.revenue_total;

	const renderCard = (card: KpiCard) => {
		const current = data.current[card.key];
		const previous = data.previous[card.key];
		const meta = data.currentMeta[card.key];
		const m = meta ?? {};
		const metaLines: ReactNode[] = [];
		let deltaBlock: ReactNode = null;
		let afterDelta: ReactNode = null;
		const key = card.key;

		if (key === "revenue_total") {
			const deltaOpts =
				typeof m.delta_pct_display === "number"
					? {
							deltaPctDisplay: m.delta_pct_display as number,
							pctAsInteger: true,
						}
					: { pctAsInteger: true };
			const delta = renderDelta(current, previous, vsLabel, deltaOpts);
			deltaBlock = (
				<div className={styles.kpiSub}>
					{delta.pill ? (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{`${delta.pill}${delta.tail}`}
						</span>
					) : (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{delta.tail}
						</span>
					)}
				</div>
			);
		} else if (key === "expenses_total") {
			const delta = renderDelta(current, previous, vsLabel, {
				invertColors: true,
				pctAsInteger: true,
			});
			deltaBlock = (
				<div className={styles.kpiSub}>
					{delta.pill ? (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{`${delta.pill}${delta.tail}`}
						</span>
					) : (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{delta.tail}
						</span>
					)}
					{typeof m.delta_abs_line === "string" ? (
						<span className={styles.kpiMetaMuted}> {m.delta_abs_line}</span>
					) : null}
				</div>
			);
		} else if (key === "operational_result") {
			const mPct = meta?.margin_percent;
			if (typeof mPct === "number") {
				metaLines.push(
					<p key="opm" className={styles.kpiMetaLine}>
						margem {mPct.toFixed(1).replace(".", ",")}%
					</p>,
				);
			}
			const deltaOpts =
				typeof m.delta_pct_display === "number"
					? {
							deltaPctDisplay: m.delta_pct_display as number,
							pctAsInteger: true,
						}
					: { pctAsInteger: true };
			const delta = renderDelta(current, previous, vsLabel, deltaOpts);
			deltaBlock = (
				<div className={styles.kpiSub}>
					{delta.pill ? (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{`${delta.pill}${delta.tail}`}
						</span>
					) : (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{delta.tail}
						</span>
					)}
				</div>
			);
		} else if (key === "invoice_tax_nf") {
			if (typeof m.pct_revenue_line === "string") {
				metaLines.push(
					<p key="p1" className={styles.kpiMetaLine}>
						{m.pct_revenue_line}
					</p>,
				);
			}
			if (typeof m.ref_line === "string") {
				metaLines.push(
					<p key="p2" className={styles.kpiMetaDanger}>
						{m.ref_line}
					</p>,
				);
			}
			if (typeof m.footnote === "string") {
				metaLines.push(
					<p key="p3" className={styles.kpiDetailLine}>
						{m.footnote}
					</p>,
				);
			}
		} else if (key === "operational_result_100pct_nf") {
			if (typeof m.margin_line === "string") {
				metaLines.push(
					<p key="m1" className={styles.kpiMetaLine}>
						{m.margin_line}
					</p>,
				);
			}
			if (typeof m.tax_theory_line === "string") {
				metaLines.push(
					<p key="m2" className={styles.kpiDetailLine}>
						{m.tax_theory_line}
					</p>,
				);
			}
		} else if (key === "accumulated_operational_no_contributions") {
			if (typeof m.subline === "string") {
				metaLines.push(
					<p key="s1" className={styles.kpiMetaLine}>
						{m.subline}
					</p>,
				);
			}
			if (typeof m.delta_vs_prev_pill === "string") {
				deltaBlock = (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{m.delta_vs_prev_pill}
						</span>
					</div>
				);
			}
			if (typeof m.footnote === "string") {
				afterDelta = (
					<p key="s2" className={styles.kpiDetailLine}>
						{m.footnote}
					</p>
				);
			}
		} else if (key === "accumulated_with_contributions") {
			if (typeof m.subline === "string") {
				metaLines.push(
					<p key="a1" className={styles.kpiMetaLine}>
						{m.subline}
					</p>,
				);
			}
			if (typeof m.delta_vs_prev_pill === "string") {
				deltaBlock = (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{m.delta_vs_prev_pill}
						</span>
					</div>
				);
			}
			if (typeof m.aportes_line === "string") {
				afterDelta = (
					<p key="a2" className={styles.kpiDetailLine}>
						{m.aportes_line}
					</p>
				);
			}
		} else if (key === "matriculated_revenue") {
			if (revenueTotal != null && revenueTotal > 0 && current != null) {
				const pct = ((current / revenueTotal) * 100)
					.toFixed(1)
					.replace(".", ",");
				metaLines.push(
					<p key="mat1" className={styles.kpiMetaLine}>
						{pct}% do total
					</p>,
				);
			}
			const deltaOpts =
				typeof m.delta_pct_display === "number"
					? {
							deltaPctDisplay: m.delta_pct_display as number,
							pctAsInteger: true,
						}
					: { pctAsInteger: true };
			const delta = renderDelta(current, previous, vsLabel, deltaOpts);
			deltaBlock = (
				<div className={styles.kpiSub}>
					{delta.pill ? (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{`${delta.pill}${delta.tail}`}
						</span>
					) : (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{delta.tail}
						</span>
					)}
				</div>
			);
			if (
				typeof m.recorrente === "number" &&
				typeof m.anual === "number" &&
				typeof m.mensal === "number"
			) {
				afterDelta = (
					<p key="mat2" className={styles.kpiDetailLine}>
						Recorrente {formatCompactBrlOneDecimal(m.recorrente)} · Anual{" "}
						{formatCompactBrlOneDecimal(m.anual)} · Mensal{" "}
						{formatCompactBrlOneDecimal(m.mensal)}
					</p>
				);
			}
		} else if (key === "wellhub_revenue" || key === "totalpass_revenue") {
			if (revenueTotal != null && revenueTotal > 0 && current != null) {
				const pct = ((current / revenueTotal) * 100)
					.toFixed(1)
					.replace(".", ",");
				metaLines.push(
					<p key="wh1" className={styles.kpiMetaLine}>
						{pct}% do total
					</p>,
				);
			}
			const deltaOpts =
				typeof m.delta_pct_display === "number"
					? {
							deltaPctDisplay: m.delta_pct_display as number,
							pctAsInteger: true,
						}
					: { pctAsInteger: true };
			const delta = renderDelta(current, previous, vsLabel, deltaOpts);
			deltaBlock = (
				<div className={styles.kpiSub}>
					{delta.pill ? (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{`${delta.pill}${delta.tail}`}
						</span>
					) : (
						<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
							{delta.tail}
						</span>
					)}
				</div>
			);
		} else if (key === "royalties_validation") {
			if (typeof m.pct_line === "string") {
				metaLines.push(
					<p key="r1" className={styles.kpiMetaLine}>
						{m.pct_line}
					</p>,
				);
			}
			if (typeof m.shortfall_pill === "string") {
				deltaBlock = (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaDown}`}>
							{m.shortfall_pill}
						</span>
					</div>
				);
			}
		}

		return (
			<article key={card.key} className={styles.kpiCard}>
				<span className={styles.kpiLabel}>{card.label}</span>
				<p className={styles.kpiValue}>
					{financeMainDisplay(card.key, current, meta)}
				</p>
				{metaLines}
				{deltaBlock}
				{afterDelta}
				<div
					className={styles.kpiBar}
					style={{ background: barColor(card.key) }}
				/>
			</article>
		);
	};

	return <div className={styles.kpiGrid}>{CARDS.map(renderCard)}</div>;
}
