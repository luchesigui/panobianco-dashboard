"use client";

import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	Tooltip,
	type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import styles from "./projecao.module.css";

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.06)";

const COL = {
	matriculated: "#2b6cb0",
	wellhub: "#065f46",
	totalpass: "#ed8936",
	products: "#c05621",
	uncategorized: "#cbd5e0",
};

function fmtK(value: number): string {
	const k = value / 1000;
	const s =
		Math.abs(k) >= 100 ? Math.round(k).toString() : Math.round(k).toString();
	return `R$ ${s}k`;
}

function stackedTooltipLabel(item: TooltipItem<"bar">): string {
	const v = item.parsed.y;
	if (v == null || typeof v !== "number") return "";
	return `${item.dataset.label ?? ""}: ${fmtK(v)}`;
}

type Props = {
	revenueChart: {
		labels: [string, string];
		stacked: {
			matriculated: [number, number];
			wellhub: [number, number];
			totalpass: [number, number];
			products: [number, number];
			uncategorized: [number, number];
		};
	};
};

export function ProjecaoReceita({ revenueChart }: Props) {
	const stackedData = useMemo(
		() => ({
			labels: [...revenueChart.labels],
			datasets: [
				{
					label: "Matriculados",
					data: [...revenueChart.stacked.matriculated],
					backgroundColor: COL.matriculated,
					borderWidth: 0,
				},
				{
					label: "Wellhub",
					data: [...revenueChart.stacked.wellhub],
					backgroundColor: COL.wellhub,
					borderWidth: 0,
				},
				{
					label: "Totalpass",
					data: [...revenueChart.stacked.totalpass],
					backgroundColor: COL.totalpass,
					borderWidth: 0,
				},
				{
					label: "Produtos",
					data: [...revenueChart.stacked.products],
					backgroundColor: COL.products,
					borderWidth: 0,
				},
				{
					label: "Não categorizado",
					data: [...revenueChart.stacked.uncategorized],
					backgroundColor: COL.uncategorized,
					borderWidth: 0,
				},
			],
		}),
		[revenueChart],
	);

	const stackedMax = useMemo(() => {
		let max = 0;
		for (let i = 0; i < 2; i++) {
			const t =
				(revenueChart.stacked.matriculated[i] ?? 0) +
				(revenueChart.stacked.wellhub[i] ?? 0) +
				(revenueChart.stacked.totalpass[i] ?? 0) +
				(revenueChart.stacked.products[i] ?? 0) +
				(revenueChart.stacked.uncategorized[i] ?? 0);
			if (t > max) max = t;
		}
		const step = 50000;
		return Math.max(step, Math.ceil(max / step) * step);
	}, [revenueChart.stacked]);

	const plugins = useMemo(
		() => ({
			legend: {
				position: "top" as const,
				align: "start" as const,
				labels: {
					boxWidth: 10,
					boxHeight: 10,
					font: { size: 10 },
					color: TICK,
				},
			},
			tooltip: { callbacks: { label: stackedTooltipLabel } },
		}),
		[],
	);

	const commonX = {
		ticks: {
			color: TICK,
			maxRotation: 0,
			minRotation: 0,
			font: { size: 10 },
		},
		grid: { color: GRID },
	};

	return (
		<article className={styles.chartCard}>
			<h4 className={styles.chartTitle}>Receita prevista — composição</h4>
			<p className={styles.chartSub}>
				Último mês real vs mês seguinte (projeção)
			</p>
			<div className={styles.chartCanvas}>
				<Bar
					data={stackedData}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins,
						scales: {
							x: { ...commonX, stacked: true },
							y: {
								stacked: true,
								min: 0,
								max: stackedMax,
								ticks: {
									color: TICK,
									font: { size: 10 },
									callback: (v) => fmtK(Number(v)),
								},
								grid: { color: GRID },
							},
						},
					}}
				/>
			</div>
		</article>
	);
}
