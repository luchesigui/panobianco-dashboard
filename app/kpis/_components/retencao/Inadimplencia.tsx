"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import styles from "./retencao-charts.module.css";

ChartJS.register(ArcElement, Legend, Tooltip);

function fmtInt(n: number): string {
	return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
}

type Props = {
	inadimplencia: {
		titleSuffix: string;
		recordCount: number;
		recovered: number;
		open: number;
		cancelled: number;
		valueRecovered: number;
		valueOpen: number;
	};
};

export function Inadimplencia({ inadimplencia: inad }: Props) {
	const doughnutData = useMemo(
		() => ({
			labels: ["Recuperados", "Em aberto", "Canceladas"],
			datasets: [
				{
					data: [inad.recovered, inad.open, inad.cancelled],
					backgroundColor: ["#0f6e56", "#d85a30", "#b4b2a9"],
					borderWidth: 2,
					borderColor: "#fff",
				},
			],
		}),
		[inad.cancelled, inad.open, inad.recovered],
	);

	const doughnutOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			cutout: "65%",
			plugins: {
				legend: { display: false },
				tooltip: {
					callbacks: {
						label: (ctx: { parsed: number; label: string }) => {
							const v = ctx.parsed;
							return `${ctx.label}: ${fmtInt(v)}`;
						},
					},
				},
			},
		}),
		[],
	);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartTitle}>
				Inadimplência — {inad.titleSuffix.toLowerCase()}
			</h3>
			<p className={styles.chartSub}>
				{fmtInt(inad.recordCount)} registros no mês
			</p>
			<div className={styles.chartCanvasDonut}>
				<Doughnut data={doughnutData} options={doughnutOptions} />
			</div>
			<div className={styles.donutLegend}>
				<span className={styles.legendItem}>
					<span className={styles.legendDot} style={{ background: "#0f6e56" }} />
					Recuperados {fmtInt(inad.recovered)} (R$ {fmtInt(inad.valueRecovered)})
				</span>
				<span className={styles.legendItem}>
					<span className={styles.legendDot} style={{ background: "#d85a30" }} />
					Em aberto {fmtInt(inad.open)} (R$ {fmtInt(inad.valueOpen)})
				</span>
				<span className={styles.legendItem}>
					<span className={styles.legendDot} style={{ background: "#b4b2a9" }} />
					Canceladas {fmtInt(inad.cancelled)}
				</span>
			</div>
		</div>
	);
}
