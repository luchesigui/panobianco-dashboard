import type { KpiPageData } from "@/lib/data/kpis";
import { barColor } from "@/lib/kpis/card-bar-colors";
import { formatCompactBrl } from "@/lib/kpis/format";
import styles from "../../page.module.css";

export function RoiCardGrid({ data }: { data: KpiPageData }) {
	const ti = (data.currentMeta.total_invested ?? {}) as Record<string, unknown>;
	const cashM = (data.currentMeta.cash_balance ?? {}) as Record<
		string,
		unknown
	>;
	const recM = (data.currentMeta.recovery_balance ?? {}) as Record<
		string,
		unknown
	>;
	const payM = (data.currentMeta.roi_payback_months ?? {}) as Record<
		string,
		unknown
	>;

	const total = data.current.total_invested;
	const cashV = data.current.cash_balance;
	const recV = data.current.recovery_balance;
	const payMos = data.current.roi_payback_months;

	const cardTitle = (m: Record<string, unknown>, fallback: string) =>
		typeof m.card_title === "string" ? m.card_title : fallback;

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>
					{cardTitle(ti, "Total investido (Bruno+Guilherme)")}
				</span>
				<p className={styles.kpiValue}>
					{total != null ? formatCompactBrl(total) : "N/A"}
				</p>
				{typeof ti.subline === "string" ? (
					<p className={styles.kpiMetaLine}>{ti.subline}</p>
				) : null}
				{typeof ti.detail_line === "string" ? (
					<p className={styles.kpiDetailLine}>{ti.detail_line}</p>
				) : null}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("total_invested") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>
					{cardTitle(cashM, "Saldo em caixa (fluxo real)")}
				</span>
				<p className={styles.kpiValue}>
					{cashV != null ? formatCompactBrl(cashV) : "N/A"}
				</p>
				{typeof cashM.subline === "string" ? (
					<p className={styles.kpiMetaLine}>{cashM.subline}</p>
				) : null}
				{typeof cashM.pct_of_investment_pill === "string" ? (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{cashM.pct_of_investment_pill}
						</span>
					</div>
				) : null}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("cash_balance") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>{cardTitle(recM, "A recuperar")}</span>
				<p className={styles.kpiValue}>
					{recV != null ? formatCompactBrl(recV) : "N/A"}
				</p>
				{typeof recM.subline === "string" ? (
					<p className={styles.kpiMetaLine}>{recM.subline}</p>
				) : null}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("recovery_balance") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Payback estimado</span>
				<p className={styles.kpiValue}>
					{payMos != null ? `${Math.round(payMos)} meses` : "N/A"}
				</p>
				{typeof payM.subline === "string" ? (
					<p className={styles.kpiMetaLine}>{payM.subline}</p>
				) : null}
				{typeof payM.detail_line === "string" ? (
					<p className={styles.kpiDetailLine}>{payM.detail_line}</p>
				) : null}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("roi_payback_months") }}
				/>
			</article>
		</div>
	);
}
