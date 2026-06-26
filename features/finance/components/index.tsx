import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { FinanceiroCharts } from "@/app/kpis/_components/financeiro/FinanceiroCharts";
import { abbreviatePeriodLabel } from "@/lib/kpis/format";
import { getFinanceInsights } from "../data-access/get-insights";
import type { FinanceData } from "../types";
import { KpiCards } from "./KpiCards";

export async function Finance({ data }: { data: FinanceData }) {
	const insights = await getFinanceInsights(data.periodId);
	const vsLabel = abbreviatePeriodLabel(data.previousPeriodLabel);

	return (
		<SectionCard title="Financeiro" color="purple" iconShort="F" badge={data.periodLabel}>
			<KpiCards kpis={data.kpis} vsLabel={vsLabel} />
			<SectionInsights variant="finance" items={insights} periodId={data.periodId} />
			<FinanceiroCharts charts={data.charts} />
		</SectionCard>
	);
}
