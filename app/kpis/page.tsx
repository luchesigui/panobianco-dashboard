import { getKpiPageData } from "@/lib/data/kpis";
import { getOverviewKpis } from "@/features/overview/parsers/get-kpis";
import { Overview } from "@/features/overview/components";
import { getSalesMarketingMonthlyKpis } from "@/features/sales-marketing/parsers/get-monthly-kpis";
import { SalesAndMarketing } from "@/features/sales-marketing/components";
import { getRetentionKpis } from "@/features/retention/parsers/get-kpis";
import { Retention } from "@/features/retention/components";
import { getFinanceKpis } from "@/features/finance/parsers/get-kpis";
import { Finance } from "@/features/finance/components";
import { Forecast } from "@/features/forecast/components";
import { getRoiKpis } from "@/features/roi/parsers/get-kpis";
import { Roi } from "@/features/roi/components";
import { DashboardHeader } from "./_components/DashboardHeader";
import { MonthSelector } from "./_components/MonthSelector";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function KpisPage() {
	const data = await getKpiPageData();

	const overviewKpis = getOverviewKpis({
		current: data.current,
		previous: data.previous,
		currentMeta: data.currentMeta,
	});

	const salesMarketingKpis = getSalesMarketingMonthlyKpis({
		current: data.current,
		previous: data.previous,
		currentMeta: data.currentMeta,
	});

	const retentionKpis = getRetentionKpis({
		current: data.current,
		previous: data.previous,
		currentMeta: data.currentMeta,
	});

	const financeKpis = getFinanceKpis({
		current: data.current,
		previous: data.previous,
		currentMeta: data.currentMeta,
	});

	const roiKpis = getRoiKpis({
		current: data.current,
		currentMeta: data.currentMeta,
	});

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<div className={styles.headerTop}>
					<DashboardHeader gymName={data.gymName} />
					<MonthSelector monthLabel={data.currentMonthLabel} />
				</div>
			</header>

			<Overview
				data={{
					kpis: overviewKpis,
					periodId: data.kpiDataPeriod,
					periodLabel: data.currentPeriodLabel,
					previousPeriodLabel: data.previousPeriodLabel,
				}}
			/>

			<SalesAndMarketing
				data={{
					monthlyKpis: salesMarketingKpis,
					dashboard: data.salesMarketingDashboard,
					periodId: data.kpiDataPeriod,
					weeklyPeriodId: data.smPrimaryPeriod,
					periodLabel: data.currentPeriodLabel,
					previousPeriodLabel: data.previousPeriodLabel,
					leadsGenerated: data.current["leads_generated"] ?? null,
					salesTotal: data.current["sales_total"] ?? null,
					monthlyMarketing: {
						reach: data.current["marketing_reach"] ?? null,
						frequency: data.current["marketing_frequency"] ?? null,
						views: data.current["marketing_views"] ?? null,
						followers: data.current["marketing_followers"] ?? null,
					},
				}}
			/>

			<Retention
				data={{
					kpis: retentionKpis,
					charts: data.retentionCharts,
					periodId: data.kpiDataPeriod,
					periodLabel: data.currentPeriodLabel,
					previousPeriodLabel: data.previousPeriodLabel,
				}}
			/>

			<Finance
				data={{
					kpis: financeKpis,
					charts: data.financeCharts,
					periodId: data.kpiDataPeriod,
					periodLabel: data.currentPeriodLabel,
					previousPeriodLabel: data.previousPeriodLabel,
				}}
			/>

			<Forecast
				data={{
					forecast: data.nextMonthForecast,
					periodId: data.kpiDataPeriod,
					periodLabel: data.currentPeriodLabel,
				}}
			/>

			<Roi
				data={{
					kpis: roiKpis,
					charts: data.roiCharts,
					periodId: data.kpiDataPeriod,
					periodLabel: data.currentPeriodLabel,
				}}
			/>

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
