import { barColor } from "@/lib/kpis/card-bar-colors";
import { formatCompactBrl } from "@/lib/kpis/format";
import { KpiCard } from "@/components/kpis/KpiCard";
import styles from "@/app/kpis/page.module.css";
import type { RoiKpis } from "../types";

type Props = { kpis: RoiKpis };

export function KpiCards({ kpis }: Props) {
	const { totalInvested, cashBalance, recoveryBalance, paybackMonths } = kpis;

	return (
		<div className={styles.kpiGrid}>
			<KpiCard accentColor={barColor("total_invested")}>
				<KpiCard.Title>{totalInvested.title}</KpiCard.Title>
				<KpiCard.MainNumber>
					{totalInvested.value != null ? formatCompactBrl(totalInvested.value) : "N/A"}
				</KpiCard.MainNumber>
				{totalInvested.subline && (
					<KpiCard.Subdescription>{totalInvested.subline}</KpiCard.Subdescription>
				)}
				{totalInvested.detailLine && (
					<KpiCard.Subdescription tone="detail">
						{totalInvested.detailLine}
					</KpiCard.Subdescription>
				)}
			</KpiCard>

			<KpiCard accentColor={barColor("cash_balance")}>
				<KpiCard.Title>{cashBalance.title}</KpiCard.Title>
				<KpiCard.MainNumber>
					{cashBalance.value != null ? formatCompactBrl(cashBalance.value) : "N/A"}
				</KpiCard.MainNumber>
				{cashBalance.subline && (
					<KpiCard.Subdescription>{cashBalance.subline}</KpiCard.Subdescription>
				)}
				{cashBalance.pctPill && (
					<KpiCard.Pill tone="good" label={cashBalance.pctPill} />
				)}
			</KpiCard>

			<KpiCard accentColor={barColor("recovery_balance")}>
				<KpiCard.Title>{recoveryBalance.title}</KpiCard.Title>
				<KpiCard.MainNumber>
					{recoveryBalance.value != null
						? formatCompactBrl(recoveryBalance.value)
						: "N/A"}
				</KpiCard.MainNumber>
				{recoveryBalance.subline && (
					<KpiCard.Subdescription>{recoveryBalance.subline}</KpiCard.Subdescription>
				)}
			</KpiCard>

			<KpiCard accentColor={barColor("roi_payback_months")}>
				<KpiCard.Title>Payback estimado</KpiCard.Title>
				<KpiCard.MainNumber>
					{paybackMonths.value != null
						? `${Math.round(paybackMonths.value)} meses`
						: "N/A"}
				</KpiCard.MainNumber>
				{paybackMonths.subline && (
					<KpiCard.Subdescription>{paybackMonths.subline}</KpiCard.Subdescription>
				)}
				{paybackMonths.detailLine && (
					<KpiCard.Subdescription tone="detail">
						{paybackMonths.detailLine}
					</KpiCard.Subdescription>
				)}
			</KpiCard>
		</div>
	);
}
