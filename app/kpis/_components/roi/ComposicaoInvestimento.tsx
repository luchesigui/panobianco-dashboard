"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import styles from "./roi-charts.module.css";

ChartJS.register(ArcElement, Legend, Tooltip);

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
	composition: Array<{ label: string; value: number; color: string }>;
};

export function ComposicaoInvestimento({ composition }: Props) {
	const doughnutData = useMemo(
		() => ({
			labels: composition.map((c) => c.label),
			datasets: [
				{
					data: composition.map((c) => c.value),
					backgroundColor: composition.map((c) => c.color),
					borderWidth: 2,
					borderColor: "#fff",
				},
			],
		}),
		[composition],
	);

	const doughnutOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			cutout: "62%",
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (ctx: { parsed: number; label: string }) => {
							const v = ctx.parsed;
							return `${ctx.label}: ${fmtKFull(v)}`;
						},
					},
				},
			},
		}),
		[],
	);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartTitle}>Composição do investimento</h3>
			<p className={styles.chartSub}>Pré-inauguração (Jul/24 a Mar/25)</p>
			<div className={styles.chartCanvasDonut}>
				<Doughnut data={doughnutData} options={doughnutOptions} />
			</div>
			<div className={styles.donutLegend}>
				{composition.map((c) => (
					<span key={c.label} className={styles.legendItem}>
						<span className={styles.legendDot} style={{ background: c.color }} />
						{c.label} ({fmtKShort(c.value)})
					</span>
				))}
			</div>
		</div>
	);
}
