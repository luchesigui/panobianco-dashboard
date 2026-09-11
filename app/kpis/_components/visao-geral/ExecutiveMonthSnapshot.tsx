"use client";

import type { ExecutiveMonthSnapshot as SnapshotType } from "@/lib/data/kpis";
import { CHART_COLOR } from "@/lib/kpis/card-bar-colors";
import {
	formatCompactBrl,
	formatCompactBrlOneDecimal,
	formatCurrencySignedK,
	formatValue,
} from "@/lib/kpis/format";
import styles from "./executive-summary.module.css";

type Props = {
	snapshot: SnapshotType;
	previousPeriodLabel?: string;
};

export function ExecutiveMonthSnapshot({ snapshot }: Props) {
	const {
		baseStudents,
		sales,
		revenue,
		operationalResult,
		exits,
		defaultRisk,
	} = snapshot;

	// Net balance for students
	const netStudents = exits.netBalance;
	const isNetPositive = netStudents !== null && netStudents > 0;
	const isNetNegative = netStudents !== null && netStudents < 0;

	// Revenue delta
	const isRevPositive = revenue.deltaMoM !== null && revenue.deltaMoM > 0;

	// Sales gap
	const isSalesOnTrack = sales.gap !== null && sales.gap >= 0;

	return (
		<div className={styles.snapshotGrid}>
			{/* 1. Base de alunos */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Base de alunos</span>
						{baseStudents.isPartial && (
							<span className={styles.pillWarning}>Parcial</span>
						)}
					</div>
					<p className={styles.cardValue}>
						{baseStudents.value != null
							? `${new Intl.NumberFormat("pt-BR").format(baseStudents.value)}${baseStudents.isPartial ? "*" : ""}`
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					{baseStudents.goal && (
						<span>
							Meta do ano:{" "}
							<span className={styles.cardMetaHighlight}>
								{baseStudents.goal}
							</span>
						</span>
					)}
					{netStudents !== null ? (
						<span>
							Saldo do mês:{" "}
							<span
								className={
									isNetPositive
										? styles.pillPositive
										: isNetNegative
											? styles.pillNegative
											: styles.pillNeutral
								}
							>
								{isNetPositive ? `+${netStudents}` : `${netStudents}`}
							</span>
						</span>
					) : baseStudents.pendingNote ? (
						<span>*{baseStudents.pendingNote}</span>
					) : null}
				</div>
				<div
					className={styles.cardBottomBar}
					style={{ background: CHART_COLOR.primary }}
				/>
			</article>

			{/* 2. Novas Vendas */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Novas vendas</span>
						{sales.isPartial && (
							<span className={styles.pillWarning}>Parcial</span>
						)}
					</div>
					<p className={styles.cardValue}>
						{sales.value != null
							? formatValue(sales.value)
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					{sales.goal && (
						<span>
							Meta:{" "}
							<span className={styles.cardMetaHighlight}>
								{sales.goal} vendas
							</span>
						</span>
					)}
					{sales.gap !== null && (
						<span>
							Gap:{" "}
							<span
								className={
									isSalesOnTrack ? styles.pillPositive : styles.pillNegative
								}
							>
								{sales.gap > 0 ? `+${sales.gap}` : `${sales.gap}`}
							</span>
						</span>
					)}
				</div>
				<div
					className={styles.cardBottomBar}
					style={{ background: CHART_COLOR.primary }}
				/>
			</article>

			{/* 3. Receita Total */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Receita total</span>
						{revenue.deltaMoM !== null && (
							<span
								className={
									isRevPositive ? styles.pillPositive : styles.pillNegative
								}
							>
								{isRevPositive ? `+${revenue.deltaMoM}%` : `${revenue.deltaMoM}%`}
							</span>
						)}
					</div>
					<p className={styles.cardValue}>
						{revenue.value != null
							? formatCompactBrl(revenue.value)
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					{revenue.matriculatedPercent !== null && (
						<span>
							Matriculados:{" "}
							<span className={styles.cardMetaHighlight}>
								{revenue.matriculatedPercent}%
							</span>
						</span>
					)}
					<span>Faturamento bruto mensal</span>
				</div>
				<div
					className={styles.cardBottomBar}
					style={{ background: CHART_COLOR.primary }}
				/>
			</article>

			{/* 4. Resultado Operacional */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Resultado operacional</span>
						{operationalResult.isRecord && (
							<span className={styles.pillPositive}>Recorde</span>
						)}
					</div>
					<p className={styles.cardValue}>
						{operationalResult.value != null
							? formatCurrencySignedK(operationalResult.value)
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					{operationalResult.marginPercent !== null && (
						<span>
							Margem:{" "}
							<span className={styles.cardMetaHighlight}>
								{operationalResult.marginPercent.toFixed(1).replace(".", ",")}%
							</span>
						</span>
					)}
					{operationalResult.result100PctNf !== null && (
						<span>
							Se 100% NF:{" "}
							<span className={styles.cardMetaHighlight}>
								{formatCurrencySignedK(operationalResult.result100PctNf)}
							</span>
						</span>
					)}
				</div>
				<div
					className={styles.cardBottomBar}
					style={{
						background:
							operationalResult.value != null && operationalResult.value >= 0
								? CHART_COLOR.primary
								: CHART_COLOR.comparison,
					}}
				/>
			</article>

			{/* 5. Cancelamentos & Saídas */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Cancelamentos & Saídas</span>
					</div>
					<p className={styles.cardValue}>
						{exits.total != null
							? new Intl.NumberFormat("pt-BR").format(exits.total)
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					<span>
						{exits.cancellations ?? 0} canc. · {exits.nonRenewed ?? 0} desist.
					</span>
					{baseStudents.value && exits.total != null ? (
						<span>
							Taxa de evasão:{" "}
							<span className={styles.cardMetaHighlight}>
								{((exits.total / baseStudents.value) * 100).toFixed(1).replace(".", ",")}%
							</span>
						</span>
					) : null}
				</div>
				<div
					className={styles.cardBottomBar}
					style={{ background: CHART_COLOR.comparison }}
				/>
			</article>

			{/* 6. Inadimplência do Mês */}
			<article className={styles.execCard}>
				<div>
					<div className={styles.cardHeader}>
						<span className={styles.cardLabel}>Inadimplência</span>
						{defaultRisk.pill3d && (
							<span className={styles.pillPositive}>{defaultRisk.pill3d}</span>
						)}
					</div>
					<p className={styles.cardValue}>
						{defaultRisk.openCount != null
							? `${new Intl.NumberFormat("pt-BR").format(defaultRisk.openCount)} em aberto`
							: "—"}
					</p>
				</div>
				<div className={styles.cardSubline}>
					{defaultRisk.openValue != null && (
						<span>
							Valor em aberto:{" "}
							<span className={styles.cardMetaHighlight}>
								{formatCompactBrlOneDecimal(defaultRisk.openValue)}
							</span>
						</span>
					)}
					{defaultRisk.recoveredCount != null && (
						<span>
							{defaultRisk.recoveredCount} recup.{" "}
							{defaultRisk.recoveryRatePct !== null
								? `(${defaultRisk.recoveryRatePct}%)`
								: ""}
						</span>
					)}
				</div>
				<div
					className={styles.cardBottomBar}
					style={{ background: CHART_COLOR.secondary }}
				/>
			</article>
		</div>
	);
}
