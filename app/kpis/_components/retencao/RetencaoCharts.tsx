import type { RetentionChartPayload } from "@/lib/data/kpis";
import { EvolucaoBaseDeAlunos } from "./EvolucaoBaseDeAlunos";
import { Inadimplencia } from "./Inadimplencia";
import styles from "./retencao-charts.module.css";

type Props = {
	charts: RetentionChartPayload;
};

export function RetencaoCharts({ charts }: Props) {
	return (
		<div className={styles.chartRow}>
			<EvolucaoBaseDeAlunos
				chartLabels={charts.chartLabels}
				baseHistoric={charts.baseHistoric}
				baseProjection={charts.baseProjection}
				baseGoalLine={charts.baseGoalLine}
			/>
			<Inadimplencia inadimplencia={charts.inadimplencia} />
		</div>
	);
}
