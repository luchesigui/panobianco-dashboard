import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { CHART_COLOR } from "@/lib/kpis/card-bar-colors";
import styles from "./vendas-marketing.module.css";

type Props = {
	composition: SalesMarketingDashboardPayload["salesComposition"];
};

export function Composicao({ composition }: Props) {
	return (
		<>
			<h3 className={styles.sectionLabel}>
				{composition?.sectionTitle ?? "Composição das vendas"}
			</h3>
			{composition ? (
				<div className={styles.salesComp}>
					<article className={styles.salesCompCard}>
						<div
							className={styles.salesCompStripe}
							style={{ background: CHART_COLOR.comparison }}
							aria-hidden
						/>
						<div>
							<div className={styles.salesCompLabel}>
								{composition.experimental.title}
							</div>
							<div
								className={styles.salesCompVal}
								style={{ color: CHART_COLOR.comparison }}
							>
								{new Intl.NumberFormat("pt-BR").format(
									composition.experimental.value,
								)}
							</div>
							<div className={styles.salesCompDetail}>
								{composition.experimental.subtext}
							</div>
						</div>
					</article>
					{composition.online && (
						<article className={styles.salesCompCard}>
							<div
								className={styles.salesCompStripe}
								style={{ background: CHART_COLOR.secondary }}
								aria-hidden
							/>
							<div>
								<div className={styles.salesCompLabel}>
									{composition.online.title}
								</div>
								<div
									className={styles.salesCompVal}
									style={{ color: CHART_COLOR.secondary }}
								>
									{new Intl.NumberFormat("pt-BR").format(
										composition.online.value,
									)}
								</div>
								<div className={styles.salesCompDetail}>
									{composition.online.subtext}
								</div>
							</div>
						</article>
					)}
					<article className={styles.salesCompCard}>
						<div
							className={styles.salesCompStripe}
							style={{ background: CHART_COLOR.primary }}
							aria-hidden
						/>
						<div>
							<div className={styles.salesCompLabel}>
								{composition.otherChannels.title}
							</div>
							<div
								className={styles.salesCompVal}
								style={{ color: CHART_COLOR.primary }}
							>
								{new Intl.NumberFormat("pt-BR").format(
									composition.otherChannels.value,
								)}
							</div>
							<div className={styles.salesCompDetail}>
								{composition.otherChannels.subtext}
							</div>
						</div>
					</article>
				</div>
			) : (
				<p className={styles.salesCompEmpty}>
					Dados de composição de vendas ainda sem fonte definida — em breve.
				</p>
			)}
		</>
	);
}
