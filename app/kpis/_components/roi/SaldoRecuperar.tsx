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
import styles from "./roi-charts.module.css";

ChartJS.register(
	CategoryScale,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.06)";
const LINE_BROWN = "#854f0b";

function fmtKFull(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 0,
	}).format(value);
}

function fmtKShort(value: number): string {
	const k = value / 1000;
	return `R$ ${k >= 100 ? Math.round(k) : Math.round(k)}k`;
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
					backgroundColor: "rgba(133, 79, 11, 0.06)",
					borderWidth: 2.5,
					tension: 0.25,
					fill: true,
					pointRadius: 4,
					pointBackgroundColor: "#fff",
					pointBorderColor: LINE_BROWN,
					pointBorderWidth: 2,
				},
			],
		}),
		[recoveryEvolution.labels, recoveryEvolution.values],
	);

	const lineOptions = useMemo(() => {
		const vals = recoveryEvolution.values;
		const minV = Math.min(...vals);
		const maxV = Math.max(...vals);
		const pad = 20_000;
		const yMin = Math.floor((minV - pad) / 10_000) * 10_000;
		const yMax = Math.ceil((maxV + pad) / 10_000) * 10_000;
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
						color: TICK,
						font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
						maxRotation: 45,
						autoSkip: false,
					},
					grid: { display: false },
					border: { display: false },
				},
				y: {
					min: yMin,
					max: yMax,
					ticks: {
						color: TICK,
						font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
						callback: (v: string | number) => fmtKShort(Number(v)),
					},
					grid: { color: GRID },
					border: { display: false },
				},
			},
		};
	}, [recoveryEvolution.values]);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartTitle}>Evolução do saldo a recuperar</h3>
			<p className={styles.chartSub}>Aportes − resultado operacional acumulado</p>
			<div className={styles.chartCanvas}>
				<Line data={lineData} options={lineOptions} />
			</div>
		</div>
	);
}
