import type { RoiChartPayload } from "@/lib/data/kpis";
import { ComposicaoInvestimento } from "./ComposicaoInvestimento";
import styles from "./roi-charts.module.css";
import { SaldoRecuperar } from "./SaldoRecuperar";

type Props = {
	charts: RoiChartPayload;
};

export function RoiCharts({ charts }: Props) {
	return (
		<div className={styles.root}>
			<div className={styles.chartRow}>
				<ComposicaoInvestimento composition={charts.composition} />
				<SaldoRecuperar recoveryEvolution={charts.recoveryEvolution} />
			</div>
		</div>
	);
}
