import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { RetencaoCharts } from "@/app/kpis/_components/retencao/RetencaoCharts";
import { getRetentionInsights } from "../data-access/get-insights";
import type { RetentionData } from "../types";
import { KpiCards } from "./KpiCards";

export async function Retention({ data }: { data: RetentionData }) {
	const insights = await getRetentionInsights(data.periodId);

	return (
		<SectionCard title="Retenção" color="orange" iconShort="R" badge={data.periodLabel}>
			<KpiCards kpis={data.kpis} previousPeriodLabel={data.previousPeriodLabel} />
			<SectionInsights variant="retention" items={insights} periodId={data.periodId} />
			<RetencaoCharts charts={data.charts} />
		</SectionCard>
	);
}
