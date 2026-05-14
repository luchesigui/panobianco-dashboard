import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";

type Props = {
	receptionists: SalesMarketingDashboardPayload["receptionists"];
	receptionistsPeriodLabel?: string | null;
};

export function PerformanceBySeller({
	receptionists,
	receptionistsPeriodLabel,
}: Props) {
	const recepMaxConv = Math.max(
		0.001,
		...receptionists.map((r) => r.conversion_pct),
	);

	return (
		<div className={styles.chartCard}>
			<h3 className={styles.chartCardTitle}>Performance por recepcionista</h3>
			{receptionistsPeriodLabel ? (
				<p className={styles.chartSub}>
					Conversão leads → vendas — {receptionistsPeriodLabel}
				</p>
			) : (
				<p className={styles.chartSub}>Conversão leads → vendas</p>
			)}
			<div className={styles.teamTableWrap}>
				<table className={styles.teamTable}>
					<thead>
						<tr>
							<th>Nome</th>
							<th>Leads</th>
							<th>Vendas</th>
							<th className={styles.teamThConv}>Conversão</th>
						</tr>
					</thead>
					<tbody>
						{receptionists.map((r) => {
							const barW = Math.round((r.conversion_pct / recepMaxConv) * 100);
							const isAccent = r.bar_variant === "accent";
							return (
								<tr key={r.name}>
									<td className={styles.teamTdName}>
										{r.name}
										{r.badge ? (
											<span className={styles.teamBadge}> ({r.badge})</span>
										) : null}
									</td>
									<td className={styles.teamTdNum}>{r.leads}</td>
									<td className={styles.teamTdNum}>
										{r.sales}{" "}
										<span className={styles.teamVendasSplit}>/ {r.goal}</span>
									</td>
									<td className={styles.teamTdConv}>
										<div className={styles.barCell}>
											<div className={styles.miniBarTrack}>
												<div
													className={
														isAccent ? styles.miniBarFillAccent : styles.miniBarFill
													}
													style={{ width: `${barW}%` }}
												/>
											</div>
											<span className={styles.teamPct}>
												{r.conversion_pct.toFixed(1)}%
											</span>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
