import {
	formatCompactBrl,
	formatCurrencySignedK,
} from "@/lib/kpis/format";
import styles from "./projecao.module.css";

const BAR_ACCENTS = {
	revenue: "#2b6cb0",
	expense: "#ed8936",
	result: "#065f46",
	matriculated: "#63b3ed",
};

type Props = {
	revenueForecast: number;
	expenseForecast: number;
	resultForecast: number;
	matriculatedForecast: number;
	revenueVsBasisPct: number;
	matriculatedVsBasisPct: number;
	marginPct: number;
	expenseSubline: string;
	matriculatedSubline: string | null;
	basisPeriodLabel: string;
};

export function ProjecaoKpiCards({
	revenueForecast,
	expenseForecast,
	resultForecast,
	matriculatedForecast,
	revenueVsBasisPct,
	matriculatedVsBasisPct,
	marginPct,
	expenseSubline,
	matriculatedSubline,
	basisPeriodLabel,
}: Props) {
	const revPill = `${revenueVsBasisPct >= 0 ? "+" : ""}${Math.round(revenueVsBasisPct)}%`;
	const matPill = `${matriculatedVsBasisPct >= 0 ? "+" : ""}${Math.round(matriculatedVsBasisPct)}%`;

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita prevista</span>
				<p className={styles.kpiValue}>{formatCompactBrl(revenueForecast)}</p>
				<div className={styles.kpiSub}>
					<span
						className={`${styles.kpiDelta} ${
							revenueVsBasisPct >= 0 ? styles.deltaUp : styles.deltaDown
						}`}
					>
						{revPill}
					</span>
					<span>vs {basisPeriodLabel}</span>
				</div>
				<div
					className={styles.kpiBar}
					style={{ background: BAR_ACCENTS.revenue }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Despesa prevista</span>
				<p className={styles.kpiValue}>{formatCompactBrl(expenseForecast)}</p>
				<p className={styles.kpiMetaLine}>{expenseSubline}</p>
				<div
					className={styles.kpiBar}
					style={{ background: BAR_ACCENTS.expense }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Resultado previsto</span>
				<p className={styles.kpiValue}>{formatCurrencySignedK(resultForecast)}</p>
				<p className={styles.kpiMetaLine}>
					margem {marginPct.toFixed(1).replace(".", ",")}%
				</p>
				<div
					className={styles.kpiBar}
					style={{ background: BAR_ACCENTS.result }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Matriculados previsto</span>
				<p className={styles.kpiValue}>{formatCompactBrl(matriculatedForecast)}</p>
				{matriculatedSubline ? (
					<p className={styles.kpiMetaLine}>{matriculatedSubline}</p>
				) : null}
				<div className={styles.kpiSub}>
					<span
						className={`${styles.kpiDelta} ${
							matriculatedVsBasisPct >= 0 ? styles.deltaUp : styles.deltaDown
						}`}
					>
						{matPill}
					</span>
					<span>vs {basisPeriodLabel}</span>
				</div>
				<div
					className={styles.kpiBar}
					style={{ background: BAR_ACCENTS.matriculated }}
				/>
			</article>
		</div>
	);
}
