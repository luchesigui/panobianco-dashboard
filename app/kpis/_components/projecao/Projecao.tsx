import type { NextMonthForecastPayload } from "@/lib/data/kpis";
import type { InsightItem } from "../SectionInsights";
import styles from "./projecao.module.css";
import { ProjecaoDespesas } from "./ProjecaoDespesas";
import { ProjecaoKpiCards } from "./ProjecaoKpiCards";
import { ProjecaoReceita } from "./ProjecaoReceita";
import { SectionInsights } from "../SectionInsights";

type Props = {
	forecast: NextMonthForecastPayload;
	insights: InsightItem[];
	periodId: string;
};

export function Projecao({ forecast, insights, periodId }: Props) {
	return (
		<div className={styles.root}>
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
				expenseTooltip={forecast.expenseTooltip}
				resultTooltip={forecast.resultTooltip}
				productsTooltip={forecast.productsTooltip}
			/>
			<SectionInsights
				variant="forecast"
				items={insights}
				periodId={periodId}
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
