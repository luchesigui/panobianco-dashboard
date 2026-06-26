import { clsx } from "clsx";
import { KPI_BAR } from "@/lib/kpis/card-bar-colors";
import {
	abbreviatePeriodLabel,
	formatCompactBrl,
	formatCurrencySignedK,
	formatDeltaPill,
} from "@/lib/kpis/format";
import styles from "@/app/kpis/page.module.css";
import type { OverviewKpis } from "../types";

type DeltaPillProps = {
	deltaPct: number | null;
	vsLabel: string | undefined;
};

function DeltaPill({ deltaPct, vsLabel }: DeltaPillProps) {
	if (deltaPct == null) return null;
	const label = formatDeltaPill(deltaPct, false);
	const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
	const cls = clsx(styles.kpiDelta, {
		[styles.deltaUp]: deltaPct > 0,
		[styles.deltaDown]: deltaPct < 0,
		[styles.deltaNeutral]: deltaPct === 0,
	});
	return (
		<div className={styles.kpiSub}>
			<span className={cls}>
				{label}
				{tail}
			</span>
		</div>
	);
}

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
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Base de alunos</span>
				<p className={styles.kpiValue}>
					{baseStudents.value != null
						? `${new Intl.NumberFormat("pt-BR").format(baseStudents.value)}${baseStudents.isPartial ? "*" : ""}`
						: "N/A"}
				</p>
				{baseStudents.goal != null && (
					<p className={styles.kpiMetaLine}>{`Meta: ${baseStudents.goal}`}</p>
				)}
				<DeltaPill deltaPct={baseStudents.deltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: KPI_BAR.base_students_end }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Vendas no mês</span>
				<p className={styles.kpiValue}>
					{salesTotal.value != null
						? new Intl.NumberFormat("pt-BR").format(salesTotal.value)
						: "N/A"}
				</p>
				{salesTotal.goal != null && (
					<p className={styles.kpiMetaLine}>{`meta: ${salesTotal.goal}`}</p>
				)}
				<DeltaPill deltaPct={salesTotal.deltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: salesBarColor }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita total</span>
				<p className={styles.kpiValue}>
					{revenueTotal.value != null ? formatCompactBrl(revenueTotal.value) : "N/A"}
				</p>
				<DeltaPill deltaPct={revenueTotal.deltaPct} vsLabel={vsLabel} />
				<div className={styles.kpiBar} style={{ background: KPI_BAR.revenue_total }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Resultado operacional</span>
				<p className={styles.kpiValue}>
					{operationalResult.value != null
						? formatCurrencySignedK(operationalResult.value)
						: "N/A"}
				</p>
				{operationalResult.marginPercent != null && (
					<p className={styles.kpiMetaLine}>
						{`margem ${operationalResult.marginPercent.toFixed(1).replace(".", ",")}%${
							operationalResult.isRecord ? " · novo recorde" : ""
						}`}
					</p>
				)}
				<DeltaPill deltaPct={operationalResult.deltaPct} vsLabel={vsLabel} />
				<div
					className={styles.kpiBar}
					style={{ background: KPI_BAR.operational_result }}
				/>
			</article>
		</div>
	);
}
