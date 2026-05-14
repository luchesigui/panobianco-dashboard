import type { KpiPageData } from "@/lib/data/kpis";
import { KPI_BAR, barColor } from "@/lib/kpis/card-bar-colors";
import {
	abbreviatePeriodLabel,
	formatCompactBrl,
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
	{ key: "base_students_end", label: "Base de alunos" },
	{ key: "sales_total", label: "Vendas no mês" },
	{ key: "revenue_total", label: "Receita total", unit: "currency" },
	{
		key: "operational_result",
		label: "Resultado operacional",
		unit: "currency",
	},
];

function overviewMainValue(
	card: KpiCard,
	current: number | undefined,
	meta: KpiMeta | undefined,
): string {
	if (current == null) return "N/A";
	if (card.key === "base_students_end") {
		const star = meta?.partial === true ? "*" : "";
		return `${new Intl.NumberFormat("pt-BR").format(current)}${star}`;
	}
	if (card.key === "revenue_total") return formatCompactBrl(current);
	if (card.key === "operational_result") return formatCurrencySignedK(current);
	return formatValue(current, card.unit);
}

function overviewMetaLine(
	cardKey: string,
	meta: KpiMeta | undefined,
): string | null {
	if (!meta) return null;
	if (cardKey === "base_students_end") {
		const goal = meta.goal;
		const pending =
			typeof meta.pending_note_overview === "string"
				? meta.pending_note_overview
				: meta.pending_note;
		if (typeof goal === "number" && typeof pending === "string") {
			return `*${pending} · meta: ${goal}`;
		}
	}
	if (cardKey === "sales_total") {
		const g = meta.goal;
		if (typeof g === "number") return `meta: ${g}`;
	}
	if (cardKey === "operational_result") {
		const m = meta.margin_percent;
		const rec = meta.record === true;
		if (typeof m === "number") {
			const parts = [`margem ${m.toFixed(1).replace(".", ",")}%`];
			if (rec) parts.push("novo recorde");
			return parts.join(" · ");
		}
	}
	return null;
}

function overviewBarColor(
	cardKey: string,
	current: number | undefined,
	previous: number | undefined,
): string {
	if (cardKey === "sales_total") {
		if (current == null || previous == null || previous === 0) {
			return KPI_BAR.sales_total;
		}
		const pct = ((current - previous) / Math.abs(previous)) * 100;
		if (pct < 0) return "#a32d2d";
	}
	return barColor(cardKey);
}

export function VisaoGeralCardGrid({ data }: { data: KpiPageData }) {
	const shortVsLabel = abbreviatePeriodLabel(data.previousPeriodLabel);
	return (
		<div className={styles.kpiGrid}>
			{CARDS.map((card) => {
				const current = data.current[card.key];
				const previous = data.previous[card.key];
				const meta = data.currentMeta[card.key];
				const overviewDelta = renderDelta(current, previous, shortVsLabel);

				if (card.key === "base_students_end") {
					const goal = data.current["base_students_goal"];
					const deltaText = overviewDelta.pill
						? `${overviewDelta.pill}${overviewDelta.tail}`
						: overviewDelta.tail;
					return (
						<article key={card.key} className={styles.kpiCard}>
							<span className={styles.kpiLabel}>{card.label}</span>
							<p className={styles.kpiValue}>
								{overviewMainValue(card, current, meta)}
							</p>
							{typeof goal === "number" ? (
								<p className={styles.kpiMetaLine}>{`Meta: ${goal}`}</p>
							) : null}
							{overviewDelta.pill ? (
								<div className={styles.kpiSub}>
									<span
										className={`${styles.kpiDelta} ${overviewDelta.pillClass}`}
									>
										{deltaText}
									</span>
								</div>
							) : null}
							<div
								className={styles.kpiBar}
								style={{
									background: overviewBarColor(card.key, current, previous),
								}}
							/>
						</article>
					);
				}

				const metaLine = overviewMetaLine(card.key, meta);
				return (
					<article key={card.key} className={styles.kpiCard}>
						<span className={styles.kpiLabel}>{card.label}</span>
						<p className={styles.kpiValue}>
							{overviewMainValue(card, current, meta)}
						</p>
						{metaLine ? (
							<p className={styles.kpiMetaLine}>{metaLine}</p>
						) : null}
						{overviewDelta.pill ? (
							<div className={styles.kpiSub}>
								<span
									className={`${styles.kpiDelta} ${overviewDelta.pillClass}`}
								>
									{`${overviewDelta.pill}${overviewDelta.tail}`}
								</span>
							</div>
						) : null}
						<div
							className={styles.kpiBar}
							style={{
								background: overviewBarColor(card.key, current, previous),
							}}
						/>
					</article>
				);
			})}
		</div>
	);
}
