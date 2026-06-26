import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { Projecao } from "@/app/kpis/_components/projecao/Projecao";
import styles from "@/app/kpis/page.module.css";
import { getForecastInsights } from "../data-access/get-insights";
import type { ForecastData } from "../types";

export async function Forecast({ data }: { data: ForecastData }) {
	const insights = await getForecastInsights(data.periodId);

	const badge = data.forecast.hasData
		? `Próximo: ${data.forecast.nextPeriodLabel}`
		: data.periodLabel;

	return (
		<SectionCard title="Previsão de resultado" color="pink" iconShort="P" badge={badge}>
			<SectionInsights variant="forecast" items={insights} periodId={data.periodId} />
			{data.forecast.hasData ? (
				<Projecao forecast={data.forecast} />
			) : (
				<p className={styles.subtitle}>
					Dados insuficientes para montar a projeção do mês seguinte.
				</p>
			)}
		</SectionCard>
	);
}
