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

export function KpiCards({ kpis, vsLabel }: Props) {
	const { revenueTotal, expensesTotal, operationalResult, invoiceTaxNf, operationalResult100PctNf, accumulatedNoContributions, accumulatedWithContributions, matriculatedRevenue, wellhubRevenue, totalpassRevenue, royaltiesValidation } = kpis;

	const accWithDisplay =
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
				<div
					className={styles.kpiBar}
					style={{ background: barColor("expenses_total") }}
				/>
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
				<div
					className={styles.kpiBar}
					style={{ background: barColor("operational_result") }}
				/>
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
				<div
					className={styles.kpiBar}
					style={{ background: barColor("invoice_tax_nf") }}
				/>
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
				<div
					className={styles.kpiBar}
					style={{ background: barColor("operational_result_100pct_nf") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Acumulado sem aportes</span>
				<p className={styles.kpiValue}>
					{accumulatedNoContributions.value != null
						? formatCurrencySignedK(accumulatedNoContributions.value)
						: "N/A"}
				</p>
				{accumulatedNoContributions.subline && (
					<p className={styles.kpiMetaLine}>{accumulatedNoContributions.subline}</p>
				)}
				{accumulatedNoContributions.deltaPill && (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{accumulatedNoContributions.deltaPill}
						</span>
					</div>
				)}
				{accumulatedNoContributions.footnote && (
					<p className={styles.kpiDetailLine}>{accumulatedNoContributions.footnote}</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("accumulated_operational_no_contributions") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Acumulado com aportes</span>
				<p className={styles.kpiValue}>{accWithDisplay}</p>
				{accumulatedWithContributions.subline && (
					<p className={styles.kpiMetaLine}>{accumulatedWithContributions.subline}</p>
				)}
				{accumulatedWithContributions.deltaPill && (
					<div className={styles.kpiSub}>
						<span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
							{accumulatedWithContributions.deltaPill}
						</span>
					</div>
				)}
				{accumulatedWithContributions.aportesLine && (
					<p className={styles.kpiDetailLine}>{accumulatedWithContributions.aportesLine}</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("accumulated_with_contributions") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita matriculados</span>
				<p className={styles.kpiValue}>
					{matriculatedRevenue.value != null
						? formatCompactBrl(matriculatedRevenue.value)
						: "N/A"}
				</p>
				{matriculatedRevenue.pctOfTotal != null && (
					<p className={styles.kpiMetaLine}>
						{matriculatedRevenue.pctOfTotal.toFixed(1).replace(".", ",")}% do total
					</p>
				)}
				<DeltaPill deltaPct={matriculatedRevenue.deltaPct} overrideDeltaPct={matriculatedRevenue.overrideDeltaPct} vsLabel={vsLabel} integerPct />
				{matriculatedRevenue.breakdown && (
					<p className={styles.kpiDetailLine}>
						Recorrente {formatCompactBrlOneDecimal(matriculatedRevenue.breakdown.recorrente)}{" "}
						· Anual {formatCompactBrlOneDecimal(matriculatedRevenue.breakdown.anual)} ·
						Mensal {formatCompactBrlOneDecimal(matriculatedRevenue.breakdown.mensal)}
					</p>
				)}
				<div
					className={styles.kpiBar}
					style={{ background: barColor("matriculated_revenue") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita Wellhub</span>
				<p className={styles.kpiValue}>
					{wellhubRevenue.value != null ? formatCompactBrl(wellhubRevenue.value) : "N/A"}
				</p>
				{wellhubRevenue.pctOfTotal != null && (
					<p className={styles.kpiMetaLine}>
						{wellhubRevenue.pctOfTotal.toFixed(1).replace(".", ",")}% do total
					</p>
				)}
				<DeltaPill deltaPct={wellhubRevenue.deltaPct} overrideDeltaPct={wellhubRevenue.overrideDeltaPct} vsLabel={vsLabel} integerPct />
				<div
					className={styles.kpiBar}
					style={{ background: barColor("wellhub_revenue") }}
				/>
			</article>

			<article className={styles.kpiCard}>
				<span className={styles.kpiLabel}>Receita Totalpass</span>
				<p className={styles.kpiValue}>
					{totalpassRevenue.value != null
						? formatCompactBrl(totalpassRevenue.value)
						: "N/A"}
				</p>
				{totalpassRevenue.pctOfTotal != null && (
					<p className={styles.kpiMetaLine}>
						{totalpassRevenue.pctOfTotal.toFixed(1).replace(".", ",")}% do total
					</p>
				)}
				<DeltaPill deltaPct={totalpassRevenue.deltaPct} overrideDeltaPct={totalpassRevenue.overrideDeltaPct} vsLabel={vsLabel} integerPct />
				<div
					className={styles.kpiBar}
					style={{ background: barColor("totalpass_revenue") }}
				/>
			</article>

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
				<div
					className={styles.kpiBar}
					style={{ background: barColor("royalties_validation") }}
				/>
			</article>
		</div>
	);
}
