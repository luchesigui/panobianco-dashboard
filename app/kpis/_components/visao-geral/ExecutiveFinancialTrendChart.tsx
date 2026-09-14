"use client";

import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
	type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import type { ExecutiveSixMonthsPayload } from "@/lib/data/kpis";
import { CHART_COLOR, CHART_PAINT } from "@/lib/kpis/card-bar-colors";
import {
	formatCompactBrl,
	formatCurrencySignedK,
} from "@/lib/kpis/format";
import styles from "./executive-summary.module.css";

ChartJS.register(
	BarElement,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
);

type Props = {
	sixMonths: ExecutiveSixMonthsPayload;
};

export function ExecutiveFinancialTrendChart({ sixMonths }: Props) {
	const {
		periods,
		financial,
	} = sixMonths;

	const chartData = useMemo(() => {
		return {
			labels: periods,
			datasets: [
				{
					type: "bar" as const,
					label: "Receita total",
					data: financial.revenue,
					backgroundColor: CHART_COLOR.primary,
					borderRadius: 3,
					order: 2,
				},
				{
					type: "bar" as const,
					label: "Despesas operacionais",
					data: financial.expenses,
					backgroundColor: CHART_COLOR.neutral,
					borderRadius: 3,
					order: 3,
				},
				{
					type: "line" as const,
					label: "Resultado operacional",
					data: financial.operationalResult,
					borderColor: "#10B981",
					backgroundColor: "rgba(16, 185, 129, 0.12)",
					pointBackgroundColor: financial.operationalResult.map((v) =>
						v >= 0 ? "#10B981" : "#EF4444",
					),
					pointBorderColor: "#FFFFFF",
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7,
					borderWidth: 2.5,
					tension: 0.25,
					order: 1,
				},
			],
		};
	}, [periods, financial]);

	const options = useMemo(() => {
		let maxVal = 0;
		let minVal = 0;
		for (const r of financial.revenue) {
			if (r > maxVal) maxVal = r;
		}
		for (const e of financial.expenses) {
			if (e > maxVal) maxVal = e;
		}
		for (const op of financial.operationalResult) {
			if (op < minVal) minVal = op;
			if (op > maxVal) maxVal = op;
		}

		const step = 50000;
		const yMax = Math.ceil((maxVal * 1.15) / step) * step;
		const yMin = minVal < 0 ? Math.floor(minVal / 20000) * 20000 : 0;

		return {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: "index" as const,
				intersect: false,
			},
			plugins: {
				legend: {
					display: true,
					position: "top" as const,
					align: "end" as const,
					labels: {
						boxWidth: 12,
						boxHeight: 12,
						font: { size: 11, family: "DM Sans, sans-serif" },
						color: CHART_PAINT.axisText,
					},
				},
				tooltip: {
					backgroundColor: "rgba(26, 26, 24, 0.95)",
					padding: 10,
					titleFont: { size: 12, weight: "bold" as const },
					bodyFont: { size: 11 },
					callbacks: {
						label: (item: TooltipItem<"bar" | "line">) => {
							const val = item.parsed.y;
							if (val == null) return "";
							const idx = item.dataIndex;
							const margin = financial.marginPercent[idx];
							if (item.dataset.label === "Resultado operacional") {
								return `Resultado: ${formatCurrencySignedK(val)} (${margin >= 0 ? "+" : ""}${margin.toFixed(1).replace(".", ",")}% margem)`;
							}
							return `${item.dataset.label}: ${formatCompactBrl(val)}`;
						},
					},
				},
			},
			scales: {
				x: {
					grid: { display: false },
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 11, weight: "bold" as const },
					},
				},
				y: {
					min: yMin,
					max: yMax,
					grid: { color: CHART_PAINT.grid },
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10 },
						callback: (value: string | number) => {
							const n = Number(value);
							return formatCompactBrl(n);
						},
					},
				},
			},
		};
	}, [financial]);

	return (
		<article className={styles.chartCard}>
			<div className={styles.chartCardHeader}>
				<div className={styles.chartTitleRow}>
					<h3 className={styles.chartTitle}>
						Performance Financeira (Últimos 6 Meses)
					</h3>
				</div>
				<p className={styles.chartSub}>
					Receita Total vs Despesas Operacionais e Resultado Operacional
				</p>
			</div>

			<div className={styles.chartMiniSummary}>
				<span className={styles.summaryItem}>
					Média Receita:{" "}
					<span className={styles.summaryItemStrong}>
						{formatCompactBrl(financial.avgRevenue)}/mês
					</span>
				</span>
				<span>·</span>
				<span className={styles.summaryItem}>
					Resultado Acumulado 6M:{" "}
					<span className={styles.summaryItemStrong}>
						{formatCurrencySignedK(financial.accumulatedResult)}
					</span>
				</span>
				<span>·</span>
				<span className={styles.summaryItem}>
					Margem Média:{" "}
					<span className={styles.summaryItemStrong}>
						{financial.avgMarginPercent.toFixed(1).replace(".", ",")}%
					</span>
				</span>
			</div>

			<div className={styles.chartCanvasContainer}>
				<Chart type="bar" data={chartData} options={options} />
			</div>
		</article>
	);
}
