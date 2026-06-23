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
	weeklyInsights?: any[];
	weeklyPeriodId?: string;
};

export function VendasMarketingCharts({
	dashboard,
	leadsGenerated,
	salesTotal,
	monthlyMarketing,
	weeklyInsights,
	weeklyPeriodId,
}: Props) {
	const p = dashboard.payload;
	if (!p) return null;

	return (
		<div className={styles.deepRoot}>
			<Composicao composition={p.salesComposition} />
			<Funnel funnel={p.funnel} leadsGenerated={leadsGenerated} />
			<WeeklyView
				weekly={p.weekly}
				funnel={p.funnel}
				weekSourcePeriod={dashboard.weekSourcePeriod}
				calendarCurrentMonthLabel={dashboard.calendarCurrentMonthLabel}
				salesTotal={salesTotal}
				monthlyMarketing={monthlyMarketing}
				primaryPayload={dashboard.primaryPayload}
				comparisonPayload={dashboard.comparisonPayload}
			/>
			{weeklyInsights && weeklyPeriodId && (
				<div style={{ marginBottom: "2rem" }}>
					<SectionInsights
						variant="sales_marketing_weekly"
						items={weeklyInsights}
						periodId={weeklyPeriodId}
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
