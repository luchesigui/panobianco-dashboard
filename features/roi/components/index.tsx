import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { RoiCharts } from "@/app/kpis/_components/roi/RoiCharts";
import { getRoiInsights } from "../data-access/get-insights";
import type { RoiData } from "../types";
import { KpiCards } from "./KpiCards";

export async function Roi({ data }: { data: RoiData }) {
	const insights = await getRoiInsights(data.periodId);

	return (
		<SectionCard
			title="Retorno do investimento"
			color="brown"
			iconShort="RI"
			badge="Desde Jul/24"
		>
			<KpiCards kpis={data.kpis} />
			<SectionInsights variant="roi" items={insights} periodId={data.periodId} />
			<RoiCharts charts={data.charts} />
		</SectionCard>
	);
}
