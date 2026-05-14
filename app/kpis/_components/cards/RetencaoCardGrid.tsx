import type { KpiPageData } from "@/lib/data/kpis";
import { formatCompactBrlOneDecimal } from "@/lib/kpis/format";
import styles from "../../page.module.css";
import { renderDelta } from "./render-delta";

export function RetencaoCardGrid({ data }: { data: KpiPageData }) {
	const baseM = data.currentMeta.base_students_end ?? {};
	const baseVal = data.current.base_students_end;
	const openM = (data.currentMeta.open_default_count ?? {}) as Record<
		string,
		unknown
	>;
	const openC = data.current.open_default_count;
	const openV = data.current.open_default_value;
	const recC = data.current.recovered_default_count ?? 0;
	const cancellations = data.current.monthly_cancellations;
	const nonRenewed = data.current.monthly_non_renewed;
	const cancelled =
		typeof openM.cancelled_count === "number" ? openM.cancelled_count : 0;
	const recordCount =
		typeof openM.month_total_records === "number"
			? openM.month_total_records
			: Math.round((openC ?? 0) + recC + cancelled);
	const recoveryPct =
		typeof openM.recovery_rate_pct === "number"
			? openM.recovery_rate_pct
			: recordCount > 0
				? Math.round((recC / recordCount) * 100)
				: null;
	const pill3d =
		typeof openM.recovery_3d_pill === "string" ? openM.recovery_3d_pill : null;
	const exitsVal = data.previous.monthly_exits;

	// Use breakdown fields when available, fall back to monthly_exits
	const exitsCurrentSum =
		cancellations != null || nonRenewed != null
			? (cancellations ?? 0) + (nonRenewed ?? 0)
			: data.current.monthly_exits;
	const exitsPrevSum =
		data.previous.monthly_cancellations != null ||
		data.previous.monthly_non_renewed != null
			? (data.previous.monthly_cancellations ?? 0) +
				(data.previous.monthly_non_renewed ?? 0)
			: exitsVal;

	const exitDelta = renderDelta(
		exitsCurrentSum,
		exitsPrevSum,
		data.previousPeriodLabel,
		{
			invertColors: true,
		},
	);

	const star = baseM.partial === true ? "*" : "";
	const baseDisplay =
		baseVal != null
			? `${new Intl.NumberFormat("pt-BR").format(baseVal)}${star}`
			: "N/A";
	const foot =
		typeof baseM.pending_note === "string" ? `*${baseM.pending_note}` : null;

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Base de alunos</span>
				<p className={styles.kpiValue}>{baseDisplay}</p>
				{foot ? <p className={styles.kpiMetaLine}>{foot}</p> : null}
				<div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
			</article>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Inadimpl. em aberto</span>
				<p className={styles.kpiValue}>
					{openC != null ? new Intl.NumberFormat("pt-BR").format(openC) : "N/A"}
				</p>
				{openV != null ? (
					<p className={styles.kpiMetaLine}>
						{formatCompactBrlOneDecimal(openV)} em aberto
					</p>
				) : null}
				<div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
			</article>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Taxa recuperação</span>
				<p className={styles.kpiValue}>
					{recoveryPct != null ? `${recoveryPct}%` : "N/A"}
				</p>
				<p className={styles.kpiMetaLine}>
					{recC} de {recordCount}
				</p>
				{pill3d ? (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{pill3d}
						</span>
					</div>
				) : null}
				<div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
			</article>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Saídas</span>
				<p className={styles.kpiValue}>
					{cancellations != null || nonRenewed != null
						? new Intl.NumberFormat("pt-BR").format(
								(cancellations ?? 0) + (nonRenewed ?? 0),
							)
						: exitsVal != null
							? new Intl.NumberFormat("pt-BR").format(exitsVal)
							: "N/A"}
				</p>
				<div className={styles.kpiSub}>
					{exitDelta.pill ? (
						<>
							<span className={`${styles.kpiDelta} ${exitDelta.pillClass}`}>
								{exitDelta.pill}
							</span>
							{exitDelta.tail}
						</>
					) : (
						<span className={`${styles.kpiDelta} ${exitDelta.pillClass}`}>
							{exitDelta.tail}
						</span>
					)}
				</div>
				<div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
			</article>
		</div>
	);
}
