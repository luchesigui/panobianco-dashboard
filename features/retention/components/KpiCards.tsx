import { clsx } from "clsx";
import { formatCompactBrlOneDecimal, formatDeltaPill } from "@/lib/kpis/format";
import styles from "@/app/kpis/page.module.css";
import type { RetentionKpis } from "../types";

type Props = {
	kpis: RetentionKpis;
	previousPeriodLabel?: string;
};

export function KpiCards({ kpis, previousPeriodLabel }: Props) {
	const { baseStudents, openDefault, recoveryRate, renewals, exits } = kpis;
	const vsLabel = previousPeriodLabel;

	const exitPct = exits.deltaPct;
	const exitPill =
		exitPct != null
			? {
					label: formatDeltaPill(exitPct, false),
					cls: clsx(styles.kpiDelta, {
						[styles.deltaUp]: exitPct < 0,
						[styles.deltaDown]: exitPct > 0,
						[styles.deltaNeutral]: exitPct === 0,
					}),
					tail: vsLabel ? ` vs ${vsLabel}` : " vs período anterior",
				}
			: null;

	return (
		<div className={renewals !== null ? styles.retentionGrid : styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Base de alunos</span>
				<p className={styles.kpiValue}>
					{baseStudents.value != null
						? `${new Intl.NumberFormat("pt-BR").format(baseStudents.value)}${baseStudents.isPartial ? "*" : ""}`
						: "N/A"}
				</p>
				{baseStudents.pendingNote && (
					<p className={styles.kpiMetaLine}>{`*${baseStudents.pendingNote}`}</p>
				)}
				<div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Inadimpl. em aberto</span>
				<p className={styles.kpiValue}>
					{openDefault.count != null
						? new Intl.NumberFormat("pt-BR").format(openDefault.count)
						: "N/A"}
				</p>
				{openDefault.value != null && (
					<p className={styles.kpiMetaLine}>
						{formatCompactBrlOneDecimal(openDefault.value)} em aberto
					</p>
				)}
				<div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Taxa recuperação</span>
				<p className={styles.kpiValue}>
					{recoveryRate.pct != null ? `${recoveryRate.pct}%` : "N/A"}
				</p>
				<p className={styles.kpiMetaLine}>
					{recoveryRate.recovered} de {recoveryRate.total}
				</p>
				{recoveryRate.pill3d && (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{recoveryRate.pill3d}
						</span>
					</div>
				)}
				<div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
			</article>

			{renewals !== null && (
				<article className={styles.kpiCard}>
					<span className={styles.kpiLabel}>Renovações</span>
					<p className={styles.kpiValue}>
						{new Intl.NumberFormat("pt-BR").format(renewals.value)}
					</p>
					{renewals.nonRenewed != null ? (
						<p className={styles.kpiMetaLine}>
							{renewals.renewalRatePct != null
								? `${renewals.renewalRatePct.toFixed(1).replace(".", ",")}% taxa de renov.`
								: "0% taxa"}
						</p>
					) : (
						<p className={styles.kpiMetaLine}>Contratos renovados</p>
					)}
					<div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
				</article>
			)}

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Saídas</span>
				<p className={styles.kpiValue}>
					{exits.current != null
						? new Intl.NumberFormat("pt-BR").format(exits.current)
						: "N/A"}
				</p>
				<div className={styles.kpiSub}>
					{exitPill ? (
						<>
							<span className={exitPill.cls}>{exitPill.label}</span>
							{exitPill.tail}
						</>
					) : (
						<span className={`${styles.kpiDelta} ${styles.deltaNeutral}`}>
							Sem comparativo
						</span>
					)}
				</div>
				<div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
			</article>
		</div>
	);
}
