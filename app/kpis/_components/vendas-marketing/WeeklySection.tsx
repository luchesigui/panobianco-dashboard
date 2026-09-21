import type { KpiPageData } from "@/lib/data/kpis";
import { WeeklyView } from "./WeeklyView";
import { SectionInsights } from "../SectionInsights";
import styles from "./vendas-marketing.module.css";

type Props = {
	dashboard: KpiPageData["salesMarketingDashboard"];
	weeklyInsights?: Array<{ type: string; title: string; body: string; meta_json?: any }>;
	activeWeekHeader: string;
	periodParam?: string;
};

export function WeeklySection({
	dashboard,
	weeklyInsights,
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

	return (
		<div className={styles.deepRoot}>
			<WeeklyView
				weekly={p.weekly}
				weekSourcePeriod={dashboard.weekSourcePeriod}
				calendarCurrentMonthLabel={dashboard.calendarCurrentMonthLabel}
				primaryPeriodLabel={dashboard.primaryPeriodLabel}
				comparisonPeriodLabel={dashboard.comparisonPeriodLabel}
				salesTotal={dashboard.primaryMonthly["sales_total"] ?? null}
				comparisonSalesTotal={dashboard.comparisonMonthly["sales_total"] ?? null}
				comparisonPayload={dashboard.comparisonPayload}
				activeWeekHeader={activeWeekHeader}
				periodParam={periodParam}
			/>
			{/* Sempre renderizado: a seção acompanha a semana selecionada e, quando ainda não
			    há insights para ela, oferece o botão de geração com IA. */}
			<div style={{ marginTop: "1.5rem" }}>
				<SectionInsights
					variant="sales_marketing_weekly"
					items={weeklyInsights ?? []}
					periodId={dashboard.primaryPeriodId}
					weekOfMonth={activeWeekHeader}
				/>
			</div>
		</div>
	);
}
