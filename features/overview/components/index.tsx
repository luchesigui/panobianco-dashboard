import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { getOverviewInsights } from "../data-access/get-insights";
import type { OverviewData } from "../types";
import { KpiCards } from "./KpiCards";

export async function Overview({ data }: { data: OverviewData }) {
	const insights = await getOverviewInsights(data.periodId);

	return (
		<SectionCard title="Visão geral" color="green" iconShort="VG" badge={data.periodLabel}>
			<KpiCards kpis={data.kpis} previousPeriodLabel={data.previousPeriodLabel} />
			<SectionInsights variant="overview" items={insights} periodId={data.periodId} />
		</SectionCard>
	);
}
