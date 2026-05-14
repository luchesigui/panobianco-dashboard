import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
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
							style={{ background: "var(--blue, #185fa5)" }}
							aria-hidden
						/>
						<div>
							<div className={styles.salesCompLabel}>
								{composition.experimental.title}
							</div>
							<div
								className={styles.salesCompVal}
								style={{ color: "var(--blue, #185fa5)" }}
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
					<article className={styles.salesCompCard}>
						<div
							className={styles.salesCompStripe}
							style={{ background: "var(--accent, #0f6e56)" }}
							aria-hidden
						/>
						<div>
							<div className={styles.salesCompLabel}>
								{composition.otherChannels.title}
							</div>
							<div
								className={styles.salesCompVal}
								style={{ color: "var(--accent, #0f6e56)" }}
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
