import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";

type Props = {
	funnel: SalesMarketingDashboardPayload["funnel"];
	leadsGenerated?: number | null;
};

export function Funnel({ funnel, leadsGenerated }: Props) {
	const scheduled = funnel.scheduled.value;
	const present = funnel.present.value;
	const closings = funnel.closings.value;

	const presentRate =
		scheduled > 0
			? `${Math.round((present / scheduled) * 100)}% dos agendados`
			: null;
	const closingsRate =
		present > 0
			? `${Math.round((closings / present) * 100)}% dos presentes`
			: null;
	const globalConversionPct =
		scheduled > 0 ? Math.round((closings / scheduled) * 100) : null;

	const steps = [
		{
			label: "Agendadas",
			value: String(scheduled),
			sub:
				leadsGenerated != null
					? `de ${leadsGenerated.toLocaleString("pt-BR")} leads`
					: null,
			bg: "#EEEDFE",
			fg: "#534AB7",
		},
		{
			label: "Presentes",
			value: String(present),
			sub: presentRate,
			bg: "#FAECE7",
			fg: "#D85A30",
		},
		{
			label: "Fechamentos",
			value: String(closings),
			sub: closingsRate,
			bg: "#E1F5EE",
			fg: "#0F6E56",
		},
		{
			label: "Conversão",
			value: globalConversionPct != null ? `${globalConversionPct}%` : "—",
			sub:
				scheduled > 0
					? `${closings.toLocaleString("pt-BR")} de ${scheduled.toLocaleString("pt-BR")} agendados`
					: null,
			bg: "#EAF3DE",
			fg: "#639922",
		},
	];

	return (
		<>
			<h3 className={styles.sectionLabel}>Funil de aula experimental</h3>
			<div className={styles.funnelRow}>
				{steps.map((step, i) => (
					<div
						key={step.label}
						className={styles.funnelStep}
						style={{ background: step.bg, color: step.fg }}
					>
						<span className={styles.funnelLabel}>{step.label}</span>
						<span className={styles.funnelVal} style={{ color: step.fg }}>
							{step.value}
						</span>
						<span className={styles.funnelRate}>{step.sub}</span>
						{i < steps.length - 1 ? (
							<span className={styles.funnelArrow} aria-hidden>
								&#9654;
							</span>
						) : null}
					</div>
				))}
			</div>
		</>
	);
}
