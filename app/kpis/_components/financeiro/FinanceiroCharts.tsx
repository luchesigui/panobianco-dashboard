import type { FinanceChartPayload } from "@/lib/data/kpis";
import styles from "./financeiro-charts.module.css";
import { ReceitaPorComposicao } from "./ReceitaPorComposicao";
import { ResultadoOperacionalChart } from "./ResultadoOperacionalChart";

type Props = {
	charts: FinanceChartPayload;
};

export function FinanceiroCharts({ charts }: Props) {
	if (!charts.labels.length) return null;
	return (
		<div className={styles.root}>
			<div className={styles.chartRow}>
				<ReceitaPorComposicao
					labels={charts.labels}
					stacked={charts.stacked}
				/>
				<ResultadoOperacionalChart
					labels={charts.labels}
					operationalResult={charts.operationalResult}
				/>
			</div>
		</div>
	);
}
