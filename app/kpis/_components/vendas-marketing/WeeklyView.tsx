import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import styles from "./vendas-marketing.module.css";
import { clsx } from "clsx";
import Link from "next/link";
import { WeeklyProgressionChart } from "./WeeklyProgressionChart";

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

/** Índice da última semana preenchida (não nula) de um array semanal. -1 quando não há nenhuma. */
function lastFilledIdx(arr: Array<number | null>): number {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (arr[i] != null) return i;
	}
	return -1;
}

function sumWeeks(arr: Array<number | null>): number | null {
	let s = 0;
	let has = false;
	for (const v of arr) {
		if (typeof v === "number" && !Number.isNaN(v)) {
			s += v;
			has = true;
		}
	}
	return has ? s : null;
}

function avgWeeks(arr: Array<number | null>): number | null {
	const nums = arr.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
	if (nums.length === 0) return null;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

type Delta = { value: string; isPositive: boolean; isNegative: boolean };

function getDeltaPct(curr: number | null, prev: number | null): Delta | null {
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

function getDeltaAbs(curr: number | null, prev: number | null): Delta | null {
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
): Delta | null {
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

function DeltaBadge({ delta }: { delta: Delta }) {
	return (
		<span
			className={clsx(
				styles.deltaBadge,
				delta.isPositive ? styles.deltaUp : delta.isNegative ? styles.deltaDown : styles.deltaNeutral
			)}
		>
			{delta.isPositive ? "▲" : delta.isNegative ? "▼" : ""}{delta.value}
		</span>
	);
}

/** Uma linha de comparação sob o valor da célula: rótulo + valor comparado + badge de variação. */
type ComparisonLine = { key: string; label: string; text: string; delta: Delta | null };

function CellComparisons({ lines }: { lines: ComparisonLine[] }) {
	if (lines.length === 0) return null;
	return (
		<div className={styles.cellCmpStack}>
			{lines.map((line) => (
				<div key={line.key} className={styles.cellASub}>
					<span className={styles.cellCmpLabel}>{line.label}</span>
					<span className={styles.cellAPrev}>{line.text}</span>
					{line.delta && <DeltaBadge delta={line.delta} />}
				</div>
			))}
		</div>
	);
}

const PREV_WEEK_LABEL = "sem. ant.";

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
	comparisonPeriodLabel?: string | null;
	customSubtextCells?: Array<string | null>;
};

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
	comparisonPeriodLabel,
	customSubtextCells,
}: WeeklyRowProps) {
	const monthLabel = comparisonPeriodLabel ?? "mês ant.";
	// Para S1 a "semana anterior" é a última semana preenchida do mês comparativo.
	const prevMonthLastIdx = lastFilledIdx(comparisonCells);
	const delta = (curr: number | null, prev: number | null) =>
		deltaMode === "abs" ? getDeltaAbs(curr, prev) : getDeltaPct(curr, prev);

	return (
		<tr>
			<td className={styles.tdLabel}>{label}</td>
			{cells.map((c, i) => {
				const isPrimaryMonth = weekSources[i] === (primaryPeriodLabel || calendarCurrentMonthLabel);
				const sameWeekLastMonth = comparisonCells[i];
				const prevWeekVal =
					i > 0 ? cells[i - 1] : prevMonthLastIdx >= 0 ? comparisonCells[prevMonthLastIdx] : null;
				const isCurrentWeek = i === activeWeekIdx;

				const tdClassName = clsx(styles.tdNum, {
					[styles.currentWeekCell]: isCurrentWeek,
				});

				const lines: ComparisonLine[] = [];
				if (isPrimaryMonth && c !== null) {
					if (prevWeekVal !== null) {
						lines.push({
							key: "week",
							label: PREV_WEEK_LABEL,
							text: fmtCell(prevWeekVal, mode),
							delta: delta(c, prevWeekVal),
						});
					}
					if (sameWeekLastMonth !== null && sameWeekLastMonth !== undefined) {
						lines.push({
							key: "month",
							label: monthLabel,
							text: fmtCell(sameWeekLastMonth, mode),
							delta: delta(c, sameWeekLastMonth),
						});
					}
				}

				const customSubtext = customSubtextCells?.[i];

				return (
					<td key={`${label}-${weekKeys[i]}`} className={tdClassName}>
						<div className={styles.cellA}>
							<span className={styles.cellANum}>{fmtCell(c, mode)}</span>
							<CellComparisons lines={lines} />
							{customSubtext ? (
								<div className={styles.cellASub}>
									<span className={styles.cellAPrev}>{customSubtext}</span>
								</div>
							) : null}
						</div>
					</td>
				);
			})}
			<td className={styles.tdTotal}>
				{(() => {
					if (total === null) return "—";

					const showTotalComparison = comparisonTotal !== null && comparisonTotal !== undefined;
					const lines: ComparisonLine[] = showTotalComparison
						? [
								{
									key: "month",
									label: monthLabel,
									text: fmtCell(comparisonTotal, mode),
									delta: delta(total, comparisonTotal as number),
								},
							]
						: [];

					return (
						<div className={styles.cellA}>
							<span className={styles.cellANum}>{fmtCell(total, mode)}</span>
							<CellComparisons lines={lines} />
						</div>
					);
				})()}
			</td>
		</tr>
	);
}

type Props = {
	weekly: SalesMarketingDashboardPayload["weekly"];
	weekSourcePeriod: string[];
	calendarCurrentMonthLabel: string;
	primaryPeriodLabel?: string;
	comparisonPeriodLabel?: string | null;
	/** Total mensal de vendas (kpi_values) do mês primário — usado em meses já fechados. */
	salesTotal?: number | null;
	/** Total mensal de vendas (kpi_values) do mês comparativo. */
	comparisonSalesTotal?: number | null;
	comparisonPayload?: SalesMarketingDashboardPayload | null;
	activeWeekHeader: string;
	periodParam?: string;
};

export function WeeklyView({
	weekly: w,
	weekSourcePeriod,
	calendarCurrentMonthLabel,
	primaryPeriodLabel,
	comparisonPeriodLabel,
	salesTotal,
	comparisonSalesTotal,
	comparisonPayload,
	activeWeekHeader,
	periodParam,
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
	const monthLabel = comparisonPeriodLabel ?? "mês ant.";

	// Colunas semanais do mês comparativo — mesma origem (semanal) dos valores atuais,
	// para que o "Total" compare soma-semanal contra soma-semanal.
	const cw = comparisonPayload?.weekly;
	const cmpReachW = padWeeks(cw?.marketing.reach ?? [], n);
	const cmpFreqW = padWeeks(cw?.marketing.frequency ?? [], n);
	const cmpViewsW = padWeeks(cw?.marketing.views ?? [], n);
	const cmpFolW = padWeeks(cw?.marketing.followers ?? [], n);
	const cmpSchW = padWeeks(cw?.funnelWeekly.scheduled ?? [], n);
	const cmpAttW = padWeeks(cw?.funnelWeekly.attendance ?? [], n);
	const cmpCloW = padWeeks(cw?.funnelWeekly.closings ?? [], n);
	const cmpSalesW = padWeeks(cw?.salesWeekly.totals ?? [], n);
	const cmpLeadsW = padWeeks(cw?.salesWeekly.leadsByWeek ?? [], n);
	const cmpCancW = padWeeks(cw?.salesWeekly.cancellationsByWeek ?? [], n);

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

	/** Comparações (semana anterior + mesma semana do mês anterior) para linhas vendas/leads. */
	const rateComparisonLines = (
		sales: Array<number | null>,
		leads: Array<number | null>,
		cmpSales: Array<number | null>,
		cmpLeads: Array<number | null>,
		i: number,
	): ComparisonLine[] => {
		const lines: ComparisonLine[] = [];
		const currSales = sales[i];
		const currLeads = leads[i];
		if (currSales === null && currLeads === null) return lines;

		const prevMonthLastIdx = lastFilledIdx(cmpSales);
		const prevWeekSales = i > 0 ? sales[i - 1] : prevMonthLastIdx >= 0 ? cmpSales[prevMonthLastIdx] : null;
		const prevWeekLeads = i > 0 ? leads[i - 1] : prevMonthLastIdx >= 0 ? cmpLeads[prevMonthLastIdx] : null;

		const fmtPair = (s: number | null, l: number | null) => {
			const rate = l && l > 0 ? ` (${(((s ?? 0) / l) * 100).toFixed(1).replace(".", ",")}%)` : "";
			return `${s ?? 0}/${l ?? 0}${rate}`;
		};

		if (prevWeekSales !== null || prevWeekLeads !== null) {
			lines.push({
				key: "week",
				label: PREV_WEEK_LABEL,
				text: fmtPair(prevWeekSales, prevWeekLeads),
				delta: getRateDelta(currSales, currLeads, prevWeekSales, prevWeekLeads),
			});
		}
		if (cmpSales[i] !== null || cmpLeads[i] !== null) {
			lines.push({
				key: "month",
				label: monthLabel,
				text: fmtPair(cmpSales[i], cmpLeads[i]),
				delta: getRateDelta(currSales, currLeads, cmpSales[i], cmpLeads[i]),
			});
		}
		return lines;
	};

	return (
		<>
			<h3 className={styles.sectionLabel}>
				Visão semanal — vendas e marketing (dom a sáb)
			</h3>
			<p className={styles.weekPeriodHint}>
				Cada célula mostra o valor da semana e, abaixo, a comparação com a{" "}
				<strong>semana anterior</strong> (<em>{PREV_WEEK_LABEL}</em>) e com a{" "}
				<strong>mesma semana do mês anterior</strong> (<em>{monthLabel}</em>). A semana
				destacada é a semana selecionada ativa.
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
								const weekHref = periodParam
									? `/kpis?tab=semanal&week=${encodeURIComponent(h)}&period=${encodeURIComponent(periodParam)}`
									: `/kpis?tab=semanal&week=${encodeURIComponent(h)}`;
								return (
									<th key={h} className={clsx(thClassName, styles.clickableTh)}>
										<Link
											href={weekHref}
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
							comparisonCells={cmpReachW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedReachTotal}
							comparisonTotal={sumWeeks(cmpReachW)}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Frequência"
							cells={freqW}
							comparisonCells={cmpFreqW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedFreqTotal}
							comparisonTotal={avgWeeks(cmpFreqW)}
							mode="decimal1"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Visualizações"
							cells={viewsW}
							comparisonCells={cmpViewsW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedViewsTotal}
							comparisonTotal={sumWeeks(cmpViewsW)}
							mode="intCompact"
							weekKeys={weeks}
						/>
						<WeeklyRow
							label="Novos seguidores"
							cells={folW}
							comparisonCells={cmpFolW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedFollowersTotal}
							comparisonTotal={sumWeeks(cmpFolW)}
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
							comparisonCells={cmpSchW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedSchTotal}
							comparisonTotal={sumWeeks(cmpSchW)}
							mode="int"
							weekKeys={weeks}
							deltaMode="abs"
						/>
						<WeeklyRow
							label="Presenças"
							cells={attW}
							comparisonCells={cmpAttW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedAttTotal}
							comparisonTotal={sumWeeks(cmpAttW)}
							mode="int"
							weekKeys={weeks}
							deltaMode="abs"
						/>
						<WeeklyRow
							label="Fechamentos"
							cells={cloW}
							comparisonCells={cmpCloW}
							weekSources={weekSources}
							calendarCurrentMonthLabel={calendarCurrentMonthLabel}
							primaryPeriodLabel={primaryPeriodLabel}
							comparisonPeriodLabel={comparisonPeriodLabel}
							activeWeekIdx={activeWeekIdx}
							total={calculatedCloTotal}
							comparisonTotal={sumWeeks(cmpCloW)}
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
							const cmpRow = comparisonPayload?.weekly.salesWeekly.byReceptionist?.find(
								(r) => r.name === row.name
							);
							const cmpLeads = padWeeks(cmpRow?.leadsByWeek ?? [], n);
							const cmpVendas = padWeeks(cmpRow?.salesByWeek ?? [], n);
							return (
								<tr key={`${row.name}-${ri}`}>
									<td className={styles.tdLabel}>{row.name}</td>
									{vendas.map((v, i) => {
										const isPrimaryMonth = weekSources[i] === (primaryPeriodLabel || calendarCurrentMonthLabel);
										const isCurrentWeek = i === activeWeekIdx;

										const currStr = v == null && leads[i] == null ? "—" : `${v ?? 0}/${leads[i] ?? 0}`;
										const currRate = leads[i] && leads[i] > 0 ? `${((v ?? 0) / leads[i] * 100).toFixed(1).replace(".", ",")}%` : "—";

										const tdClassName = clsx(styles.tdNum, {
											[styles.currentWeekCell]: isCurrentWeek,
										});

										const rateStr = currRate !== "—" ? ` (${currRate})` : "";
										const lines = isPrimaryMonth
											? rateComparisonLines(vendas, leads, cmpVendas, cmpLeads, i)
											: [];

										return (
											<td key={`${row.name}-${weeks[i]}`} className={tdClassName}>
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													<CellComparisons lines={lines} />
												</div>
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{(() => {
											const leadsTotal = row.leadsTotal;
											const salesTotalRow = row.salesTotal;
											if (salesTotalRow == null && leadsTotal == null) return "—";

											const prevLeads = cmpRow ? cmpRow.leadsTotal : null;
											const prevSales = cmpRow ? cmpRow.salesTotal : null;

											const currRate = leadsTotal && leadsTotal > 0 ? `${((salesTotalRow ?? 0) / leadsTotal * 100).toFixed(1).replace(".", ",")}%` : "—";
											const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

											const currStr = `${salesTotalRow ?? 0}/${leadsTotal ?? 0}`;
											const prevStr = prevSales == null && prevLeads == null ? null : `${prevSales ?? 0}/${prevLeads ?? 0}`;

											const rateStr = currRate !== "—" ? ` (${currRate})` : "";
											const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

											const lines: ComparisonLine[] = prevStr
												? [
														{
															key: "month",
															label: monthLabel,
															text: `${prevStr}${prevRateStr}`,
															delta: getRateDelta(salesTotalRow, leadsTotal, prevSales, prevLeads),
														},
													]
												: [];

											return (
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													<CellComparisons lines={lines} />
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

										const currStr = v == null && leadsT[i] == null ? "—" : `${v ?? 0}/${leadsT[i] ?? 0}`;
										const currRate = leadsT[i] && leadsT[i] > 0 ? `${((v ?? 0) / leadsT[i] * 100).toFixed(1).replace(".", ",")}%` : "—";

										const tdClassName = clsx(styles.tdNum, {
											[styles.currentWeekCell]: isCurrentWeek,
										});

										const rateStr = currRate !== "—" ? ` (${currRate})` : "";
										const lines = isPrimaryMonth
											? rateComparisonLines(vendasT, leadsT, cmpSalesW, cmpLeadsW, i)
											: [];

										return (
											<td key={`total-${weeks[i]}`} className={tdClassName}>
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													<CellComparisons lines={lines} />
												</div>
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										{(() => {
											const leadsGrand = w.salesWeekly.leadsGrandTotal;
											const isCalendarCurrentMonth = primaryPeriodLabel === calendarCurrentMonthLabel;
											const salesGrand = isCalendarCurrentMonth
												? w.salesWeekly.grandTotal
												: (salesTotal ?? w.salesWeekly.grandTotal);
											if (salesGrand == null && leadsGrand == null) return "—";

											const prevLeads = comparisonPayload?.weekly.salesWeekly.leadsGrandTotal ?? null;
											// O mês comparativo é sempre um mês fechado: usa o total mensal quando existir.
											const prevSales =
												comparisonSalesTotal ??
												comparisonPayload?.weekly.salesWeekly.grandTotal ??
												null;

											const currRate = leadsGrand && leadsGrand > 0 ? `${((salesGrand ?? 0) / leadsGrand * 100).toFixed(1).replace(".", ",")}%` : "—";
											const prevRate = prevLeads && prevLeads > 0 ? `${((prevSales ?? 0) / prevLeads * 100).toFixed(1).replace(".", ",")}%` : "—";

											const currStr = `${salesGrand ?? 0}/${leadsGrand ?? 0}`;
											const prevStr = prevSales == null && prevLeads == null ? null : `${prevSales ?? 0}/${prevLeads ?? 0}`;

											const rateStr = currRate !== "—" ? ` (${currRate})` : "";
											const prevRateStr = prevRate !== "—" ? ` (${prevRate})` : "";

											const lines: ComparisonLine[] = prevStr
												? [
														{
															key: "month",
															label: monthLabel,
															text: `${prevStr}${prevRateStr}`,
															delta: getRateDelta(salesGrand, leadsGrand, prevSales, prevLeads),
														},
													]
												: [];

											return (
												<div className={styles.cellA}>
													<span className={styles.cellANum}>{currStr}{rateStr}</span>
													<CellComparisons lines={lines} />
												</div>
											);
										})()}
									</td>
								</tr>
							);
						})()}

						{/* Linha de Cancelamentos */}
						{(() => {
							const cancW = padWeeks(w.salesWeekly.cancellationsByWeek ?? [], n);
							const cancCumW = padWeeks(w.salesWeekly.cancellationsCumulativeByWeek ?? [], n);
							const cancTotal = w.salesWeekly.cancellationsGrandTotal ?? cancW.reduce((acc: number, v) => acc + (v ?? 0), 0);

							const subtextCells = cancCumW.map((cum, i) => {
								const wk = cancW[i];
								if (cum === null || wk === null) return null;
								return `acum. ${cum}`;
							});

							return (
								<WeeklyRow
									label="Cancelamentos"
									cells={cancW}
									comparisonCells={cmpCancW}
									weekSources={weekSources}
									calendarCurrentMonthLabel={calendarCurrentMonthLabel}
									primaryPeriodLabel={primaryPeriodLabel}
									comparisonPeriodLabel={comparisonPeriodLabel}
									activeWeekIdx={activeWeekIdx}
									total={cancTotal}
									comparisonTotal={sumWeeks(cmpCancW)}
									mode="int"
									weekKeys={weeks}
									deltaMode="abs"
									customSubtextCells={subtextCells}
								/>
							);
						})()}

						{/* Linha de Saldo Líquido semanal */}
						{(() => {
							const netW = padWeeks(w.salesWeekly.netBalanceByWeek ?? [], n);
							const netTotal = (w.salesWeekly.grandTotal ?? 0) - (w.salesWeekly.cancellationsGrandTotal ?? 0);

							return (
								<tr style={{ background: "rgba(0, 0, 0, 0.03)", fontWeight: 600 }}>
									<td className={styles.tdLabel} style={{ fontWeight: 700 }}>
										Saldo semanal
									</td>
									{netW.map((v, i) => {
										const isCurrentWeek = i === activeWeekIdx;
										const isPos = v !== null && v > 0;
										const isNeg = v !== null && v < 0;
										const valStr = v !== null ? (isPos ? `+${v}` : `${v}`) : "—";
										return (
											<td
												key={`net-${weeks[i]}`}
												className={clsx(styles.tdNum, {
													[styles.currentWeekCell]: isCurrentWeek,
												})}
											>
												<div className={styles.cellA}>
													<span
														className={clsx(
															styles.cellANum,
															isPos && styles.deltaUp,
															isNeg && styles.deltaDown
														)}
														style={{ fontWeight: 700 }}
													>
														{valStr}
													</span>
												</div>
											</td>
										);
									})}
									<td className={styles.tdTotal}>
										<div className={styles.cellA}>
											<span
												className={clsx(
													styles.cellANum,
													netTotal > 0 && styles.deltaUp,
													netTotal < 0 && styles.deltaDown
												)}
												style={{ fontWeight: 700 }}
											>
												{netTotal > 0 ? `+${netTotal}` : `${netTotal}`}
											</span>
										</div>
									</td>
								</tr>
							);
						})()}
					</tbody>
				</table>
			</div>

			<WeeklyProgressionChart
				weeks={weeks}
				sales={salesW}
				cancellations={padWeeks(w.salesWeekly.cancellationsByWeek ?? [], n)}
				netBalance={padWeeks(w.salesWeekly.netBalanceByWeek ?? [], n)}
			/>
		</>
	);
}
