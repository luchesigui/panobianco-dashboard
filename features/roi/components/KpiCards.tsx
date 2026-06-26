import { barColor } from "@/lib/kpis/card-bar-colors";
import { formatCompactBrl } from "@/lib/kpis/format";
import styles from "@/app/kpis/page.module.css";
import type { RoiKpis } from "../types";

type Props = { kpis: RoiKpis };

export function KpiCards({ kpis }: Props) {
	const { totalInvested, cashBalance, recoveryBalance, paybackMonths } = kpis;

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>{totalInvested.title}</span>
				<p className={styles.kpiValue}>
					{totalInvested.value != null ? formatCompactBrl(totalInvested.value) : "N/A"}
				</p>
				{totalInvested.subline && (
					<p className={styles.kpiMetaLine}>{totalInvested.subline}</p>
				)}
				{totalInvested.detailLine && (
					<p className={styles.kpiDetailLine}>{totalInvested.detailLine}</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("total_invested") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>{cashBalance.title}</span>
				<p className={styles.kpiValue}>
					{cashBalance.value != null ? formatCompactBrl(cashBalance.value) : "N/A"}
				</p>
				{cashBalance.subline && (
					<p className={styles.kpiMetaLine}>{cashBalance.subline}</p>
				)}
				{cashBalance.pctPill && (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{cashBalance.pctPill}
						</span>
					</div>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("cash_balance") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>{recoveryBalance.title}</span>
				<p className={styles.kpiValue}>
					{recoveryBalance.value != null ? formatCompactBrl(recoveryBalance.value) : "N/A"}
				</p>
				{recoveryBalance.subline && (
					<p className={styles.kpiMetaLine}>{recoveryBalance.subline}</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("recovery_balance") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Payback estimado</span>
				<p className={styles.kpiValue}>
					{paybackMonths.value != null
						? `${Math.round(paybackMonths.value)} meses`
						: "N/A"}
				</p>
				{paybackMonths.subline && (
					<p className={styles.kpiMetaLine}>{paybackMonths.subline}</p>
				)}
				{paybackMonths.detailLine && (
					<p className={styles.kpiDetailLine}>{paybackMonths.detailLine}</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("roi_payback_months") }}
				/>
			</article>
		</div>
	);
}
