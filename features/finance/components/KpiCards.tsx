import { barColor } from "@/lib/kpis/card-bar-colors";
import {
	formatCompactBrl,
	formatCompactBrlOneDecimal,
	formatCurrencySignedK,
	formatValue,
} from "@/lib/kpis/format";
import { KpiCard } from "@/components/kpis/KpiCard";
import { DeltaPill } from "@/components/kpis/DeltaPill";
import styles from "@/app/kpis/page.module.css";
import type { FinanceKpis } from "../types";

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

function RevenueWithPercentageOfTotalCard({
	label,
	barKey,
	kpi,
	vsLabel,
}: RevenueWithPercentageOfTotalCardProps) {
	return (
		<KpiCard accentColor={barColor(barKey)}>
			<KpiCard.Title>{label}</KpiCard.Title>
			<KpiCard.MainNumber>
				{kpi.value != null ? formatCompactBrl(kpi.value) : "N/A"}
			</KpiCard.MainNumber>
			{kpi.pctOfTotal != null && (
				<KpiCard.Subdescription>
					{kpi.pctOfTotal.toFixed(1).replace(".", ",")}% do total
				</KpiCard.Subdescription>
			)}
			<DeltaPill
				deltaPct={kpi.deltaPct}
				overrideDeltaPct={kpi.overrideDeltaPct}
				vsLabel={vsLabel}
				integerPct
			/>
			{kpi.breakdown && (
				<KpiCard.Subdescription tone="detail">
					Recorrente {formatCompactBrlOneDecimal(kpi.breakdown.recorrente)}{" "}
					· Anual {formatCompactBrlOneDecimal(kpi.breakdown.anual)} · Mensal{" "}
					{formatCompactBrlOneDecimal(kpi.breakdown.mensal)}
				</KpiCard.Subdescription>
			)}
		</KpiCard>
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

function AccumulatedCard({
	label,
	barKey,
	displayValue,
	subline,
	deltaPill,
	footnote,
	aportesLine,
}: AccumulatedCardProps) {
	return (
		<KpiCard accentColor={barColor(barKey)}>
			<KpiCard.Title>{label}</KpiCard.Title>
			<KpiCard.MainNumber>{displayValue}</KpiCard.MainNumber>
			{subline && <KpiCard.Subdescription>{subline}</KpiCard.Subdescription>}
			{deltaPill && <KpiCard.Pill tone="good" label={deltaPill} />}
			{footnote && (
				<KpiCard.Subdescription tone="detail">{footnote}</KpiCard.Subdescription>
			)}
			{aportesLine && (
				<KpiCard.Subdescription tone="detail">{aportesLine}</KpiCard.Subdescription>
			)}
		</KpiCard>
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
			<KpiCard accentColor={barColor("revenue_total")}>
				<KpiCard.Title>Receita total</KpiCard.Title>
				<KpiCard.MainNumber>
					{revenueTotal.value != null ? formatCompactBrl(revenueTotal.value) : "N/A"}
				</KpiCard.MainNumber>
				<DeltaPill
					deltaPct={revenueTotal.deltaPct}
					overrideDeltaPct={revenueTotal.overrideDeltaPct}
					vsLabel={vsLabel}
					integerPct
				/>
			</KpiCard>

			<KpiCard accentColor={barColor("expenses_total")}>
				<KpiCard.Title>Despesa total</KpiCard.Title>
				<KpiCard.MainNumber>
					{expensesTotal.value != null
						? formatCompactBrl(expensesTotal.value)
						: "N/A"}
				</KpiCard.MainNumber>
				<KpiCard.PillRow>
					<DeltaPill
						deltaPct={expensesTotal.deltaPct}
						overrideDeltaPct={expensesTotal.overrideDeltaPct}
						vsLabel={vsLabel}
						invert
						integerPct
					/>
					{expensesTotal.deltaAbsLine && (
						<KpiCard.MutedText>{expensesTotal.deltaAbsLine}</KpiCard.MutedText>
					)}
				</KpiCard.PillRow>
			</KpiCard>

			<KpiCard accentColor={barColor("operational_result")}>
				<KpiCard.Title>Resultado operacional</KpiCard.Title>
				<KpiCard.MainNumber>
					{operationalResult.value != null
						? formatCurrencySignedK(operationalResult.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{operationalResult.marginPercent != null && (
					<KpiCard.Subdescription>
						margem {operationalResult.marginPercent.toFixed(1).replace(".", ",")}%
					</KpiCard.Subdescription>
				)}
				<DeltaPill
					deltaPct={operationalResult.deltaPct}
					overrideDeltaPct={operationalResult.overrideDeltaPct}
					vsLabel={vsLabel}
					integerPct
				/>
			</KpiCard>

			<KpiCard accentColor={barColor("invoice_tax_nf")}>
				<KpiCard.Title>Imposto NF emitido</KpiCard.Title>
				<KpiCard.MainNumber>
					{invoiceTaxNf.value != null
						? invoiceTaxNf.isApproximate
							? "~R$ 0"
							: formatValue(invoiceTaxNf.value, "currency")
						: "N/A"}
				</KpiCard.MainNumber>
				{invoiceTaxNf.pctRevenueLine && (
					<KpiCard.Subdescription>{invoiceTaxNf.pctRevenueLine}</KpiCard.Subdescription>
				)}
				{invoiceTaxNf.refLine && (
					<KpiCard.Subdescription tone="danger">
						{invoiceTaxNf.refLine}
					</KpiCard.Subdescription>
				)}
				{invoiceTaxNf.footnote && (
					<KpiCard.Subdescription tone="detail">
						{invoiceTaxNf.footnote}
					</KpiCard.Subdescription>
				)}
			</KpiCard>

			<KpiCard accentColor={barColor("operational_result_100pct_nf")}>
				<KpiCard.Title>Resultado se 100% NF</KpiCard.Title>
				<KpiCard.MainNumber>
					{operationalResult100PctNf.value != null
						? formatCurrencySignedK(operationalResult100PctNf.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{operationalResult100PctNf.marginLine && (
					<KpiCard.Subdescription>
						{operationalResult100PctNf.marginLine}
					</KpiCard.Subdescription>
				)}
				{operationalResult100PctNf.taxTheoryLine && (
					<KpiCard.Subdescription tone="detail">
						{operationalResult100PctNf.taxTheoryLine}
					</KpiCard.Subdescription>
				)}
			</KpiCard>

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

			<KpiCard accentColor={barColor("royalties_validation")}>
				<KpiCard.Title>Royalties (validação)</KpiCard.Title>
				<KpiCard.MainNumber>
					{royaltiesValidation.value != null
						? formatCompactBrlOneDecimal(royaltiesValidation.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{royaltiesValidation.pctLine && (
					<KpiCard.Subdescription>{royaltiesValidation.pctLine}</KpiCard.Subdescription>
				)}
				{royaltiesValidation.shortfallPill && (
					<KpiCard.Pill tone="bad" label={royaltiesValidation.shortfallPill} />
				)}
			</KpiCard>
		</div>
	);
}
