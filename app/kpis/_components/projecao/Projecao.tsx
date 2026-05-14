import type { NextMonthForecastPayload } from "@/lib/data/kpis";
import styles from "./projecao.module.css";
import { ProjecaoAnalise } from "./ProjecaoAnalise";
import { ProjecaoDespesas } from "./ProjecaoDespesas";
import { ProjecaoKpiCards } from "./ProjecaoKpiCards";
import { ProjecaoReceita } from "./ProjecaoReceita";

type Props = {
	forecast: NextMonthForecastPayload;
};

export function Projecao({ forecast }: Props) {
	return (
		<div className={styles.root}>
			<h3 className={styles.pageTitle}>
				Previsão de resultado — {forecast.nextPeriodLabel}
			</h3>
			<ProjecaoKpiCards
				revenueForecast={forecast.revenueForecast}
				expenseForecast={forecast.expenseForecast}
				resultForecast={forecast.resultForecast}
				matriculatedForecast={forecast.matriculatedForecast}
				revenueVsBasisPct={forecast.revenueVsBasisPct}
				matriculatedVsBasisPct={forecast.matriculatedVsBasisPct}
				marginPct={forecast.marginPct}
				expenseSubline={forecast.expenseSubline}
				matriculatedSubline={forecast.matriculatedSubline}
				basisPeriodLabel={forecast.basisPeriodLabel}
			/>
			<ProjecaoAnalise
				nextPeriodLabel={forecast.nextPeriodLabel}
				analysis={forecast.analysis}
			/>
			<div className={styles.chartRow}>
				<ProjecaoReceita revenueChart={forecast.revenueChart} />
				<ProjecaoDespesas
					expenseDonut={forecast.expenseDonut}
					expenseForecast={forecast.expenseForecast}
				/>
			</div>
		</div>
	);
}
