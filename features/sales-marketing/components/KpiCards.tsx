import { SALES_VM_BAR } from "@/lib/kpis/card-bar-colors";
import { formatValue } from "@/lib/kpis/format";
import { KpiCard } from "@/components/kpis/KpiCard";
import { DeltaPill } from "@/components/kpis/DeltaPill";
import styles from "@/app/kpis/page.module.css";
import type { SalesMarketingMonthlyKpis } from "../types";

type Props = {
	kpis: SalesMarketingMonthlyKpis;
	vsLabel: string | undefined;
};

export function KpiCards({ kpis, vsLabel }: Props) {
	const {
		salesTotal,
		noShowRate,
		presentConversionRate,
		leadsGenerated,
		avgTicket,
		cacPerSale,
		metaAdsInvestment,
		instagramTotalReach,
	} = kpis;

	return (
		<div className={styles.kpiGrid}>
			<KpiCard accentColor={SALES_VM_BAR.sales_total}>
				<KpiCard.Title>Vendas totais</KpiCard.Title>
				<KpiCard.MainNumber>
					{salesTotal.value != null
						? new Intl.NumberFormat("pt-BR").format(salesTotal.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{salesTotal.goal != null && salesTotal.goalPct != null && (
					<KpiCard.Subdescription>
						{`Meta ${salesTotal.goal} (${salesTotal.goalPct}%)`}
					</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={salesTotal.deltaPct}
					overrideDeltaPct={salesTotal.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.no_show_rate}>
				<KpiCard.Title>No-show experimental</KpiCard.Title>
				<KpiCard.MainNumber>
					{noShowRate.value != null ? `${noShowRate.value.toFixed(0)}%` : "N/A"}
				</KpiCard.MainNumber>
				{noShowRate.detailLine && (
					<KpiCard.Subdescription>{noShowRate.detailLine}</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={noShowRate.deltaPct}
					overrideDeltaPct={noShowRate.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.present_conversion_rate}>
				<KpiCard.Title>Conversão presentes</KpiCard.Title>
				<KpiCard.MainNumber>
					{presentConversionRate.value != null
						? `${presentConversionRate.value.toFixed(0)}%`
						: "N/A"}
				</KpiCard.MainNumber>
				{presentConversionRate.detailLine && (
					<KpiCard.Subdescription>
						{presentConversionRate.detailLine}
					</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={presentConversionRate.deltaPct}
					overrideDeltaPct={presentConversionRate.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.leads_generated}>
				<KpiCard.Title>Leads gerados</KpiCard.Title>
				<KpiCard.MainNumber>
					{leadsGenerated.value != null
						? new Intl.NumberFormat("pt-BR").format(leadsGenerated.value)
						: "N/A"}
				</KpiCard.MainNumber>
				<DeltaPill
					deltaPct={leadsGenerated.deltaPct}
					overrideDeltaPct={leadsGenerated.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.avg_ticket}>
				<KpiCard.Title>Ticket médio</KpiCard.Title>
				<KpiCard.MainNumber>
					{formatValue(avgTicket.value ?? undefined, "currency")}
				</KpiCard.MainNumber>
				{avgTicket.metaLine && (
					<KpiCard.Subdescription>{avgTicket.metaLine}</KpiCard.Subdescription>
				)}
				{avgTicket.breakdownLine && (
					<KpiCard.Subdescription>{avgTicket.breakdownLine}</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={avgTicket.deltaPct}
					overrideDeltaPct={avgTicket.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.cac_per_sale}>
				<KpiCard.Title>CAC por venda</KpiCard.Title>
				<KpiCard.MainNumber>
					{formatValue(cacPerSale.value ?? undefined, "currency")}
				</KpiCard.MainNumber>
				{cacPerSale.detailLine && (
					<KpiCard.Subdescription>{cacPerSale.detailLine}</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={cacPerSale.deltaPct}
					overrideDeltaPct={cacPerSale.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.meta_ads_investment}>
				<KpiCard.Title>Investimento Meta Ads</KpiCard.Title>
				<KpiCard.MainNumber>
					{formatValue(metaAdsInvestment.value ?? undefined, "currency")}
				</KpiCard.MainNumber>
				{metaAdsInvestment.detailLine && (
					<KpiCard.Subdescription>
						{metaAdsInvestment.detailLine}
					</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={metaAdsInvestment.deltaPct}
					overrideDeltaPct={metaAdsInvestment.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>

			<KpiCard accentColor={SALES_VM_BAR.instagram_total_reach ?? "#534ab7"}>
				<KpiCard.Title>Alcance total</KpiCard.Title>
				<KpiCard.MainNumber>
					{instagramTotalReach.value != null
						? new Intl.NumberFormat("pt-BR").format(instagramTotalReach.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{instagramTotalReach.detailLine && (
					<KpiCard.Subdescription>
						{instagramTotalReach.detailLine}
					</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={instagramTotalReach.deltaPct}
					overrideDeltaPct={instagramTotalReach.overrideDeltaPct}
					vsLabel={vsLabel}
				/>
			</KpiCard>
		</div>
	);
}
