import { barColor } from "@/lib/kpis/card-bar-colors";
import {
	formatCompactBrl,
	formatCompactBrlOneDecimal,
	formatCurrencySignedK,
	formatValue,
} from "@/lib/kpis/format";
import { DeltaPill } from "@/components/kpis/DeltaPill";
import styles from "@/app/kpis/page.module.css";
import type { FinanceKpiCard, FinanceKpis } from "../types";

type Props = {
	kpis: FinanceKpis;
	vsLabel: string | undefined;
};

type RevenueWithPercentageOfTotalCardProps = {
	label: string;
	barKey: string;
	kpi: {
		value: number | null;
		deltaPct: number | null;
		overrideDeltaPct: number | null;
		pctOfTotal: number | null;
		breakdown?: { recorrente: number; anual: number; mensal: number } | null;
	};
	vsLabel: string | undefined;
};

function RevenueWithPercentageOfTotalCard({ label, barKey, kpi, vsLabel }: RevenueWithPercentageOfTotalCardProps) {
	return (
		<article className={styles.kpiCard}>
			<span className={styles.kpiLabel}>{label}</span>
			<p className={styles.kpiValue}>
				{kpi.value != null ? formatCompactBrl(kpi.value) : "N/A"}
			</p>
			{kpi.pctOfTotal != null && (
				<p className={styles.kpiMetaLine}>
					{kpi.pctOfTotal.toFixed(1).replace(".", ",")}% do total
				</p>
			)}
			<DeltaPill deltaPct={kpi.deltaPct} overrideDeltaPct={kpi.overrideDeltaPct} vsLabel={vsLabel} integerPct />
			{kpi.breakdown && (
				<p className={styles.kpiDetailLine}>
					Recorrente {formatCompactBrlOneDecimal(kpi.breakdown.recorrente)}{" "}
					· Anual {formatCompactBrlOneDecimal(kpi.breakdown.anual)} ·
					Mensal {formatCompactBrlOneDecimal(kpi.breakdown.mensal)}
				</p>
			)}
			<div className={styles.kpiBar} style={{ background: barColor(barKey) }} />
		</article>
	);
}

type AccumulatedCardProps = {
	label: string;
	barKey: string;
	displayValue: string;
	subline: string | null;
	deltaPill: string | null;
	footnote?: string | null;
	aportesLine?: string | null;
};

function AccumulatedCard({ label, barKey, displayValue, subline, deltaPill, footnote, aportesLine }: AccumulatedCardProps) {
	return (
		<article className={styles.kpiCard}>
			<span className={styles.kpiLabel}>{label}</span>
			<p className={styles.kpiValue}>{displayValue}</p>
			{subline && <p className={styles.kpiMetaLine}>{subline}</p>}
			{deltaPill && (
				<div className={styles.kpiSub}>
					<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>{deltaPill}</span>
				</div>
			)}
			{footnote && <p className={styles.kpiDetailLine}>{footnote}</p>}
			{aportesLine && <p className={styles.kpiDetailLine}>{aportesLine}</p>}
			<div className={styles.kpiBar} style={{ background: barColor(barKey) }} />
		</article>
	);
}

export function KpiCards({ kpis, vsLabel }: Props) {
	const {
		revenueTotal,
		expensesTotal,
		operationalResult,
		invoiceTaxNf,
		operationalResult100PctNf,
		accumulatedNoContributions,
		accumulatedWithContributions,
		matriculatedRevenue,
		wellhubRevenue,
		totalpassRevenue,
		royaltiesValidation,
	} = kpis;

	const accNoContributionsDisplay =
		accumulatedNoContributions.value != null
			? formatCurrencySignedK(accumulatedNoContributions.value)
			: "N/A";

	const accWithContributionsDisplay =
		accumulatedWithContributions.value != null
			? accumulatedWithContributions.isCompact
				? `${accumulatedWithContributions.value >= 0 ? "+" : "-"}R$ ${Math.round(Math.abs(accumulatedWithContributions.value) / 1000)}k`
				: formatCurrencySignedK(accumulatedWithContributions.value)
			: "N/A";

	return (
		<div className={styles.kpiGrid}>
			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita total</span>
				<p className={styles.kpiValue}>
					{revenueTotal.value != null ? formatCompactBrl(revenueTotal.value) : "N/A"}
				</p>
				<DeltaPill deltaPct={revenueTotal.deltaPct} overrideDeltaPct={revenueTotal.overrideDeltaPct} vsLabel={vsLabel} integerPct />
				<div className={styles.kpiBar} style={{ background: barColor("revenue_total") }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Despesa total</span>
				<p className={styles.kpiValue}>
					{expensesTotal.value != null ? formatCompactBrl(expensesTotal.value) : "N/A"}
				</p>
				<div className={styles.kpiSub}>
					<DeltaPill deltaPct={expensesTotal.deltaPct} overrideDeltaPct={expensesTotal.overrideDeltaPct} vsLabel={vsLabel} invert integerPct />
					{expensesTotal.deltaAbsLine && (
						<span className={styles.kpiMetaMuted}> {expensesTotal.deltaAbsLine}</span>
					)}
				</div>
				<div className={styles.kpiBar} style={{ background: barColor("expenses_total") }} />
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
						margem {operationalResult.marginPercent.toFixed(1).replace(".", ",")}%
					</p>
				)}
				<DeltaPill deltaPct={operationalResult.deltaPct} overrideDeltaPct={operationalResult.overrideDeltaPct} vsLabel={vsLabel} integerPct />
				<div className={styles.kpiBar} style={{ background: barColor("operational_result") }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Imposto NF emitido</span>
				<p className={styles.kpiValue}>
					{invoiceTaxNf.value != null
						? invoiceTaxNf.isApproximate
							? "~R$ 0"
							: formatValue(invoiceTaxNf.value, "currency")
						: "N/A"}
				</p>
				{invoiceTaxNf.pctRevenueLine && (
					<p className={styles.kpiMetaLine}>{invoiceTaxNf.pctRevenueLine}</p>
				)}
				{invoiceTaxNf.refLine && (
					<p className={styles.kpiMetaDanger}>{invoiceTaxNf.refLine}</p>
				)}
				{invoiceTaxNf.footnote && (
					<p className={styles.kpiDetailLine}>{invoiceTaxNf.footnote}</p>
				)}
				<div className={styles.kpiBar} style={{ background: barColor("invoice_tax_nf") }} />
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Resultado se 100% NF</span>
				<p className={styles.kpiValue}>
					{operationalResult100PctNf.value != null
						? formatCurrencySignedK(operationalResult100PctNf.value)
						: "N/A"}
				</p>
				{operationalResult100PctNf.marginLine && (
					<p className={styles.kpiMetaLine}>{operationalResult100PctNf.marginLine}</p>
				)}
				{operationalResult100PctNf.taxTheoryLine && (
					<p className={styles.kpiDetailLine}>{operationalResult100PctNf.taxTheoryLine}</p>
				)}
				<div className={styles.kpiBar} style={{ background: barColor("operational_result_100pct_nf") }} />
			</article>

			<AccumulatedCard
				label="Acumulado sem aportes"
				barKey="accumulated_operational_no_contributions"
				displayValue={accNoContributionsDisplay}
				subline={accumulatedNoContributions.subline}
				deltaPill={accumulatedNoContributions.deltaPill}
				footnote={accumulatedNoContributions.footnote}
			/>

			<AccumulatedCard
				label="Acumulado com aportes"
				barKey="accumulated_with_contributions"
				displayValue={accWithContributionsDisplay}
				subline={accumulatedWithContributions.subline}
				deltaPill={accumulatedWithContributions.deltaPill}
				aportesLine={accumulatedWithContributions.aportesLine}
			/>

			<RevenueWithPercentageOfTotalCard
				label="Receita matriculados"
				barKey="matriculated_revenue"
				kpi={matriculatedRevenue}
				vsLabel={vsLabel}
			/>

			<RevenueWithPercentageOfTotalCard
				label="Receita Wellhub"
				barKey="wellhub_revenue"
				kpi={wellhubRevenue}
				vsLabel={vsLabel}
			/>

			<RevenueWithPercentageOfTotalCard
				label="Receita Totalpass"
				barKey="totalpass_revenue"
				kpi={totalpassRevenue}
				vsLabel={vsLabel}
			/>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Royalties (validação)</span>
				<p className={styles.kpiValue}>
					{royaltiesValidation.value != null
						? formatCompactBrlOneDecimal(royaltiesValidation.value)
						: "N/A"}
				</p>
				{royaltiesValidation.pctLine && (
					<p className={styles.kpiMetaLine}>{royaltiesValidation.pctLine}</p>
				)}
				{royaltiesValidation.shortfallPill && (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaDown}`}>
							{royaltiesValidation.shortfallPill}
						</span>
					</div>
				)}
				<div className={styles.kpiBar} style={{ background: barColor("royalties_validation") }} />
			</article>
		</div>
	);
}
