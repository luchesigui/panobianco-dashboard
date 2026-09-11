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
import { CHART_COLOR, CHART_PAINT } from "@/lib/kpis/card-bar-colors";
import styles from "./vendas-marketing.module.css";

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
	weeks: string[];
	sales: Array<number | null>;
	cancellations: Array<number | null>;
	netBalance: Array<number | null>;
};

export function WeeklyProgressionChart({
	weeks,
	sales,
	cancellations,
	netBalance,
}: Props) {
	const totalSales = sales.reduce((a: number, b) => a + (b ?? 0), 0);
	const totalCanc = cancellations.reduce((a: number, b) => a + (b ?? 0), 0);
	const totalNet = totalSales - totalCanc;

	const hasAnyData = sales.some((v) => v !== null) || cancellations.some((v) => v !== null);

	const chartData = useMemo(() => {
		const netData = netBalance.map((v, i) => {
			if (v !== null) return v;
			const s = sales[i];
			const c = cancellations[i];
			if (s == null && c == null) return null;
			return (s ?? 0) - (c ?? 0);
		});

		return {
			labels: weeks,
			datasets: [
				{
					type: "bar" as const,
					label: "Novas conversões",
					data: sales,
					backgroundColor: CHART_COLOR.primary,
					borderRadius: 3,
					order: 2,
				},
				{
					type: "bar" as const,
					label: "Cancelamentos",
					data: cancellations,
					backgroundColor: CHART_COLOR.comparison,
					borderRadius: 3,
					order: 3,
				},
				{
					type: "line" as const,
					label: "Saldo semanal",
					data: netData,
					borderColor: "#10B981",
					backgroundColor: "rgba(16, 185, 129, 0.12)",
					pointBackgroundColor: netData.map((v) =>
						v !== null && v >= 0 ? "#10B981" : "#EF4444",
					),
					pointBorderColor: "#FFFFFF",
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7,
					borderWidth: 2.5,
					tension: 0.2,
					order: 1,
				},
			],
		};
	}, [weeks, sales, cancellations, netBalance]);

	const options = useMemo(() => {
		let maxVal = 20;
		let minVal = 0;
		for (const v of sales) {
			if (v !== null && v > maxVal) maxVal = v;
		}
		for (const v of cancellations) {
			if (v !== null && v > maxVal) maxVal = v;
		}
		for (const v of netBalance) {
			if (v !== null && v < minVal) minVal = v;
		}

		const yMax = Math.ceil((maxVal * 1.2) / 5) * 5;
		const yMin = minVal < 0 ? Math.floor(minVal / 5) * 5 : 0;

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
							if (item.dataset.label === "Saldo semanal") {
								return `Saldo semanal: ${val >= 0 ? `+${val}` : `${val}`} alunos`;
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
				y: {
					min: yMin,
					max: yMax,
					grid: { color: CHART_PAINT.grid },
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10 },
						stepSize: 5,
					},
				},
			},
		};
	}, [sales, cancellations, netBalance]);

	if (!hasAnyData) return null;

	return (
		<div style={{ marginTop: "1.5rem" }}>
			<div className={styles.chartCard} style={{ minHeight: "340px", padding: "1.25rem" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "0.75rem" }}>
					<div>
						<h4 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
							Progressão Semanal: Conversões vs Cancelamentos & Saldo
						</h4>
						<p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
							Acompanhamento semanal de entradas, saídas e saldo líquido de alunos
						</p>
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--surface-muted)", padding: "6px 12px", borderRadius: "2px", fontSize: "0.75rem" }}>
						<span>Vendas: <strong>{totalSales}</strong></span>
						<span>·</span>
						<span>Cancelamentos: <strong>{totalCanc}</strong></span>
						<span>·</span>
						<span>
							Saldo:{" "}
							<strong style={{ color: totalNet > 0 ? "#047857" : totalNet < 0 ? "#b91c1c" : "inherit" }}>
								{totalNet > 0 ? `+${totalNet}` : `${totalNet}`}
							</strong>
						</span>
					</div>
				</div>

				<div style={{ position: "relative", width: "100%", height: "230px" }}>
					<Chart type="bar" data={chartData} options={options} />
				</div>
			</div>
		</div>
	);
}
