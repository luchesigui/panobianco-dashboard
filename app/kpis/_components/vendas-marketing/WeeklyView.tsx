import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";
import { clsx } from "clsx";
import Link from "next/link";

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
	comparisonTotal?: number | null;
	mode: "int" | "decimal1" | "intCompact";
	weekKeys: string[];
	deltaMode?: "pct" | "abs";
	primaryPeriodLabel?: string;
	showWeeklyDelta?: boolean;
};

function getDeltaPct(curr: number | null, prev: number | null): { value: string; isPositive: boolean; isNegative: boolean } | null {
	if (curr === null || prev === null || prev === 0) return null;
	const diff = curr - prev;
	const pct = (diff / prev) * 100;
	const formatted = pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
	return {
		value: formatted.replace(".", ","),
		isPositive: pct > 0.01,
		isNegative: pct < -0.01,
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
	comparisonTotal,
	mode,
	weekKeys,
	deltaMode,
	primaryPeriodLabel,
	showWeeklyDelta,
}: WeeklyRowProps) {
	return (
		<tr>
			<td className={styles.tdLabel}>{label}</td>
			{cells.map((c, i) => {
				const isPrimaryMonth = weekSources[i] === (primaryPeriodLabel || calendarCurrentMonthLabel);
				const prevVal = comparisonCells[i];
				const lastWeekVal = i > 0 ? cells[i - 1] : null;
				const isCurrentWeek = i === activeWeekIdx;

				const tdClassName = clsx(styles.tdNum, {
					[styles.currentWeekCell]: isCurrentWeek,
				});

				const showMonthComparison = isPrimaryMonth && prevVal !== null;
				const showWeekComparison = isPrimaryMonth && showWeeklyDelta && lastWeekVal !== null;

				const currStr = fmtCell(c, mode);
				const weekRateStr = showWeekComparison ? ` (vs ${fmtCell(lastWeekVal, mode)})` : "";
				
				const prevStr = showMonthComparison ? `vs ${fmtCell(prevVal, mode)}` : "";
				const delta = showMonthComparison
					? (deltaMode === "abs" ? getDeltaAbs(c, prevVal) : getDeltaPct(c, prevVal))
					: null;

				return (
					<td key={`${label}-${weekKeys[i]}`} className={tdClassName}>
						<div className={styles.cellA}>
							<span className={styles.cellANum}>{currStr}{weekRateStr}</span>
							{showMonthComparison && (
								<div className={styles.cellASub}>
									<span className={styles.cellAPrev}>{prevStr}</span>
									{delta && (
										<span
											className={clsx(
												styles.deltaBadge,
												delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
											)}
										>
											{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
										</span>
									)}
								</div>
							)}
						</div>
					</td>
				);
			})}
			<td className={styles.tdTotal}>
				{(() => {
					if (total === null) return "—";
					
					const showTotalComparison = comparisonTotal !== null && comparisonTotal !== undefined;
					const currStr = fmtCell(total, mode);
					const prevStr = showTotalComparison ? `vs ${fmtCell(comparisonTotal, mode)}` : "";
					
					const delta = showTotalComparison
						? (deltaMode === "abs" ? getDeltaAbs(total, comparisonTotal) : getDeltaPct(total, comparisonTotal))
						: null;

					return (
						<div className={styles.cellA}>
							<span className={styles.cellANum}>{currStr}</span>
							{showTotalComparison && (
								<div className={styles.cellASub}>
									<span className={styles.cellAPrev}>{prevStr}</span>
									{delta && (
										<span
											className={clsx(
												styles.deltaBadge,
												delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
											)}
										>
											{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
										</span>
									)}
								</div>
							)}
						</div>
					);
				})()}
			</td>
		</tr>
	);
}

type Props = {
	weekly: SalesMarketingDashboardPayload["weekly"];
	funnel: SalesMarketingDashboardPayload["funnel"];
	weekSourcePeriod: string[];
	calendarCurrentMonthLabel: string;
	primaryPeriodLabel?: string;
	salesTotal?: number | null;
	monthlyMarketing?: {
		reach?: number | null;
		frequency?: number | null;
		views?: number | null;
		followers?: number | null;
	} | null;
	primaryPayload?: SalesMarketingDashboardPayload | null;
	comparisonPayload?: SalesMarketingDashboardPayload | null;
	activeWeekHeader: string;
	comparisonTotalReach?: number | null;
	comparisonTotalFrequency?: number | null;
	comparisonTotalViews?: number | null;
	comparisonTotalFollowers?: number | null;
	comparisonTotalScheduled?: number | null;
	comparisonTotalAttendance?: number | null;
	comparisonTotalClosings?: number | null;
};

export function WeeklyView({
	weekly: w,
	funnel,
	weekSourcePeriod,
	calendarCurrentMonthLabel,
	primaryPeriodLabel,
	salesTotal,
	monthlyMarketing,
	primaryPayload,
	comparisonPayload,
	activeWeekHeader,
	comparisonTotalReach,
	comparisonTotalFrequency,
	comparisonTotalViews,
	comparisonTotalFollowers,
	comparisonTotalScheduled,
	comparisonTotalAttendance,
	comparisonTotalClosings,
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

	const currentMonthLabel = primaryPeriodLabel || calendarCurrentMonthLabel;

	// Calculate funnel sums on the fly using cells from current month columns only
	const calculatedSchTotal = schW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);
	const calculatedAttTotal = attW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);
	const calculatedCloTotal = cloW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);

	// Calculate marketing sums/averages on the fly using cells from current month columns only
	const calculatedReachTotal = reachW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);
	const calculatedViewsTotal = viewsW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);
	const calculatedFollowersTotal = folW.reduce((acc: number, v, i) => acc + (weekSources[i] === currentMonthLabel ? (v ?? 0) : 0), 0);
	const calculatedFreqTotal = (() => {
		const currentMonthFreqs = freqW.filter((v, i) => weekSources[i] === currentMonthLabel && typeof v === "number" && !Number.isNaN(v)) as number[];
		if (currentMonthFreqs.length === 0) return 0;
		return currentMonthFreqs.reduce((a: number, b) => a + b, 0) / currentMonthFreqs.length;
	})();

	// Detect calendar current week index to show "Atual" badge
	let calendarWeekIdx = -1;

	const today = new Date();
	const { monthPeriod, weekIdx } = getWeekIndexAndMonth(today);
	const mShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
	const parts = monthPeriod.split("-").map(Number);
	const formattedPeriodLabel = `${mShort[parts[1] - 1]}/${String(parts[0]).slice(-2)}`; // e.g. "Jun/26"

	if (calendarCurrentMonthLabel === formattedPeriodLabel) {
		calendarWeekIdx = weekIdx;
	}

	const activeWeekIdx = weeks.includes(activeWeekHeader) ? weeks.indexOf(activeWeekHeader) : 0;

	return (
		<>
			<h3 className={styles.sectionLabel}>
				Visão semanal — vendas e marketing (dom a sáb)
			</h3>
			<p className={styles.weekPeriodHint}>
				O sufixo entre parênteses no cabeçalho marca colunas cujos valores vêm do{" "}
				<strong>mês anterior ao atual no calendário</strong> (não do mês atual). A semana destacada é a semana selecionada ativa.
			</p>
			<div className={clsx(styles.chartCard, styles.chartCardTable)}>
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
								const isSelected = h === activeWeekHeader;
								const isCalendarCurrent = i === calendarWeekIdx;
								let thClassName = undefined;
								if (isSelected) {
									thClassName = styles.currentWeekHeader;
								}
								return (
									<th key={h} className={clsx(thClassName, styles.clickableTh)}>
										<Link
											href={`/kpis?week=${h}`}
											scroll={false}
											className={styles.thLink}
										>
											<div className={styles.thHeaderWrapper}>
												<span>
													{h}
													{suffix ? (
														<span className={styles.weekMonthSuffix}> ({suffix})</span>
													) : null}
												</span>
												{isCalendarCurrent && (
													<span className={styles.currentWeekBadge}>Atual</span>
												)}
											</div>
										</Link>
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
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedReachTotal}
							comparisonTotal={comparisonTotalReach}
							mode="intCompact"
							weekKeys={weeks}
							showWeeklyDelta={true}
						/>
						<WeeklyRow
							label="Frequência"
							cells={freqW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.frequency ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedFreqTotal}
							comparisonTotal={comparisonTotalFrequency}
							mode="decimal1"
							weekKeys={weeks}
							showWeeklyDelta={true}
						/>
						<WeeklyRow
							label="Visualizações"
							cells={viewsW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.views ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedViewsTotal}
							comparisonTotal={comparisonTotalViews}
							mode="intCompact"
							weekKeys={weeks}
							showWeeklyDelta={true}
						/>
						<WeeklyRow
							label="Novos seguidores"
							cells={folW}
							comparisonCells={padWeeks(comparisonPayload?.weekly.marketing.followers ?? [], n)}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedFollowersTotal}
							comparisonTotal={comparisonTotalFollowers}
							mode="int"
							weekKeys={weeks}
							showWeeklyDelta={true}
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
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedSchTotal}
							comparisonTotal={comparisonTotalScheduled}
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
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedAttTotal}
							comparisonTotal={comparisonTotalAttendance}
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
							primaryPeriodLabel={primaryPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedCloTotal}
							comparisonTotal={comparisonTotalClosings}
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
							return (
								<tr key={`${row.name}-${ri}`}>
									<td className={styles.tdLabel}>{row.name}</td>
									{vendas.map((v, i) => {
										const isPrimaryMonth = weekSources[i] === (primaryPeriodLabel || calendarCurrentMonthLabel);
										const isCurrentWeek = i === activeWeekIdx;
										const prevRecepRow = comparisonPayload?.weekly.salesWeekly.byReceptionist?.find(
											(r) => r.name === row.name
										);
										const prevLeads = prevRecepRow ? padWeeks(prevRecepRow.leadsByWeek, n)[i] : null;
										const prevSales = prevRecepRow ? padWeeks(prevRecepRow.salesByWeek, n)[i] : null;

										const showComparison = isPrimaryMonth && (prevLeads !== null || prevSales !== null);
										
										const currStr = v == null && leads[i] == null ? "—" : `${v ?? 0}/${leads[i] ?? 0}`;
										const currRate = leads[i] && leads[i] > 0 ? `${((v ?? 0) / leads[i] * 100).toFixed(1).replace(".", ",")}%` : "—";

										const prevStr = prevSales == null && prevLeads == null ? "—" : `${prevSales ?? 0}/${prevLeads ?? 0}`;
										const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

										const tdClassName = clsx(styles.tdNum, {
											[styles.currentWeekCell]: isCurrentWeek,
										});

										const delta = getRateDelta(v, leads[i], prevSales, prevLeads);

										const rateStr = currRate !== "—" ? ` (${currRate})` : "";
										const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

										return (
											<td key={`${row.name}-${weeks[i]}`} className={tdClassName}>
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													{showComparison && (
														<div className={styles.cellASub}>
															<span className={styles.cellAPrev}>vs {prevStr}{prevRateStr}</span>
															{delta && (
																<span
																	className={clsx(
																		styles.deltaBadge,
																		delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
																	)}
																>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													)}
												</div>
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{(() => {
											const leadsTotal = row.leadsTotal;
											const salesTotal = row.salesTotal;
											if (salesTotal == null && leadsTotal == null) return "—";

											const prevRecepRow = comparisonPayload?.weekly.salesWeekly.byReceptionist?.find(
												(r) => r.name === row.name
											);
											const prevLeads = prevRecepRow ? prevRecepRow.leadsTotal : null;
											const prevSales = prevRecepRow ? prevRecepRow.salesTotal : null;

											const currRate = leadsTotal && leadsTotal > 0 ? `${((salesTotal ?? 0) / leadsTotal * 100).toFixed(1).replace(".", ",")}%` : "—";
											const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

											const currStr = `${salesTotal ?? 0}/${leadsTotal ?? 0}`;
											const prevStr = prevSales == null && prevLeads == null ? null : `${prevSales ?? 0}/${prevLeads ?? 0}`;

											const delta = getRateDelta(salesTotal, leadsTotal, prevSales, prevLeads);
											const rateStr = currRate !== "—" ? ` (${currRate})` : "";
											const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

											return (
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													{prevStr && (
														<div className={styles.cellASub}>
															<span className={styles.cellAPrev}>vs {prevStr}{prevRateStr}</span>
															{delta && (
																<span
																	className={clsx(
																		styles.deltaBadge,
																		delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
																	)}
																>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													)}
												</div>
											);
										})()}
									</td>
								</tr>
							);
						})}
						{(() => {
							const leadsT = padWeeks(w.salesWeekly.leadsByWeek, n);
							const vendasT = salesW;
							return (
								<tr>
									<td className={styles.tdLabel}>Total</td>
									{vendasT.map((v, i) => {
										const isPrimaryMonth = weekSources[i] === (primaryPeriodLabel || calendarCurrentMonthLabel);
										const isCurrentWeek = i === activeWeekIdx;
										const prevLeads = comparisonPayload?.weekly.salesWeekly.leadsByWeek[i] ?? null;
										const prevSales = comparisonPayload?.weekly.salesWeekly.totals[i] ?? null;

										const showComparison = isPrimaryMonth && (prevLeads !== null || prevSales !== null);

										const currStr = v == null && leadsT[i] == null ? "—" : `${v ?? 0}/${leadsT[i] ?? 0}`;
										const currRate = leadsT[i] && leadsT[i] > 0 ? `${((v ?? 0) / leadsT[i] * 100).toFixed(1).replace(".", ",")}%` : "—";

										const prevStr = prevSales == null && prevLeads == null ? "—" : `${prevSales ?? 0}/${prevLeads ?? 0}`;
										const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

										const tdClassName = clsx(styles.tdNum, {
											[styles.currentWeekCell]: isCurrentWeek,
										});

										const delta = getRateDelta(v, leadsT[i], prevSales, prevLeads);

										const rateStr = currRate !== "—" ? ` (${currRate})` : "";
										const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

										return (
											<td key={`total-${weeks[i]}`} className={tdClassName}>
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													{showComparison && (
														<div className={styles.cellASub}>
															<span className={styles.cellAPrev}>vs {prevStr}{prevRateStr}</span>
															{delta && (
																<span
																	className={clsx(
																		styles.deltaBadge,
																		delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
																	)}
																>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													)}
												</div>
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{(() => {
											const leadsGrand = w.salesWeekly.leadsGrandTotal;
											const salesGrand = salesTotal ?? w.salesWeekly.grandTotal;
											if (salesGrand == null && leadsGrand == null) return "—";

											const prevLeads = comparisonPayload?.weekly.salesWeekly.leadsGrandTotal ?? null;
											const prevSales = comparisonPayload?.weekly.salesWeekly.grandTotal ?? null;

											const currRate = leadsGrand && leadsGrand > 0 ? `${((salesGrand ?? 0) / leadsGrand * 100).toFixed(1).replace(".", ",")}%` : "—";
											const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

											const currStr = `${salesGrand ?? 0}/${leadsGrand ?? 0}`;
											const prevStr = prevSales == null && prevLeads == null ? null : `${prevSales ?? 0}/${prevLeads ?? 0}`;

											const delta = getRateDelta(salesGrand, leadsGrand, prevSales, prevLeads);
											const rateStr = currRate !== "—" ? ` (${currRate})` : "";
											const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

											return (
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													{prevStr && (
														<div className={styles.cellASub}>
															<span className={styles.cellAPrev}>vs {prevStr}{prevRateStr}</span>
															{delta && (
																<span
																	className={clsx(
																		styles.deltaBadge,
																		delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
																	)}
																>
																	{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
																</span>
															)}
														</div>
													)}
												</div>
											);
										})()}
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
