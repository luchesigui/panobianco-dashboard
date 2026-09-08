import type { KpiPageData } from "@/lib/data/kpis";
import { Composicao } from "./Composicao";
import { Funnel } from "./Funnel";
import { MonthlySales } from "./MonthlySales";
import { PerformanceBySeller } from "./PerformanceBySeller";
import styles from "./vendas-marketing.module.css";

type Props = {
	dashboard: KpiPageData["salesMarketingDashboard"];
	leadsGenerated?: number | null;
};

export function VendasMarketingCharts({
	dashboard,
	leadsGenerated,
}: Props) {
	const p = dashboard.payload;
	if (!p) return null;

	return (
		<div className={styles.deepRoot}>
			<Composicao composition={p.salesComposition} />
			<Funnel funnel={p.funnel} leadsGenerated={leadsGenerated} />
			<div className={styles.bottomGrid}>
				<PerformanceBySeller
					receptionists={p.receptionists}
					receptionistsPeriodLabel={p.receptionistsPeriodLabel}
				/>
				<MonthlySales
					chart={dashboard.monthlySalesChart}
					target={dashboard.salesTarget}
				/>
			</div>
		</div>
	);
}

