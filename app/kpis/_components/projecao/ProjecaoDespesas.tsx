"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import styles from "./projecao.module.css";

ChartJS.register(ArcElement, Legend, Tooltip);

type Props = {
	expenseDonut: Array<{ label: string; value: number; color: string }>;
	expenseForecast: number;
};

export function ProjecaoDespesas({ expenseDonut, expenseForecast }: Props) {
	const doughnutData = useMemo(
		() => ({
			labels: expenseDonut.map((c) => c.label),
			datasets: [
				{
					data: expenseDonut.map((c) => c.value),
					backgroundColor: expenseDonut.map((c) => c.color),
					borderWidth: 2,
					borderColor: "#fff",
				},
			],
		}),
		[expenseDonut],
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
							return `${ctx.label}: ${new Intl.NumberFormat("pt-BR", {
								style: "currency",
								currency: "BRL",
								maximumFractionDigits: 0,
							}).format(v)}`;
						},
					},
				},
			},
		}),
		[],
	);

	return (
		<article className={styles.chartCard}>
			<h4 className={styles.chartTitle}>Despesa prevista — método</h4>
			<p className={styles.chartSub}>
				Distribuição ilustrativa proporcional ao total projetado
			</p>
			<div className={styles.chartCanvas}>
				<Doughnut data={doughnutData} options={doughnutOptions} />
			</div>
			<div className={styles.donutLegend}>
				{expenseDonut.map((row) => (
					<div key={row.label} className={styles.legendRow}>
						<span
							className={styles.legendSwatch}
							style={{ background: row.color }}
							aria-hidden
						/>
						<span>
							{row.label} ·{" "}
							{new Intl.NumberFormat("pt-BR", {
								style: "percent",
								maximumFractionDigits: 0,
							}).format(row.value / expenseForecast)}
						</span>
					</div>
				))}
			</div>
		</article>
	);
}
