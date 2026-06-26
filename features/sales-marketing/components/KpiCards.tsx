import { SALES_VM_BAR } from "@/lib/kpis/card-bar-colors";
import { formatValue } from "@/lib/kpis/format";
import { DeltaPill } from "@/components/kpis/DeltaPill";
import styles from "@/app/kpis/page.module.css";
import type { SalesMarketingMonthlyKpis, SmKpiCard } from "../types";

type Props = {
	kpis: SalesMarketingMonthlyKpis;
	vsLabel: string | undefined;
};

export function KpiCards({ kpis, vsLabel }: Props) {
	const { salesTotal, noShowRate, presentConversionRate, leadsGenerated, avgTicket, cacPerSale, metaAdsInvestment, instagramTotalReach } = kpis;

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Vendas totais</span>
				<p className={styles.kpiValue}>
					{salesTotal.value != null
						? new Intl.NumberFormat("pt-BR").format(salesTotal.value)
						: "N/A"}
				</p>
				{salesTotal.goal != null && salesTotal.goalPct != null && (
					<p className={styles.kpiMetaLine}>
						{`Meta ${salesTotal.goal} (${salesTotal.goalPct}%)`}
					</p>
				)}
				<DeltaPill deltaPct={salesTotal.deltaPct} overrideDeltaPct={salesTotal.overrideDeltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: SALES_VM_BAR.sales_total }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>No-show experimental</span>
				<p className={styles.kpiValue}>
					{noShowRate.value != null ? `${noShowRate.value.toFixed(0)}%` : "N/A"}
				</p>
				{noShowRate.detailLine && (
					<p className={styles.kpiMetaLine}>{noShowRate.detailLine}</p>
				)}
				<DeltaPill deltaPct={noShowRate.deltaPct} overrideDeltaPct={noShowRate.overrideDeltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: SALES_VM_BAR.no_show_rate }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Conversão presentes</span>
				<p className={styles.kpiValue}>
					{presentConversionRate.value != null
						? `${presentConversionRate.value.toFixed(0)}%`
						: "N/A"}
				</p>
				{presentConversionRate.detailLine && (
					<p className={styles.kpiMetaLine}>{presentConversionRate.detailLine}</p>
				)}
				<DeltaPill deltaPct={presentConversionRate.deltaPct} overrideDeltaPct={presentConversionRate.overrideDeltaPct} vsLabel={vsLabel} />
				<div
					className={styles.kpiBar}
					style={{ background: SALES_VM_BAR.present_conversion_rate }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Leads gerados</span>
				<p className={styles.kpiValue}>
					{leadsGenerated.value != null
						? new Intl.NumberFormat("pt-BR").format(leadsGenerated.value)
						: "N/A"}
				</p>
				<DeltaPill deltaPct={leadsGenerated.deltaPct} overrideDeltaPct={leadsGenerated.overrideDeltaPct} vsLabel={vsLabel} />
				<div
					className={styles.kpiBar}
					style={{ background: SALES_VM_BAR.leads_generated }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Ticket médio</span>
				<p className={styles.kpiValue}>{formatValue(avgTicket.value ?? undefined, "currency")}</p>
				{avgTicket.metaLine && (
					<p className={styles.kpiMetaLine}>{avgTicket.metaLine}</p>
				)}
				{avgTicket.breakdownLine && (
					<p className={styles.kpiMetaLine}>{avgTicket.breakdownLine}</p>
				)}
				<DeltaPill deltaPct={avgTicket.deltaPct} overrideDeltaPct={avgTicket.overrideDeltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: SALES_VM_BAR.avg_ticket }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>CAC por venda</span>
				<p className={styles.kpiValue}>{formatValue(cacPerSale.value ?? undefined, "currency")}</p>
				{cacPerSale.detailLine && (
					<p className={styles.kpiMetaLine}>{cacPerSale.detailLine}</p>
				)}
				<DeltaPill deltaPct={cacPerSale.deltaPct} overrideDeltaPct={cacPerSale.overrideDeltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: SALES_VM_BAR.cac_per_sale }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Investimento Meta Ads</span>
				<p className={styles.kpiValue}>
					{formatValue(metaAdsInvestment.value ?? undefined, "currency")}
				</p>
				{metaAdsInvestment.detailLine && (
					<p className={styles.kpiMetaLine}>{metaAdsInvestment.detailLine}</p>
				)}
				<DeltaPill deltaPct={metaAdsInvestment.deltaPct} overrideDeltaPct={metaAdsInvestment.overrideDeltaPct} vsLabel={vsLabel} />
				<div
					className={styles.kpiBar}
					style={{ background: SALES_VM_BAR.meta_ads_investment }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Alcance total</span>
				<p className={styles.kpiValue}>
					{instagramTotalReach.value != null
						? new Intl.NumberFormat("pt-BR").format(instagramTotalReach.value)
						: "N/A"}
				</p>
				{instagramTotalReach.detailLine && (
					<p className={styles.kpiMetaLine}>{instagramTotalReach.detailLine}</p>
				)}
				<DeltaPill deltaPct={instagramTotalReach.deltaPct} overrideDeltaPct={instagramTotalReach.overrideDeltaPct} vsLabel={vsLabel} />
				<div
					className={styles.kpiBar}
					style={{ background: SALES_VM_BAR.instagram_total_reach ?? "#534ab7" }}
				/>
			</article>
		</div>
	);
}
