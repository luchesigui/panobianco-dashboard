import type { KpiPageData } from "@/lib/data/kpis";
import { Composicao } from "./Composicao";
import { Funnel } from "./Funnel";
import { MonthlySales } from "./MonthlySales";
import { PerformanceBySeller } from "./PerformanceBySeller";
import styles from "./vendas-marketing.module.css";
import { WeeklyView } from "./WeeklyView";
import { SectionInsights } from "../SectionInsights";

type Props = {
	dashboard: KpiPageData["salesMarketingDashboard"];
	leadsGenerated?: number | null;
	salesTotal?: number | null;
	monthlyMarketing?: {
		reach?: number | null;
		frequency?: number | null;
		views?: number | null;
		followers?: number | null;
	} | null;
	previousMonthlyMarketing?: {
		reach?: number | null;
		frequency?: number | null;
		views?: number | null;
		followers?: number | null;
	} | null;
	weeklyInsights?: any[];
	weeklyPeriodId?: string;
	activeWeekHeader: string;
};

export function VendasMarketingCharts({
	dashboard,
	leadsGenerated,
	salesTotal,
	monthlyMarketing,
	previousMonthlyMarketing,
	weeklyInsights,
	weeklyPeriodId,
	activeWeekHeader,
}: Props) {
	const p = dashboard.payload;
	if (!p) return null;

	const hasCurrentWeeklyData = dashboard.primaryPeriodLabel === dashboard.calendarCurrentMonthLabel;

	const dbComparisonTotals = {
		reach: hasCurrentWeeklyData ? (monthlyMarketing?.reach ?? null) : (previousMonthlyMarketing?.reach ?? null),
		frequency: hasCurrentWeeklyData ? (monthlyMarketing?.frequency ?? null) : (previousMonthlyMarketing?.frequency ?? null),
		views: hasCurrentWeeklyData ? (monthlyMarketing?.views ?? null) : (previousMonthlyMarketing?.views ?? null),
		followers: hasCurrentWeeklyData ? (monthlyMarketing?.followers ?? null) : (previousMonthlyMarketing?.followers ?? null),
		scheduled: hasCurrentWeeklyData ? (dashboard.primaryPayload?.funnel.scheduled.value ?? null) : (dashboard.comparisonPayload?.funnel.scheduled.value ?? null),
		attendance: hasCurrentWeeklyData ? (dashboard.primaryPayload?.funnel.present.value ?? null) : (dashboard.comparisonPayload?.funnel.present.value ?? null),
		closings: hasCurrentWeeklyData ? (dashboard.primaryPayload?.funnel.closings.value ?? null) : (dashboard.comparisonPayload?.funnel.closings.value ?? null),
	};

	return (
		<div className={styles.deepRoot}>
			<Composicao composition={p.salesComposition} />
			<Funnel funnel={p.funnel} leadsGenerated={leadsGenerated} />
			<WeeklyView
				weekly={p.weekly}
				funnel={p.funnel}
				weekSourcePeriod={dashboard.weekSourcePeriod}
				calendarCurrentMonthLabel={dashboard.calendarCurrentMonthLabel}
				primaryPeriodLabel={dashboard.primaryPeriodLabel}
				salesTotal={salesTotal}
				monthlyMarketing={monthlyMarketing}
				primaryPayload={dashboard.primaryPayload}
				comparisonPayload={dashboard.comparisonPayload}
				activeWeekHeader={activeWeekHeader}
				comparisonTotalReach={dbComparisonTotals.reach}
				comparisonTotalFrequency={dbComparisonTotals.frequency}
				comparisonTotalViews={dbComparisonTotals.views}
				comparisonTotalFollowers={dbComparisonTotals.followers}
				comparisonTotalScheduled={dbComparisonTotals.scheduled}
				comparisonTotalAttendance={dbComparisonTotals.attendance}
				comparisonTotalClosings={dbComparisonTotals.closings}
			/>
			{weeklyInsights && weeklyPeriodId && (
				<div style={{ marginBottom: "2rem" }}>
					<SectionInsights
						variant="sales_marketing_weekly"
						items={weeklyInsights}
						periodId={weeklyPeriodId}
						weekOfMonth={activeWeekHeader}
					/>
				</div>
			)}
			<div className={styles.bottomGrid}>
				<PerformanceBySeller
					receptionists={p.receptionists}
					receptionistsPeriodLabel={p.receptionistsPeriodLabel}
				/>
				<MonthlySales
					chart={dashboard.monthlySalesChart}
					target={dashboard.salesTarget}
				/>
			</div>
		</div>
	);
}
