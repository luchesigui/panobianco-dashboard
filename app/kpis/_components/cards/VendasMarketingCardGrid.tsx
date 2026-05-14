import type { KpiPageData } from "@/lib/data/kpis";
import { salesMarketingBarColor } from "@/lib/kpis/card-bar-colors";
import { abbreviatePeriodLabel, formatValue } from "@/lib/kpis/format";
import styles from "../../page.module.css";
import { renderDelta } from "./render-delta";

type KpiCard = {
	key: string;
	label: string;
	unit?: "currency" | "percent" | "count";
};

type KpiMeta = Record<string, unknown>;

const CARDS: KpiCard[] = [
	{ key: "sales_total", label: "Vendas totais" },
	{ key: "no_show_rate", label: "No-show experimental", unit: "percent" },
	{
		key: "present_conversion_rate",
		label: "Conversão presentes",
		unit: "percent",
	},
	{ key: "leads_generated", label: "Leads gerados" },
	{ key: "avg_ticket", label: "Ticket médio", unit: "currency" },
	{ key: "cac_per_sale", label: "CAC por venda", unit: "currency" },
	{
		key: "meta_ads_investment",
		label: "Investimento Meta Ads",
		unit: "currency",
	},
	{ key: "instagram_total_reach", label: "Alcance total" },
];

function metaLines(cardKey: string, meta: KpiMeta): string[] {
	const lines: string[] = [];
	if (
		cardKey === "sales_total" &&
		typeof meta.goal === "number" &&
		typeof meta.goal_pct === "number"
	) {
		lines.push(`Meta ${meta.goal} (${meta.goal_pct}%)`);
	}
	if (
		[
			"no_show_rate",
			"present_conversion_rate",
			"cac_per_sale",
			"meta_ads_investment",
		].includes(cardKey) &&
		typeof meta.detail_line === "string"
	) {
		lines.push(meta.detail_line);
	}
	if (cardKey === "avg_ticket") {
		if (typeof meta.meta_line === "string") lines.push(meta.meta_line);
		if (typeof meta.breakdown_line === "string")
			lines.push(meta.breakdown_line);
	}
	if (
		cardKey === "instagram_total_reach" &&
		typeof meta.detail_line === "string"
	) {
		lines.push(meta.detail_line);
	}
	return lines;
}

export function VendasMarketingCardGrid({ data }: { data: KpiPageData }) {
	const smComparisonShort = data.salesMarketingDashboard.comparisonPeriodLabel;
	const fallbackVsLabel = abbreviatePeriodLabel(data.previousPeriodLabel);
	return (
		<div className={styles.kpiGrid}>
			{CARDS.map((card) => {
				const current = data.current[card.key];
				const previous = data.previous[card.key];
				const meta = data.currentMeta[card.key];
				const deltaVsLabel = smComparisonShort ?? fallbackVsLabel;
				const metaObj = meta ?? {};
				const deltaOpts =
					card.key === "sales_total" &&
					typeof metaObj.delta_pct_display === "number"
						? { deltaPctDisplay: metaObj.delta_pct_display as number }
						: undefined;
				const delta = renderDelta(current, previous, deltaVsLabel, deltaOpts);
				const lines = metaLines(card.key, metaObj);

				let mainStr = formatValue(current, card.unit);
				if (
					card.key === "no_show_rate" ||
					card.key === "present_conversion_rate"
				) {
					mainStr = current != null ? `${current.toFixed(0)}%` : "N/A";
				}
				if (card.key === "instagram_total_reach" && current != null) {
					mainStr = new Intl.NumberFormat("pt-BR").format(current);
				}

				return (
					<article key={card.key} className={styles.kpiCard}>
						<span className={styles.kpiLabel}>{card.label}</span>
						<p className={styles.kpiValue}>{mainStr}</p>
						{lines.map((line) => (
							<p
								key={`${card.key}-${line}`}
								className={styles.kpiMetaLine}
							>
								{line}
							</p>
						))}
						{delta.pill ? (
							<div className={styles.kpiSub}>
								<span className={`${styles.kpiDelta} ${delta.pillClass}`}>
									{`${delta.pill}${delta.tail}`}
								</span>
							</div>
						) : null}
						<div
							className={styles.kpiBar}
							style={{ background: salesMarketingBarColor(card.key) }}
						/>
					</article>
				);
			})}
		</div>
	);
}
