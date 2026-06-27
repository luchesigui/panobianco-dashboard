import { KPI_BAR } from "@/lib/kpis/card-bar-colors";
import {
	abbreviatePeriodLabel,
	formatCompactBrl,
	formatCurrencySignedK,
} from "@/lib/kpis/format";
import { KpiCard } from "@/components/kpis/KpiCard";
import { DeltaPill } from "@/components/kpis/DeltaPill";
import styles from "@/app/kpis/page.module.css";
import type { OverviewKpis } from "../types";

type Props = {
	kpis: OverviewKpis;
	previousPeriodLabel?: string;
};

export function KpiCards({ kpis, previousPeriodLabel }: Props) {
	const vsLabel = abbreviatePeriodLabel(previousPeriodLabel);
	const { baseStudents, salesTotal, revenueTotal, operationalResult } = kpis;

	const salesBarColor =
		salesTotal.deltaPct != null && salesTotal.deltaPct < 0
			? "#a32d2d"
			: KPI_BAR.sales_total;

	return (
		<div className={styles.kpiGrid}>
			<KpiCard accentColor={KPI_BAR.base_students_end}>
				<KpiCard.Title>Base de alunos</KpiCard.Title>
				<KpiCard.MainNumber>
					{baseStudents.value != null
						? `${new Intl.NumberFormat("pt-BR").format(baseStudents.value)}${baseStudents.isPartial ? "*" : ""}`
						: "N/A"}
				</KpiCard.MainNumber>
				{baseStudents.goal != null && (
					<KpiCard.Subdescription>{`Meta: ${baseStudents.goal}`}</KpiCard.Subdescription>
				)}
				<DeltaPill deltaPct={baseStudents.deltaPct} vsLabel={vsLabel} />
			</KpiCard>

			<KpiCard accentColor={salesBarColor}>
				<KpiCard.Title>Vendas no mês</KpiCard.Title>
				<KpiCard.MainNumber>
					{salesTotal.value != null
						? new Intl.NumberFormat("pt-BR").format(salesTotal.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{salesTotal.goal != null && (
					<KpiCard.Subdescription>{`meta: ${salesTotal.goal}`}</KpiCard.Subdescription>
				)}
				<DeltaPill deltaPct={salesTotal.deltaPct} vsLabel={vsLabel} />
			</KpiCard>

			<KpiCard accentColor={KPI_BAR.revenue_total}>
				<KpiCard.Title>Receita total</KpiCard.Title>
				<KpiCard.MainNumber>
					{revenueTotal.value != null ? formatCompactBrl(revenueTotal.value) : "N/A"}
				</KpiCard.MainNumber>
				<DeltaPill deltaPct={revenueTotal.deltaPct} vsLabel={vsLabel} />
			</KpiCard>

			<KpiCard accentColor={KPI_BAR.operational_result}>
				<KpiCard.Title>Resultado operacional</KpiCard.Title>
				<KpiCard.MainNumber>
					{operationalResult.value != null
						? formatCurrencySignedK(operationalResult.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{operationalResult.marginPercent != null && (
					<KpiCard.Subdescription>
						{`margem ${operationalResult.marginPercent.toFixed(1).replace(".", ",")}%${
							operationalResult.isRecord ? " · novo recorde" : ""
						}`}
					</KpiCard.Subdescription>
				)}
				<DeltaPill deltaPct={operationalResult.deltaPct} vsLabel={vsLabel} />
			</KpiCard>
		</div>
	);
}
