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

export function ExecutiveStudentsTrendChart({ sixMonths }: Props) {
	const {
		periods,
		students,
	} = sixMonths;

	const chartData = useMemo(() => {
		return {
			labels: periods,
			datasets: [
				{
					type: "bar" as const,
					label: "Novas vendas",
					data: students.newSales,
					backgroundColor: CHART_COLOR.primary,
					borderRadius: 3,
					yAxisID: "yBar",
					order: 2,
				},
				{
					type: "bar" as const,
					label: "Saídas (Evasão)",
					data: students.exits,
					backgroundColor: CHART_COLOR.comparison,
					borderRadius: 3,
					yAxisID: "yBar",
					order: 3,
				},
				{
					type: "line" as const,
					label: "Base de alunos",
					data: students.baseEnd,
					borderColor: "#1A1A18",
					backgroundColor: "rgba(26, 26, 24, 0.05)",
					pointBackgroundColor: "#1A1A18",
					pointBorderColor: "#FFFFFF",
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7,
					borderWidth: 2.5,
					tension: 0.25,
					yAxisID: "yBase",
					order: 1,
				},
				{
					type: "line" as const,
					label: "Meta da base",
					data: students.goals,
					borderColor: "#87756B",
					borderDash: [5, 4],
					borderWidth: 1.5,
					pointRadius: 0,
					fill: false,
					yAxisID: "yBase",
					order: 4,
				},
			],
		};
	}, [periods, students]);

	const options = useMemo(() => {
		let maxBar = 0;
		for (const s of students.newSales) {
			if (s > maxBar) maxBar = s;
		}
		for (const e of students.exits) {
			if (e !== null && e > maxBar) maxBar = e;
		}
		const yBarMax = Math.max(180, Math.ceil((maxBar * 1.2) / 20) * 20);

		let minBase = 9999;
		let maxBase = 0;
		for (const b of students.baseEnd) {
			if (b !== null) {
				if (b < minBase) minBase = b;
				if (b > maxBase) maxBase = b;
			}
		}
		for (const g of students.goals) {
			if (g !== null && g > maxBase) maxBase = g;
		}
		const yBaseMin = Math.max(0, Math.floor((minBase - 80) / 100) * 100);
		const yBaseMax = Math.ceil((maxBase + 80) / 100) * 100;

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
							const net = students.netGrowth[idx];
							if (item.dataset.label === "Novas vendas" && net !== null) {
								return `Novas vendas: ${val} (Saldo líquido: ${net >= 0 ? "+" : ""}${net})`;
							}
							if (item.dataset.label === "Saídas (Evasão)") {
								const canc = students.cancellations[idx];
								const nonRen = students.nonRenewed[idx];
								const breakdown =
									canc != null || nonRen != null
										? ` (${canc ?? 0} canc. · ${nonRen ?? 0} desist.)`
										: "";
								return `Saídas: ${val}${breakdown}`;
							}
							if (item.dataset.label === "Base de alunos") {
								const goal = students.goals[idx];
								const gap = goal != null ? val - goal : null;
								const gapStr =
									gap != null
										? ` (Meta: ${goal} · ${gap >= 0 ? "+" : ""}${gap})`
										: "";
								return `Base de alunos: ${val}${gapStr}`;
							}
							return `${item.dataset.label}: ${val}`;
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
				yBar: {
					type: "linear" as const,
					position: "left" as const,
					min: 0,
					max: yBarMax,
					grid: { color: CHART_PAINT.grid },
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10 },
					},
					title: {
						display: true,
						text: "Vendas / Saídas",
						color: CHART_PAINT.axisText,
						font: { size: 10, weight: "bold" as const },
					},
				},
				yBase: {
					type: "linear" as const,
					position: "right" as const,
					min: yBaseMin,
					max: yBaseMax,
					grid: { display: false },
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10 },
					},
					title: {
						display: true,
						text: "Base total",
						color: CHART_PAINT.axisText,
						font: { size: 10, weight: "bold" as const },
					},
				},
			},
		};
	}, [students]);

	const totalNet = students.totalNetGrowth;

	return (
		<article className={styles.chartCard}>
			<div className={styles.chartCardHeader}>
				<div className={styles.chartTitleRow}>
					<h3 className={styles.chartTitle}>
						Dinâmica de Alunos & Evasão (6 Meses)
					</h3>
				</div>
				<p className={styles.chartSub}>
					Entradas (Vendas) vs Saídas e Trajetória da Base de Alunos
				</p>
			</div>

			<div className={styles.chartMiniSummary}>
				<span className={styles.summaryItem}>
					Saldo Líquido 6M:{" "}
					<span className={styles.summaryItemStrong}>
						{totalNet >= 0 ? `+${totalNet}` : `${totalNet}`} alunos
					</span>
				</span>
				<span>·</span>
				<span className={styles.summaryItem}>
					Média Vendas:{" "}
					<span className={styles.summaryItemStrong}>
						{students.avgNewSales}/mês
					</span>
				</span>
				<span>·</span>
				<span className={styles.summaryItem}>
					Média Saídas:{" "}
					<span className={styles.summaryItemStrong}>
						{students.avgExits}/mês
					</span>
				</span>
			</div>

			<div className={styles.chartCanvasContainer}>
				<Chart type="bar" data={chartData} options={options} />
			</div>
		</article>
	);
}
