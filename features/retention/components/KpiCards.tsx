import { formatCompactBrlOneDecimal } from "@/lib/kpis/format";
import { KpiCard } from "@/components/kpis/KpiCard";
import styles from "@/app/kpis/page.module.css";
import type { RetentionKpis } from "../types";

type Props = {
	kpis: RetentionKpis;
	previousPeriodLabel?: string;
};

export function KpiCards({ kpis, previousPeriodLabel }: Props) {
	const { baseStudents, openDefault, recoveryRate, renewals, exits } = kpis;
	const vsLabel = previousPeriodLabel;

	return (
		<div className={renewals !== null ? styles.retentionGrid : styles.kpiGrid}>
			<KpiCard accentColor="#0f6e56">
				<KpiCard.Title>Base de alunos</KpiCard.Title>
				<KpiCard.MainNumber>
					{baseStudents.value != null
						? `${new Intl.NumberFormat("pt-BR").format(baseStudents.value)}${baseStudents.isPartial ? "*" : ""}`
						: "N/A"}
				</KpiCard.MainNumber>
				{baseStudents.pendingNote && (
					<KpiCard.Subdescription>{`*${baseStudents.pendingNote}`}</KpiCard.Subdescription>
				)}
			</KpiCard>

			<KpiCard accentColor="#a32d2d">
				<KpiCard.Title>Inadimpl. em aberto</KpiCard.Title>
				<KpiCard.MainNumber>
					{openDefault.count != null
						? new Intl.NumberFormat("pt-BR").format(openDefault.count)
						: "N/A"}
				</KpiCard.MainNumber>
				{openDefault.value != null && (
					<KpiCard.Subdescription>
						{formatCompactBrlOneDecimal(openDefault.value)} em aberto
					</KpiCard.Subdescription>
				)}
			</KpiCard>

			<KpiCard accentColor="#0f6e56">
				<KpiCard.Title>Taxa recuperação</KpiCard.Title>
				<KpiCard.MainNumber>
					{recoveryRate.pct != null ? `${recoveryRate.pct}%` : "N/A"}
				</KpiCard.MainNumber>
				<KpiCard.Subdescription>
					{recoveryRate.recovered} de {recoveryRate.total}
				</KpiCard.Subdescription>
				{recoveryRate.pill3d && (
					<KpiCard.Pill tone="good" label={recoveryRate.pill3d} />
				)}
			</KpiCard>

			{renewals !== null && (
				<KpiCard accentColor="#0f6e56">
					<KpiCard.Title>Renovações</KpiCard.Title>
					<KpiCard.MainNumber>
						{new Intl.NumberFormat("pt-BR").format(renewals.value)}
					</KpiCard.MainNumber>
					{renewals.nonRenewed != null ? (
						<KpiCard.Subdescription>
							{renewals.renewalRatePct != null
								? `${renewals.renewalRatePct.toFixed(1).replace(".", ",")}% taxa de renov.`
								: "0% taxa"}
						</KpiCard.Subdescription>
					) : (
						<KpiCard.Subdescription>Contratos renovados</KpiCard.Subdescription>
					)}
				</KpiCard>
			)}

			<KpiCard accentColor="#a32d2d">
				<KpiCard.Title>Saídas</KpiCard.Title>
				<KpiCard.MainNumber>
					{exits.current != null
						? new Intl.NumberFormat("pt-BR").format(exits.current)
						: "N/A"}
				</KpiCard.MainNumber>
				{exits.deltaPct != null ? (
					<KpiCard.Pill
						value={exits.deltaPct}
						tone="invert"
						pctAsInteger={false}
						suffix={vsLabel ? ` vs ${vsLabel}` : " vs período anterior"}
					/>
				) : (
					<KpiCard.Pill tone="neutral" label="Sem comparativo" />
				)}
			</KpiCard>
		</div>
	);
}
