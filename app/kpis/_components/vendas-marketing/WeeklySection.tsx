import type { KpiPageData } from "@/lib/data/kpis";
import { WeeklyView } from "./WeeklyView";
import { SectionInsights } from "../SectionInsights";
import styles from "./vendas-marketing.module.css";

type Props = {
	dashboard: KpiPageData["salesMarketingDashboard"];
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
	weeklyInsights?: Array<{ type: string; title: string; body: string; meta_json?: any }>;
	weeklyPeriodId?: string;
	activeWeekHeader: string;
	periodParam?: string;
};

export function WeeklySection({
	dashboard,
	salesTotal,
	monthlyMarketing,
	previousMonthlyMarketing,
	weeklyInsights,
	weeklyPeriodId,
	activeWeekHeader,
	periodParam,
}: Props) {
	const p = dashboard.payload;
	if (!p || !p.weekly) {
		return (
			<p className="text-sm text-[color:var(--text-muted)] py-4">
				Nenhum dado semanal registrado para este período.
			</p>
		);
	}

	const hasCurrentWeeklyData = dashboard.primaryPeriodLabel === dashboard.calendarCurrentMonthLabel;

	const dbComparisonTotals = {
		reach: hasCurrentWeeklyData ? (monthlyMarketing?.reach ?? null) : (previousMonthlyMarketing?.reach ?? null),
		frequency: hasCurrentWeeklyData ? (monthlyMarketing?.frequency ?? null) : (previousMonthlyMarketing?.frequency ?? null),
		views: hasCurrentWeeklyData ? (monthlyMarketing?.views ?? null) : (previousMonthlyMarketing?.views ?? null),
		followers: hasCurrentWeeklyData ? (monthlyMarketing?.followers ?? null) : (previousMonthlyMarketing?.followers ?? null),
		scheduled: dashboard.comparisonPayload?.funnel.scheduled.value ?? null,
		attendance: dashboard.comparisonPayload?.funnel.present.value ?? null,
		closings: dashboard.comparisonPayload?.funnel.closings.value ?? null,
	};

	return (
		<div className={styles.deepRoot}>
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
				periodParam={periodParam}
			/>
			{weeklyInsights && weeklyInsights.length > 0 && weeklyPeriodId && (
				<div style={{ marginTop: "1.5rem" }}>
					<SectionInsights
						variant="sales_marketing_weekly"
						items={weeklyInsights}
						periodId={weeklyPeriodId}
						weekOfMonth={activeWeekHeader}
					/>
				</div>
			)}
		</div>
	);
}
