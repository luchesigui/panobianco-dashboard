"use client";

import {
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
	type Chart,
} from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { CHART_COLOR, CHART_PAINT } from "@/lib/kpis/card-bar-colors";
import styles from "./retencao-charts.module.css";

ChartJS.register(
	CategoryScale,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Tooltip,
);

function baseGoalLinePlugin(goal: number) {
	return {
		id: "retentionBaseGoalLine",
		afterDraw(chart: Chart) {
			const yScale = chart.scales.y;
			const xScale = chart.scales.x;
			if (!yScale || !xScale) return;
			const py = yScale.getPixelForValue(goal);
			if (!Number.isFinite(py)) return;
			const left = xScale.left;
			const right = xScale.right;
			const ctx = chart.ctx;
			ctx.save();
			ctx.setLineDash([5, 4]);
			ctx.lineWidth = 1;
			ctx.strokeStyle = CHART_COLOR.secondary;
			ctx.beginPath();
			ctx.moveTo(left, py);
			ctx.lineTo(right, py);
			ctx.stroke();
			ctx.fillStyle = CHART_COLOR.secondary;
			ctx.font = "500 10px DM Sans, system-ui, sans-serif";
			ctx.fillText(String(goal), right - 28, py - 4);
			ctx.restore();
		},
	};
}

function fmtInt(n: number): string {
	return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
}

type Props = {
	chartLabels: string[];
	baseHistoric: (number | null)[];
	baseProjection: (number | null)[];
	baseGoalLine: number;
};

export function EvolucaoBaseDeAlunos({
	chartLabels,
	baseHistoric,
	baseProjection,
	baseGoalLine,
}: Props) {
	const lineData = useMemo(
		() => ({
			labels: chartLabels,
			datasets: [
				{
					label: "Histórico",
					data: baseHistoric,
					borderColor: CHART_COLOR.neutral,
					backgroundColor: CHART_PAINT.historicFill,
					borderWidth: 2,
					tension: 0.3,
					spanGaps: false,
					fill: true,
					pointRadius: 2,
					pointBackgroundColor: CHART_COLOR.neutral,
				},
				{
					label: "Projeção",
					data: baseProjection,
					borderColor: CHART_COLOR.primary,
					backgroundColor: CHART_PAINT.projectionFill,
					borderWidth: 2.5,
					borderDash: [4, 3],
					tension: 0.3,
					spanGaps: false,
					fill: true,
					pointRadius: 3,
					pointBackgroundColor: CHART_PAINT.canvasSurface,
					pointBorderColor: CHART_COLOR.primary,
					pointBorderWidth: 2,
				},
			],
		}),
		[baseHistoric, baseProjection, chartLabels],
	);

	const lineOptions = useMemo(() => {
		const maxY = Math.max(
			baseGoalLine * 1.08,
			...baseHistoric.filter((v): v is number => v != null),
			...baseProjection.filter((v): v is number => v != null),
		);
		const yMax = Math.ceil(maxY / 50) * 50;
		return {
			responsive: true,
			maintainAspectRatio: false,
			layout: { padding: { top: 4, right: 6, bottom: 0, left: 0 } },
			interaction: { mode: "index" as const, intersect: false },
			plugins: {
				legend: { display: false },
				tooltip: {
					filter: (item: { parsed: { y: number | null } }) =>
						item.parsed.y != null && !Number.isNaN(item.parsed.y),
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
					max: yMax,
					ticks: {
						color: CHART_PAINT.axisText,
						font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
						callback: (v: string | number) => fmtInt(Number(v)),
					},
					grid: { color: CHART_PAINT.grid },
					border: { display: false },
				},
			},
		};
	}, [baseGoalLine, baseHistoric, baseProjection]);

	const linePlugins = useMemo(
		() => [baseGoalLinePlugin(baseGoalLine)],
		[baseGoalLine],
	);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartTitle}>Evolução da base de alunos</h3>
			<p className={styles.chartSub}>Histórico + projeção com ações</p>
			<div className={styles.legendRow}>
				<span className={styles.legendItem}>
					<span className={styles.legendDot} style={{ background: CHART_COLOR.neutral }} />
					Histórico
				</span>
				<span className={styles.legendItem}>
					<span className={styles.legendDot} style={{ background: CHART_COLOR.primary }} />
					Projeção
				</span>
			</div>
			<div className={styles.chartCanvas}>
				<Line data={lineData} options={lineOptions} plugins={linePlugins} />
			</div>
		</div>
	);
}
