import type { MonthlySalesBar } from "@/lib/data/sales-marketing-dashboard";
import { MonthlySalesBarChart } from "../../MonthlySalesBarChart";
import styles from "./vendas-marketing.module.css";

type Props = {
	chart: MonthlySalesBar[];
	target: number;
};

export function MonthlySales({ chart, target }: Props) {
	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartCardTitle}>Vendas mensais</h3>
			<p className={styles.chartSub}>Novos alunos por mês</p>
			{chart.length === 0 ? (
				<p className={styles.chartEmpty}>Sem histórico de vendas no período.</p>
			) : (
				<div className={styles.monthlySalesChartBlock}>
					<MonthlySalesBarChart chart={chart} target={target} />
					<p className={styles.chartLegend}>
						Linha tracejada: meta {target} vendas/mês
					</p>
				</div>
			)}
		</div>
	);
}
