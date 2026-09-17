"use client";

import {
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
import { Line } from "react-chartjs-2";
import { CHART_COLOR, CHART_PAINT } from "@/lib/kpis/card-bar-colors";
import styles from "./roi-charts.module.css";

ChartJS.register(
	CategoryScale,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
);

const LINE_BROWN = CHART_COLOR.neutral;

function fmtKFull(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 0,
	}).format(value);
}

function fmtKShort(value: number): string {
	if (value === 0) return "R$ 0";
	const k = value / 1000;
	return `R$ ${Math.round(k)}k`;
}

type Props = {
	recoveryEvolution: { labels: string[]; values: number[] };
};

export function SaldoRecuperar({ recoveryEvolution }: Props) {
	const lineData = useMemo(
		() => ({
			labels: recoveryEvolution.labels,
			datasets: [
				{
					label: "Saldo a recuperar",
					data: recoveryEvolution.values,
					borderColor: LINE_BROWN,
					backgroundColor: CHART_PAINT.recoveryFill,
					borderWidth: 2.5,
					tension: 0.25,
					fill: true,
					pointRadius: 4,
					pointBackgroundColor: CHART_PAINT.canvasSurface,
					pointBorderColor: LINE_BROWN,
					pointBorderWidth: 2,
				},
			],
		}),
		[recoveryEvolution.labels, recoveryEvolution.values],
	);

	const lineOptions = useMemo(() => {
		const vals = recoveryEvolution.values;
		const maxV = vals.length > 0 ? Math.max(...vals) : 0;
		const pad = 50_000;
		const yMax = Math.max(50_000, Math.ceil((maxV + pad) / 50_000) * 50_000);
		return {
			responsive: true,
			maintainAspectRatio: false,
			layout: { padding: { top: 6, right: 8, bottom: 0, left: 0 } },
			interaction: { mode: "index" as const, intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (item: TooltipItem<"line">) => {
							const y = item.parsed.y;
							if (y == null) return "";
							return fmtKFull(y);
						},
					},
				},
			},
			scales: {
				x: {
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
						maxRotation: 45,
						autoSkip: false,
					},
					grid: { display: false },
					border: { display: false },
				},
				y: {
					min: 0,
					beginAtZero: true,
					max: yMax,
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
						callback: (v: string | number) => fmtKShort(Number(v)),
					},
					grid: { color: CHART_PAINT.grid },
					border: { display: false },
				},
			},
		};
	}, [recoveryEvolution.values]);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartTitle}>Evolução do saldo a recuperar</h3>
			<p className={styles.chartSub}>Total investido − lucro distribuído acumulado</p>
			<div className={styles.chartCanvas}>
				<Line data={lineData} options={lineOptions} />
			</div>
		</div>
	);
}
