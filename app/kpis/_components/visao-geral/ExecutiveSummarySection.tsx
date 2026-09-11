"use client";

import type { KpiPageData } from "@/lib/data/kpis";
import { ExecutiveMonthSnapshot } from "./ExecutiveMonthSnapshot";
import { ExecutiveFinancialTrendChart } from "./ExecutiveFinancialTrendChart";
import { ExecutiveStudentsTrendChart } from "./ExecutiveStudentsTrendChart";
import { SectionInsights } from "../SectionInsights";
import styles from "./executive-summary.module.css";

type Props = {
	data: KpiPageData;
};

export function ExecutiveSummarySection({ data }: Props) {
	const { executiveSummary } = data;

	return (
		<div className={styles.sectionWrapper}>
			{/* Camada 1: Visão do Mês com 6 Cards Executivos */}
			<ExecutiveMonthSnapshot
				snapshot={executiveSummary.snapshot}
				previousPeriodLabel={data.previousPeriodLabel}
			/>

			{/* Camada 2: Compilado dos Últimos 6 Meses com 2 Gráficos lado a lado (Opção B) */}
			<div className={styles.chartsGrid}>
				<ExecutiveFinancialTrendChart sixMonths={executiveSummary.sixMonths} />
				<ExecutiveStudentsTrendChart sixMonths={executiveSummary.sixMonths} />
			</div>

			{/* Camada 3: Insights Executivos */}
			<SectionInsights
				variant="overview"
				items={data.insights.overview ?? []}
				periodId={data.kpiDataPeriod}
			/>
		</div>
	);
}
