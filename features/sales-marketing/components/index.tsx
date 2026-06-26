import { SectionCard } from "@/app/kpis/_components/SectionCard";
import { SectionInsights } from "@/app/kpis/_components/SectionInsights";
import { VendasMarketingCharts } from "@/app/kpis/_components/vendas-marketing/VendasMarketingCharts";
import { abbreviatePeriodLabel } from "@/lib/kpis/format";
import {
	getSalesMarketingInsights,
	getSalesMarketingWeeklyInsights,
} from "../data-access/get-insights";
import type { SalesMarketingData } from "../types";
import { KpiCards } from "./KpiCards";

export async function SalesAndMarketing({ data }: { data: SalesMarketingData }) {
	const [monthlyInsights, weeklyInsights] = await Promise.all([
		getSalesMarketingInsights(data.periodId),
		getSalesMarketingWeeklyInsights(data.weeklyPeriodId),
	]);

	const vsLabel =
		data.dashboard.comparisonPeriodLabel ?? abbreviatePeriodLabel(data.previousPeriodLabel);

	return (
		<SectionCard
			title="Vendas e marketing"
			color="blue"
			iconShort="VM"
			badge={data.dashboard.primaryPeriodLabel}
		>
			<KpiCards kpis={data.monthlyKpis} vsLabel={vsLabel} />
			<SectionInsights
				variant="sales_marketing"
				items={monthlyInsights}
				periodId={data.periodId}
			/>
			{data.dashboard.payload ? (
				<VendasMarketingCharts
					dashboard={data.dashboard}
					leadsGenerated={data.leadsGenerated}
					salesTotal={data.salesTotal}
					monthlyMarketing={data.monthlyMarketing}
					weeklyInsights={weeklyInsights}
					weeklyPeriodId={data.weeklyPeriodId}
				/>
			) : null}
		</SectionCard>
	);
}
