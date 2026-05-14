import { getKpiPageData } from "@/lib/data/kpis";
import { FinanceiroCardGrid } from "./_components/cards/FinanceiroCardGrid";
import { RetencaoCardGrid } from "./_components/cards/RetencaoCardGrid";
import { RoiCardGrid } from "./_components/cards/RoiCardGrid";
import { VendasMarketingCardGrid } from "./_components/cards/VendasMarketingCardGrid";
import { VisaoGeralCardGrid } from "./_components/cards/VisaoGeralCardGrid";
import { DashboardHeader } from "./_components/DashboardHeader";
import { MonthSelector } from "./_components/MonthSelector";
import { SectionCard } from "./_components/SectionCard";
import { SectionInsights } from "./_components/SectionInsights";
import { FinanceiroCharts } from "./_components/financeiro/FinanceiroCharts";
import { Projecao } from "./_components/projecao/Projecao";
import { RetencaoCharts } from "./_components/retencao/RetencaoCharts";
import { RoiCharts } from "./_components/roi/RoiCharts";
import { VendasMarketingCharts } from "./_components/vendas-marketing/VendasMarketingCharts";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function KpisPage() {
	const data = await getKpiPageData();
	const smPrimaryShort = data.salesMarketingDashboard.primaryPeriodLabel;

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<div className={styles.headerTop}>
					<DashboardHeader gymName={data.gymName} />
					<MonthSelector monthLabel={data.currentMonthLabel} />
				</div>
			</header>

			<SectionCard
				title="Visão geral"
				color="green"
				iconShort="VG"
				badge={data.currentPeriodLabel}
			>
				<VisaoGeralCardGrid data={data} />
				<SectionInsights
					variant="overview"
					items={data.insights.overview ?? []}
				/>
			</SectionCard>

			<SectionCard
				title="Vendas e marketing"
				color="blue"
				iconShort="VM"
				badge={smPrimaryShort}
			>
				<VendasMarketingCardGrid data={data} />
				<SectionInsights
					variant="sales_marketing"
					items={data.insights.sales_marketing ?? []}
				/>
				{data.salesMarketingDashboard.payload ? (
					<VendasMarketingCharts
						dashboard={data.salesMarketingDashboard}
						leadsGenerated={data.current["leads_generated"] ?? null}
						salesTotal={data.current["sales_total"] ?? null}
						monthlyMarketing={{
							reach: data.current["marketing_reach"] ?? null,
							frequency: data.current["marketing_frequency"] ?? null,
							views: data.current["marketing_views"] ?? null,
							followers: data.current["marketing_followers"] ?? null,
						}}
					/>
				) : null}
			</SectionCard>

			<SectionCard
				title="Retenção"
				color="orange"
				iconShort="R"
				badge={data.currentPeriodLabel}
			>
				<RetencaoCardGrid data={data} />
				<SectionInsights
					variant="retention"
					items={data.insights.retention ?? []}
				/>
				<RetencaoCharts charts={data.retentionCharts} />
			</SectionCard>

			<SectionCard
				title="Financeiro"
				color="purple"
				iconShort="F"
				badge={data.currentPeriodLabel}
			>
				<FinanceiroCardGrid data={data} />
				<SectionInsights
					variant="finance"
					items={data.insights.finance ?? []}
				/>
				<FinanceiroCharts charts={data.financeCharts} />
			</SectionCard>

			<SectionCard
				title="Previsão de resultado"
				color="pink"
				iconShort="P"
				badge={
					data.nextMonthForecast.hasData
						? `Próximo: ${data.nextMonthForecast.nextPeriodLabel}`
						: data.currentPeriodLabel
				}
			>
				<SectionInsights
					variant="forecast"
					items={data.insights.forecast ?? []}
				/>
				{data.nextMonthForecast.hasData ? (
					<Projecao forecast={data.nextMonthForecast} />
				) : (
					<p className={styles.subtitle}>
						Dados insuficientes para montar a projeção do mês seguinte.
					</p>
				)}
			</SectionCard>

			<SectionCard
				title="Retorno do investimento"
				color="brown"
				iconShort="RI"
				badge="Desde Jul/24"
			>
				<RoiCardGrid data={data} />
				<SectionInsights variant="roi" items={data.insights.roi ?? []} />
				<RoiCharts charts={data.roiCharts} />
			</SectionCard>

			{data.featureOfMonth && (
				<section className={styles.sectionPlain}>
					<div className={styles.feature}>
						<h2>{data.featureOfMonth.title}</h2>
						<p>{data.featureOfMonth.description}</p>
						{data.featureOfMonth.status ? (
							<p className={styles.featureMeta}>
								Status: {data.featureOfMonth.status}
							</p>
						) : null}
						<div className={styles.impactList}>
							{Object.entries(data.featureOfMonth.impact).map(([key, value]) => (
								<span key={key}>
									{key}: {value}
								</span>
							))}
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
