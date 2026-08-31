"use client";

import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	LinearScale,
	Tooltip,
	type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { CHART_COLOR, CHART_PAINT } from "@/lib/kpis/card-bar-colors";
import styles from "./financeiro-charts.module.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const POS = CHART_COLOR.primary;
const NEG = CHART_COLOR.comparison;

function fmtK(value: number): string {
	const k = value / 1000;
	const s = Math.abs(k) >= 100 ? Math.round(k).toString() : k.toFixed(0);
	return `R$ ${s}k`;
}

function opTooltipLabel(item: TooltipItem<"bar">): string {
	const v = item.parsed.y;
	if (v == null || typeof v !== "number") return "";
	return fmtK(v);
}

type Props = {
	labels: string[];
	operationalResult: number[];
};

export function ResultadoOperacionalChart({
	labels,
	operationalResult,
}: Props) {
	const opColors = useMemo(
		() => operationalResult.map((v) => (v >= 0 ? POS : NEG)),
		[operationalResult],
	);

	const opData = useMemo(
		() => ({
			labels,
			datasets: [
				{
					label: "Resultado",
					data: operationalResult,
					backgroundColor: opColors,
					borderWidth: 0,
					borderRadius: 2,
				},
			],
		}),
		[labels, operationalResult, opColors],
	);

	const opScale = useMemo(() => {
		let min = 0;
		let max = 0;
		for (const v of operationalResult) {
			if (v < min) min = v;
			if (v > max) max = v;
		}
		const pad = Math.max(20000, Math.round((max - min) * 0.12));
		const yMin = Math.floor((min - pad) / 20000) * 20000;
		const yMax = Math.ceil((max + pad) / 20000) * 20000;
		return { min: yMin, max: yMax };
	}, [operationalResult]);

	const commonX = {
		ticks: {
			color: CHART_PAINT.axisText,
			maxRotation: 45,
			minRotation: 45,
			font: { size: 10 },
		},
		grid: { color: CHART_PAINT.grid },
	};

	const opPlugins = useMemo(
		() => ({
			legend: { display: false },
			tooltip: { callbacks: { label: opTooltipLabel } },
		}),
		[],
	);

	return (
		<article className={styles.chartCard}>
			<h3 className={styles.chartTitle}>Resultado operacional mensal</h3>
			<p className={styles.chartSub}>
				Receita − despesas (sem impostos, sem aportes)
			</p>
			<div className={styles.chartCanvas}>
				<Bar
					data={opData}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: opPlugins,
						scales: {
							x: { ...commonX, stacked: false },
							y: {
								min: opScale.min,
								max: opScale.max,
								ticks: {
									color: CHART_PAINT.axisText,
									font: { size: 10 },
									callback: (v) => fmtK(Number(v)),
								},
								grid: {
									color: (ctx) =>
										ctx.tick.value === 0 ? CHART_PAINT.gridEmphasis : CHART_PAINT.grid,
								},
							},
						},
					}}
				/>
			</div>
		</article>
	);
}
