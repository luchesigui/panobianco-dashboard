import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";

function getWeekIndexAndMonth(date: Date): { monthPeriod: string; weekIdx: number } {
	const startOfWeek = new Date(date);
	startOfWeek.setDate(date.getDate() - date.getDay());

	const wednesday = new Date(startOfWeek);
	wednesday.setDate(startOfWeek.getDate() + 3);

	const ownerYear = wednesday.getFullYear();
	const ownerMonthNum = wednesday.getMonth(); // 0-based

	const ownerMonthPeriod = `${ownerYear}-${String(ownerMonthNum + 1).padStart(2, "0")}-01`;

	const firstDayOfMonth = new Date(ownerYear, ownerMonthNum, 1);
	const firstWednesday = new Date(firstDayOfMonth);
	const dayOfWeek = firstDayOfMonth.getDay();
	const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
	firstWednesday.setDate(firstDayOfMonth.getDate() + daysUntilWednesday);

	const firstWeekSunday = new Date(firstWednesday);
	firstWeekSunday.setDate(firstWednesday.getDate() - 3);

	const diffMs = startOfWeek.getTime() - firstWeekSunday.getTime();
	const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));

	return {
		monthPeriod: ownerMonthPeriod,
		weekIdx: diffWeeks,
	};
}

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
	comparisonCells: Array<number | null>;
	weekSources: string[];
	calendarCurrentMonthLabel: string;
	activeWeekIdx: number;
	total: number | null;
	mode: "int" | "decimal1" | "intCompact";
	weekKeys: string[];
	deltaMode?: "pct" | "abs";
};

function getDeltaPct(curr: number | null, prev: number | null): { value: string; isPositive: boolean; isNegative: boolean } | null {
	if (curr === null || prev === null || prev === 0) return null;
	const diff = curr - prev;
	const pct = (diff / prev) * 100;
	const formatted = pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
	return {
		value: formatted.replace(".", ","),
		isPositive: pct > 0,
		isNegative: pct < 0,
	};
}

function getDeltaAbs(curr: number | null, prev: number | null): { value: string; isPositive: boolean; isNegative: boolean } | null {
	if (curr === null || prev === null) return null;
	const diff = curr - prev;
	if (diff === 0) {
		return { value: "0", isPositive: false, isNegative: false };
	}
	const formatted = diff > 0 ? `+${diff}` : `${diff}`;
	return {
		value: formatted,
		isPositive: diff > 0,
		isNegative: diff < 0,
	};
}

function getRateDelta(
	currSales: number | null,
	currLeads: number | null,
	prevSales: number | null,
	prevLeads: number | null
): { value: string; isPositive: boolean; isNegative: boolean } | null {
	if (currSales === null || currLeads === null || currLeads === 0) return null;
	if (prevSales === null || prevLeads === null || prevLeads === 0) return null;

	const currRate = currSales / currLeads;
	const prevRate = prevSales / prevLeads;
	const diff = (currRate - prevRate) * 100;

	if (Math.abs(diff) < 0.01) {
		return { value: "0,0%", isPositive: false, isNegative: false };
	}
	const formatted = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
	return {
		value: formatted.replace(".", ","),
		isPositive: diff > 0.01,
		isNegative: diff < -0.01,
	};
}

function WeeklyRow({
	label,
	cells,
	comparisonCells,
	weekSources,
	calendarCurrentMonthLabel,
	activeWeekIdx,
	total,
	mode,
	weekKeys,
	deltaMode,
}: WeeklyRowProps) {
	return (
		<tr>
			<td className={styles.tdLabel}>{label}</td>
			{cells.map((c, i) => {
				const isCurrentMonth = weekSources[i] === calendarCurrentMonthLabel;
				const prevVal = comparisonCells[i];
				const isCurrentWeek = i === activeWeekIdx;

				let tdClassName = styles.tdNum;
				if (isCurrentWeek) {
					tdClassName = `${styles.tdNum} ${styles.currentWeekCell}`;
				}

				const showComparison = isCurrentMonth && prevVal !== null;

				return (
					<td key={`${label}-${weekKeys[i]}`} className={tdClassName}>
						{showComparison ? (
							<div className={styles.cellComparisonStack}>
								<span className={styles.cellCurrVal}>{fmtCell(c, mode)}</span>
								<div className={styles.cellPrevRow}>
									<span className={styles.cellPrevVal}>{fmtCell(prevVal, mode)}</span>
									{(() => {
										const delta = deltaMode === "abs"
											? getDeltaAbs(c, prevVal)
											: getDeltaPct(c, prevVal);
										if (!delta) return null;
										return (
											<span className={`${styles.deltaBadge} ${delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral}`}>
												{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
											</span>
										);
									})()}
								</div>
							</div>
						) : (
							<span className={styles.cellCurrVal}>{fmtCell(c, mode)}</span>
						)}
					</td>
				);
			})}
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
	primaryPayload?: SalesMarketingDashboardPayload | null;
	comparisonPayload?: SalesMarketingDashboardPayload | null;
};

export function WeeklyView({
	weekly: w,
	funnel,
	weekSourcePeriod,
	calendarCurrentMonthLabel,
	salesTotal,
	monthlyMarketing,
	primaryPayload,
	comparisonPayload,
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

	// Detect active week index (calendar week if current month is displayed, else last week with data)
	let activeWeekIdx = -1;

	const today = new Date();
	const { monthPeriod, weekIdx } = getWeekIndexAndMonth(today);
	const mShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
	const parts = monthPeriod.split("-").map(Number);
	const formattedPeriodLabel = `${mShort[parts[1] - 1]}/${String(parts[0]).slice(-2)}`; // e.g. "Jun/26"

	if (calendarCurrentMonthLabel === formattedPeriodLabel) {
		activeWeekIdx = weekIdx;
	} else if (primaryPayload?.weekly) {
		const pw = primaryPayload.weekly;
		for (let i = n - 1; i >= 0; i--) {
			const hasData =
				pw.marketing.reach[i] != null ||
				pw.marketing.frequency[i] != null ||
				pw.marketing.views[i] != null ||
				pw.marketing.followers[i] != null ||
				pw.funnelWeekly.scheduled[i] != null ||
				pw.funnelWeekly.attendance[i] != null ||
				pw.funnelWeekly.closings[i] != null ||
				pw.salesWeekly.totals[i] != null;
			if (hasData) {
				activeWeekIdx = i;
				break;
			}
		}
	}

	// Fallback: latest week in the merged table with data
	if (activeWeekIdx === -1) {
		for (let i = n - 1; i >= 0; i--) {
			const hasData =
				w.marketing.reach[i] != null ||
				w.marketing.frequency[i] != null ||
				w.marketing.views[i] != null ||
				w.marketing.followers[i] != null ||
				w.funnelWeekly.scheduled[i] != null ||
				w.funnelWeekly.attendance[i] != null ||
				w.funnelWeekly.closings[i] != null ||
				w.salesWeekly.totals[i] != null;
			if (hasData) {
				activeWeekIdx = i;
				break;
			}
		}
	}

	if (activeWeekIdx === -1) {
		activeWeekIdx = 0; // fallback to S1
	}

	return (
		<>
			<h3 className={styles.sectionLabel}>
				Visão semanal — vendas e marketing (dom a sáb)
			</h3>
			<p className={styles.weekPeriodHint}>
				O sufixo entre parênteses no cabeçalho marca colunas cujos valores vêm do{" "}
				<strong>mês anterior ao atual no calendário</strong> (não do mês atual). A semana destacada é a semana atual ativa.
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
								const isCurrent = i === activeWeekIdx;
								let thClassName = undefined;
								if (isCurrent) {
									thClassName = styles.currentWeekHeader;
								}
								return (
									<th key={h} className={thClassName}>
										<div className={styles.thHeaderWrapper}>
											<span>
												{h}
												{suffix ? (
													<span className={styles.weekMonthSuffix}> ({suffix})</span>
												) : null}
											</span>
											{isCurrent && (
												<span className={styles.currentWeekBadge}>Atual</span>
											)}
										</div>
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
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.reach ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={monthlyMarketing?.reach ?? mk.totals.reach}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Frequência"
							cells={freqW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.frequency ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={monthlyMarketing?.frequency ?? mk.totals.frequency}
							mode="decimal1"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Visualizações"
							cells={viewsW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.views ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={monthlyMarketing?.views ?? mk.totals.views}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Novos seguidores"
							cells={folW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.followers ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
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
							comparisonCells={padWeeks(comparisonPayload?.weekly.funnelWeekly.scheduled ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={funnel.scheduled.value}
							mode="int"
							weekKeys={weeks}
							deltaMode="abs"
						/>
						<WeeklyRow
							label="Presenças"
							cells={attW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.funnelWeekly.attendance ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={funnel.present.value}
							mode="int"
							weekKeys={weeks}
							deltaMode="abs"
						/>
						<WeeklyRow
							label="Fechamentos"
							cells={cloW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.funnelWeekly.closings ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							activeWeekIdx={activeWeekIdx}
							total={funnel.closings.value}
							mode="int"
							weekKeys={weeks}
							deltaMode="abs"
						/>
						<tr>
							<td className={styles.wkGroup} colSpan={n + 2}>
								{w.salesTitle}
								{w.salesNote ? (
									<span className={styles.wkGroupNote}> — {w.salesNote}</span>
								) : null}
							</td>
						</tr>
						{(w.salesWeekly.byReceptionist ?? []).map((row, ri) => {
							const leads = padWeeks(row.leadsByWeek, n);
							const vendas = padWeeks(row.salesByWeek, n);
							const fmtPair = (v: number | null, l: number | null) =>
								v == null && l == null ? "—" : `${v ?? "—"}/${l ?? "—"}`;
							return (
								<tr key={`${row.name}-${ri}`}>
									<td className={styles.tdLabel}>{row.name}</td>
									{vendas.map((v, i) => {
										const isCurrentMonth = weekSources[i] === calendarCurrentMonthLabel;
										const isCurrentWeek = i === activeWeekIdx;
										const prevRecepRow = comparisonPayload?.weekly.salesWeekly.byReceptionist?.find(
											(r) => r.name === row.name
										);
										const prevLeads = prevRecepRow ? padWeeks(prevRecepRow.leadsByWeek, n)[i] : null;
										const prevSales = prevRecepRow ? padWeeks(prevRecepRow.salesByWeek, n)[i] : null;

										const showComparison = isCurrentMonth && (prevLeads !== null || prevSales !== null);
										const currStr = fmtPair(v, leads[i]);
										const prevStr = fmtPair(prevSales, prevLeads);

										let tdClassName = styles.tdNum;
										if (isCurrentWeek) {
											tdClassName = `${styles.tdNum} ${styles.currentWeekCell}`;
										}

										const delta = getRateDelta(v, leads[i], prevSales, prevLeads);

										return (
											<td key={`${row.name}-${weeks[i]}`} className={tdClassName}>
												{showComparison ? (
													<div className={styles.cellComparisonStack}>
														<span className={styles.cellCurrVal}>{currStr}</span>
														<div className={styles.cellPrevRow}>
															<span className={styles.cellPrevValLabel}>vs {prevStr}</span>
															{delta && (
																<span className={`${styles.deltaBadge} ${delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral}`}>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													</div>
												) : (
													<span className={styles.cellCurrVal}>{currStr}</span>
												)}
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{fmtPair(row.salesTotal, row.leadsTotal)}
									</td>
								</tr>
							);
						})}
						{(() => {
							const leadsT = padWeeks(w.salesWeekly.leadsByWeek, n);
							const vendasT = salesW;
							const fmtPair = (v: number | null, l: number | null) =>
								v == null && l == null ? "—" : `${v ?? "—"}/${l ?? "—"}`;
							return (
								<tr>
									<td className={styles.tdLabel}>Total</td>
									{vendasT.map((v, i) => {
										const isCurrentMonth = weekSources[i] === calendarCurrentMonthLabel;
										const isCurrentWeek = i === activeWeekIdx;
										const prevLeads = comparisonPayload?.weekly.salesWeekly.leadsByWeek[i] ?? null;
										const prevSales = comparisonPayload?.weekly.salesWeekly.totals[i] ?? null;

										const showComparison = isCurrentMonth && (prevLeads !== null || prevSales !== null);
										const currStr = fmtPair(v, leadsT[i]);
										const prevStr = fmtPair(prevSales, prevLeads);

										let tdClassName = styles.tdNum;
										if (isCurrentWeek) {
											tdClassName = `${styles.tdNum} ${styles.currentWeekCell}`;
										}

										const delta = getRateDelta(v, leadsT[i], prevSales, prevLeads);

										return (
											<td key={`total-${weeks[i]}`} className={tdClassName}>
												{showComparison ? (
													<div className={styles.cellComparisonStack}>
														<span className={styles.cellCurrVal}>{currStr}</span>
														<div className={styles.cellPrevRow}>
															<span className={styles.cellPrevValLabel}>vs {prevStr}</span>
															{delta && (
																<span className={`${styles.deltaBadge} ${delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral}`}>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													</div>
												) : (
													<span className={styles.cellCurrVal}>{currStr}</span>
												)}
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{fmtPair(salesTotal ?? w.salesWeekly.grandTotal, w.salesWeekly.leadsGrandTotal)}
									</td>
								</tr>
							);
						})()}
					</tbody>
				</table>
			</div>
		</>
	);
}
