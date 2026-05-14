import React from "react";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";

function padWeeks<T>(arr: Array<T | null | undefined>, n: number): Array<T | null> {
	const out: Array<T | null> = [];
	for (let i = 0; i < n; i++) {
		const v = arr[i];
		out.push(v === undefined ? null : v ?? null);
	}
	return out;
}

function padWeekSourceLabels(
	labels: string[],
	n: number,
	fallback: string,
): string[] {
	const out = labels.slice();
	while (out.length < n) out.push(fallback);
	return out.slice(0, n);
}

function fmtCell(
	v: number | null | undefined,
	mode: "int" | "decimal1" | "intCompact",
): string {
	if (v == null) return "—";
	if (mode === "decimal1") return v.toFixed(1).replace(".", ",");
	return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
}

type WeeklyRowProps = {
	label: string;
	cells: Array<number | null>;
	total: number;
	mode: "int" | "decimal1" | "intCompact";
	weekKeys: string[];
};

function WeeklyRow({ label, cells, total, mode, weekKeys }: WeeklyRowProps) {
	return (
		<tr>
			<td className={styles.tdLabel}>{label}</td>
			{cells.map((c, i) => (
				<td key={`${label}-${weekKeys[i]}`} className={styles.tdNum}>
					{fmtCell(c, mode)}
				</td>
			))}
			<td className={styles.tdTotal}>{fmtCell(total, mode)}</td>
		</tr>
	);
}

type Props = {
	weekly: SalesMarketingDashboardPayload["weekly"];
	funnel: SalesMarketingDashboardPayload["funnel"];
	weekSourcePeriod: string[];
	calendarCurrentMonthLabel: string;
	salesTotal?: number | null;
	monthlyMarketing?: {
		reach?: number | null;
		frequency?: number | null;
		views?: number | null;
		followers?: number | null;
	} | null;
};

export function WeeklyView({
	weekly: w,
	funnel,
	weekSourcePeriod,
	calendarCurrentMonthLabel,
	salesTotal,
	monthlyMarketing,
}: Props) {
	const weeks = w.weekHeaders;
	const n = weeks.length;
	const weekSources = padWeekSourceLabels(
		weekSourcePeriod,
		n,
		calendarCurrentMonthLabel,
	);

	const mk = w.marketing;
	const reachW = padWeeks(mk.reach, n);
	const freqW = padWeeks(mk.frequency, n);
	const viewsW = padWeeks(mk.views, n);
	const folW = padWeeks(mk.followers, n);

	const fw = w.funnelWeekly;
	const schW = padWeeks(fw.scheduled, n);
	const attW = padWeeks(fw.attendance, n);
	const cloW = padWeeks(fw.closings, n);
	const salesW = padWeeks(w.salesWeekly.totals, n);

	return (
		<>
			<h3 className={styles.sectionLabel}>
				Visão semanal — vendas e marketing (dom a sáb)
			</h3>
			<p className={styles.weekPeriodHint}>
				O sufixo entre parênteses no cabeçalho marca colunas cujos valores vêm do{" "}
				<strong>mês anterior ao atual no calendário</strong> (não do mês atual).
			</p>
			<div className={`${styles.chartCard} ${styles.chartCardTable}`}>
				<table className={styles.weekTable}>
					<thead>
						<tr>
							<th className={styles.thLabel} />
							{weeks.map((h, i) => {
								const colPeriod = weekSources[i] ?? calendarCurrentMonthLabel;
								const suffix =
									colPeriod !== calendarCurrentMonthLabel
										? colPeriod.slice(0, 3).toLowerCase()
										: null;
								return (
									<th key={h}>
										{h}
										{suffix ? (
											<span className={styles.weekMonthSuffix}> ({suffix})</span>
										) : null}
									</th>
								);
							})}
							<th>Total</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className={styles.wkGroup} colSpan={n + 2}>
								{w.marketingTitle}
							</td>
						</tr>
						<WeeklyRow
							label="Alcance"
							cells={reachW}
							total={monthlyMarketing?.reach ?? mk.totals.reach}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Frequência"
							cells={freqW}
							total={monthlyMarketing?.frequency ?? mk.totals.frequency}
							mode="decimal1"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Visualizações"
							cells={viewsW}
							total={monthlyMarketing?.views ?? mk.totals.views}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Novos seguidores"
							cells={folW}
							total={monthlyMarketing?.followers ?? mk.totals.followers}
							mode="int"
							weekKeys={weeks}
						/>
						<tr>
							<td className={styles.wkGroup} colSpan={n + 2}>
								{w.funnelTitle}
								{w.funnelNote ? (
									<span className={styles.wkGroupNote}> — {w.funnelNote}</span>
								) : null}
							</td>
						</tr>
						<WeeklyRow
							label="Agendadas"
							cells={schW}
							total={funnel.scheduled.value}
							mode="int"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Presenças"
							cells={attW}
							total={funnel.present.value}
							mode="int"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Fechamentos"
							cells={cloW}
							total={funnel.closings.value}
							mode="int"
							weekKeys={weeks}
						/>
						<tr>
							<td className={styles.wkGroup} colSpan={n + 2}>
								{w.salesTitle}
								{w.salesNote ? (
									<span className={styles.wkGroupNote}> — {w.salesNote}</span>
								) : null}
							</td>
						</tr>
						{(w.salesWeekly.byReceptionist ?? []).map((row, ri) => (
							<React.Fragment key={`${row.name}-${ri}`}>
								<WeeklyRow
									label={`${row.name} (leads)`}
									cells={padWeeks(row.leadsByWeek, n)}
									total={row.leadsTotal}
									mode="int"
									weekKeys={weeks}
								/>
								<WeeklyRow
									label={`${row.name} (vendas)`}
									cells={padWeeks(row.salesByWeek, n)}
									total={row.salesTotal}
									mode="int"
									weekKeys={weeks}
								/>
							</React.Fragment>
						))}
						<WeeklyRow
							label="Total Cadastrados"
							cells={padWeeks(w.salesWeekly.leadsByWeek, n)}
							total={w.salesWeekly.leadsGrandTotal}
							mode="int"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Total Convertidos"
							cells={salesW}
							total={salesTotal ?? w.salesWeekly.grandTotal}
							mode="int"
							weekKeys={weeks}
						/>
					</tbody>
				</table>
			</div>
		</>
	);
}
