import { isDividendExpense } from "@/lib/data/expense-mapping";
import { applyFinancePageFallbacks } from "@/lib/data/finance-fallbacks";
import {
	applyRoiPageFallbacks,
	type RoiChartPayload,
} from "@/lib/data/roi-fallbacks";
import {
	isExperimentalFunnelEmpty,
	mergeSmWeeklyWithPeriodSource,
	normalizeSmPayloadWeeks,
} from "@/lib/data/sales-marketing-payload-merge";
import { assemblePayloadFromNormalized } from "@/lib/data/vendas-marketing-assembler";
import {
	EXPENSE_DONUT_COLOR,
	HISTORY_BAR_COLORS,
	ROI_COMPOSITION_COLOR,
} from "@/lib/kpis/card-bar-colors";
import { formatCompactBrl } from "@/lib/kpis/format";
import { getServiceSupabase } from "@/lib/supabase/server";
import type {
	MonthlySalesBar,
	SalesMarketingDashboardPayload,
} from "@/lib/data/sales-marketing-dashboard";

type KpiMap = Record<string, number>;

export type KpiMetaMap = Record<string, Record<string, unknown>>;

function buildSalesComposition(
	kpis: KpiMap,
): SalesMarketingDashboardPayload["salesComposition"] {
	const ev = kpis["vendas_via_experimental"] ?? 0;
	const online = kpis["vendas_online"] ?? 0;
	const total = kpis["sales_total"] ?? 0;

	if (ev === 0 && online === 0 && total === 0) return undefined;

	const otherVal = Math.max(0, total - ev - online);

	const evPct = total > 0 ? Math.round((ev / total) * 100) : 0;
	const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;
	const otherPct = total > 0 ? Math.round((otherVal / total) * 100) : 0;

	const presentConversion = kpis["present_conversion_rate"];
	const presentConversionStr =
		presentConversion != null
			? ` · ${Math.round(presentConversion)}% conversão presentes`
			: "";

	return {
		sectionTitle: "Composição das vendas",
		experimental: {
			title: "Via aula experimental",
			value: ev,
			subtext: `${evPct}% do total${presentConversionStr}`,
		},
		online: {
			title: "Venda online",
			value: online,
			subtext: `${onlinePct}% do total`,
		},
		otherChannels: {
			title: "Outros canais",
			value: otherVal,
			subtext: `${otherPct}% do total · Indicação, passou na frente, outros`,
		},
	};
}

/** Retenção section: student base line chart + inadimplência donut (reference dashboard). */
export type RetentionChartPayload = {
	chartLabels: string[];
	baseHistoric: (number | null)[];
	baseProjection: (number | null)[];
	baseGoalLine: number;
	inadimplencia: {
		titleSuffix: string;
		recordCount: number;
		recovered: number;
		open: number;
		cancelled: number;
		valueRecovered: number;
		valueOpen: number;
	};
};

/** Financeiro: stacked operating revenue + signed operational result (reference charts). */
export type FinanceChartPayload = {
	labels: string[];
	stacked: {
		matriculated: number[];
		wellhub: number[];
		totalpass: number[];
		products: number[];
		uncategorized: number[];
	};
	operationalResult: number[];
};

export type { RoiChartPayload } from "@/lib/data/roi-fallbacks";

/** Next-month projection from latest real month + MoM trend (clamped). */
export type ForecastAnalysisItem = {
	type: "info" | "good" | "bad" | "warn";
	body: string;
};

export type NextMonthForecastPayload = {
	hasData: boolean;
	nextPeriodLabel: string;
	basisPeriodLabel: string;
	previousPeriodLabel?: string;
	revenueForecast: number;
	expenseForecast: number;
	resultForecast: number;
	marginPct: number;
	matriculatedForecast: number;
	/** Forecast vs último mês real (base). */
	revenueVsBasisPct: number;
	matriculatedVsBasisPct: number;
	expenseSubline: string;
	matriculatedSubline: string | null;
	analysis: ForecastAnalysisItem[];
	revenueChart: {
		labels: [string, string];
		stacked: {
			matriculated: [number, number];
			wellhub: [number, number];
			totalpass: [number, number];
			products: [number, number];
			uncategorized: [number, number];
		};
	};
	expenseDonut: Array<{ label: string; value: number; color: string }>;
	projectedStudents?: number;
	baseStudentsPast?: number;
	weeklyNetBalance?: number | null;
	ticketMedio?: number;
	expenseTooltip?: string;
	productsTooltip?: string;
	resultTooltip?: string;
};

export type ExecutiveSixMonthsPayload = {
	periods: string[];
	periodIds: string[];
	financial: {
		revenue: number[];
		expenses: number[];
		operationalResult: number[];
		marginPercent: number[];
		avgRevenue: number;
		avgExpenses: number;
		accumulatedResult: number;
		avgMarginPercent: number;
	};
	students: {
		baseEnd: (number | null)[];
		newSales: number[];
		exits: (number | null)[];
		cancellations: (number | null)[];
		nonRenewed: (number | null)[];
		netGrowth: (number | null)[];
		goals: (number | null)[];
		totalNetGrowth: number;
		avgNewSales: number;
		avgExits: number;
	};
	defaultRisk: {
		openValues: (number | null)[];
		recoveredValues: (number | null)[];
	};
};

export type ExecutiveMonthSnapshot = {
	baseStudents: {
		value: number | null;
		goal: number | null;
		isPartial: boolean;
		pendingNote?: string;
	};
	sales: {
		value: number | null;
		goal: number | null;
		gap: number | null;
		isPartial: boolean;
	};
	revenue: {
		value: number | null;
		deltaMoM: number | null;
		matriculatedPercent: number | null;
	};
	operationalResult: {
		value: number | null;
		marginPercent: number | null;
		isRecord: boolean;
		result100PctNf: number | null;
		dividendsDistributed?: number | null;
		netProfitAfterDividends?: number | null;
	};
	exits: {
		total: number | null;
		cancellations: number | null;
		nonRenewed: number | null;
		netBalance: number | null;
	};
	defaultRisk: {
		openCount: number | null;
		openValue: number | null;
		recoveredCount: number | null;
		recoveredValue: number | null;
		recoveryRatePct: number | null;
		pill3d?: string;
	};
};

export type KpiPageData = {
	gymName: string;
	kpiDataPeriod: string;
	selectedPeriod: string;
	prevPeriodId?: string;
	nextPeriodId?: string;
	availablePeriods: string[];
	smPrimaryPeriod: string;
	/** True when monthly KPI data is loaded from current calendar month, false when fallback is previous month. */
	isCurrentMonthData: boolean;
	/** Current calendar month label, e.g. "Abr/26" — used in header and weekly section badge. */
	currentMonthLabel: string;
	/** Monthly KPI data period label (previous calendar month), e.g. "Mar/26". */
	currentPeriodLabel: string;
	previousPeriodLabel?: string;
	/** Two months before current (e.g. Jan when current is Mar and previous is Feb). */
	previousPreviousPeriodLabel?: string;
	current: KpiMap;
	previous: KpiMap;
	previousPrevious: KpiMap;
	currentMeta: KpiMetaMap;
	retentionCharts: RetentionChartPayload;
	insights: Record<
		string,
		Array<{ type: string; title: string; body: string; meta_json?: any }>
	>;
	analysis: Array<{ section: string; analysis: string; category: string }>;
	featureOfMonth: {
		title: string;
		description: string;
		status?: string;
		impact: Record<string, number>;
	} | null;
	salesMarketingDashboard: {
		payload: SalesMarketingDashboardPayload | null;
		previousPayload: SalesMarketingDashboardPayload | null;
		primaryPayload: SalesMarketingDashboardPayload | null;
		comparisonPayload: SalesMarketingDashboardPayload | null;
		monthlySalesChart: MonthlySalesBar[];
		salesTarget: number;
		/** Short label for the primary SM month, e.g. "Mai/26". */
		primaryPeriodLabel: string;
		/** Comparison month for deltas (previous calendar month in the chosen window), e.g. "Abr/26". */
		comparisonPeriodLabel: string | null;
		/** Rótulo longo do mês primário da visão semanal, e.g. "Setembro de 2026". */
		primaryPeriodLongLabel: string;
		/** Period id (YYYY-MM-01) do mês primário da visão semanal. */
		primaryPeriodId: string;
		/** Period id (YYYY-MM-01) do mês usado como comparativo da visão semanal. */
		comparisonPeriodId: string;
		/** KPIs mensais (kpi_values) do mês primário da visão semanal. */
		primaryMonthly: KpiMap;
		/** KPIs mensais (kpi_values) do mês comparativo da visão semanal. */
		comparisonMonthly: KpiMap;
		/** Per-week source label (same format as primaryPeriodLabel). */
		weekSourcePeriod: string[];
		/** Rótulo curto do mês corrente no calendário — colunas semanais sem sufixo são deste mês. */
		calendarCurrentMonthLabel: string;
	};
	financeCharts: FinanceChartPayload;
	nextMonthForecast: NextMonthForecastPayload;
	roiCharts: RoiChartPayload;
	gymConfiguration: {
		/** Monthly student-base goal for the current calendar year, indexed 0..11 (Jan..Dec). */
		goal: number[];
		/** Monthly sales target = sum of active consultoras' monthly_goal (fallback 150). */
		salesTarget: number;
	};
	executiveSummary: {
		snapshot: ExecutiveMonthSnapshot;
		sixMonths: ExecutiveSixMonthsPayload;
	};
};

/** Month abbreviations for period chips (reference: `Mar/26`, not `mar. de 26`). */
const MONTH_SHORT_PT = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

/** Normalize DB period (date or ISO string) to YYYY-MM-DD for stable equality. */
function normalizePeriodId(value: unknown): string {
	if (value == null) return "";
	if (value instanceof Date) {
		const y = value.getFullYear();
		const m = String(value.getMonth() + 1).padStart(2, "0");
		const d = String(value.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}
	const s = String(value);
	const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
	return m ? m[1] : s.slice(0, 10);
}

/** Format period as `Março/2026` (full month name, 4-digit year). */
function toLongLabel(periodYyyyMmDd: string): string {
	const n = normalizePeriodId(periodYyyyMmDd);
	const parts = n.split("-").map((x) => Number.parseInt(x, 10));
	const d =
		parts.length === 3 && !parts.some(Number.isNaN)
			? new Date(parts[0], parts[1] - 1, 1)
			: new Date(`${periodYyyyMmDd}T12:00:00`);
	if (Number.isNaN(d.getTime())) return periodYyyyMmDd;
	const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
	return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
}

/** Format period as `Mar/26` (local Y-M-D, no UTC shift). */
function toLabel(periodYyyyMmDd: string): string {
	const n = normalizePeriodId(periodYyyyMmDd);
	const parts = n.split("-").map((x) => Number.parseInt(x, 10));
	if (parts.length !== 3 || parts.some(Number.isNaN)) {
		const d = new Date(periodYyyyMmDd);
		if (Number.isNaN(d.getTime())) return n;
		const mon = MONTH_SHORT_PT[d.getMonth()] ?? "?";
		return `${mon}/${String(d.getFullYear()).slice(-2)}`;
	}
	const [y, mo] = parts;
	const mon = MONTH_SHORT_PT[mo - 1] ?? String(mo);
	return `${mon}/${String(y).slice(-2)}`;
}

/** Labels like "Mar*", "Abr*" for projection months starting at `periodYyyyMmDd`. */
function projectionMonthStarLabels(
	periodYyyyMmDd: string,
	count: number,
): string[] {
	const n = normalizePeriodId(periodYyyyMmDd);
	const parts = n.split("-").map((x) => Number.parseInt(x, 10));
	if (parts.length !== 3 || parts.some(Number.isNaN)) return [];
	const y = parts[0];
	const mo0 = parts[1] - 1;
	const out: string[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date(y, mo0 + i, 1);
		const mon = MONTH_SHORT_PT[d.getMonth()] ?? "?";
		out.push(`${mon}*`);
	}
	return out;
}

function nextPeriodFirstDay(periodYyyyMmDd: string): string {
	const n = normalizePeriodId(periodYyyyMmDd);
	const parts = n.split("-").map((x) => Number.parseInt(x, 10));
	if (parts.length !== 3 || parts.some(Number.isNaN)) return n;
	const d = new Date(parts[0], parts[1] - 1 + 1, 1);
	const y = d.getFullYear();
	const mo = String(d.getMonth() + 1).padStart(2, "0");
	return `${y}-${mo}-01`;
}

function clampForecast(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}

function getRoyaltiesExpenseValue(kpis: KpiMap): number | undefined {
	const exact = kpis["expense_royalties"];
	if (typeof exact === "number") return exact;

	const fuzzyKey = Object.keys(kpis).find(
		(code) =>
			code.startsWith("expense_") &&
			(code.includes("royalties") || code.includes("royalty")),
	);
	if (!fuzzyKey) return undefined;
	const value = kpis[fuzzyKey];
	return typeof value === "number" ? value : undefined;
}

/** MoM ratio capped to avoid extreme projections. */
function monthOverMonthGrowth(
	curr: number,
	prev: number,
	lo: number,
	hi: number,
): number {
	if (prev <= 0 || curr <= 0) return 1;
	return clampForecast(curr / prev, lo, hi);
}

function brlKShort(value: number): string {
	const k = Math.round(Math.abs(value) / 1000);
	return `R$ ${k}k`;
}

/** Integer BRL for meta lines (e.g. imposto teórico 13,4% da receita). */
function brlWholePtBr(value: number): string {
	return Math.round(value).toLocaleString("pt-BR", {
		maximumFractionDigits: 0,
	});
}

function buildNextMonthForecast(
	currentPeriod: string,
	previousPeriod: string | undefined,
	byPeriodFinance: Map<
		string,
		{
			rev?: number;
			m?: number;
			w?: number;
			t?: number;
			p?: number;
			op?: number;
		}
	>,
	current: KpiMap,
	previous: KpiMap,
	currentMeta: KpiMetaMap,
	weeklyNetBalance?: number | null,
): NextMonthForecastPayload {
	const empty = (): NextMonthForecastPayload => ({
		hasData: false,
		nextPeriodLabel: "",
		basisPeriodLabel: "",
		previousPeriodLabel: undefined,
		revenueForecast: 0,
		expenseForecast: 0,
		resultForecast: 0,
		marginPct: 0,
		matriculatedForecast: 0,
		revenueVsBasisPct: 0,
		matriculatedVsBasisPct: 0,
		expenseSubline: "",
		matriculatedSubline: null,
		analysis: [],
		revenueChart: {
			labels: ["", ""] as [string, string],
			stacked: {
				matriculated: [0, 0],
				wellhub: [0, 0],
				totalpass: [0, 0],
				products: [0, 0],
				uncategorized: [0, 0],
			},
		},
		expenseDonut: [],
	});

	const revBasis = current.revenue_total;
	if (revBasis == null || revBasis <= 0) return empty();

	const pid = normalizePeriodId(currentPeriod);
	const slot = byPeriodFinance.get(pid);
	const revSlot = slot?.rev;
	const m0 = slot?.m ?? current.matriculated_revenue ?? 0;
	const w0 = slot?.w ?? current.wellhub_revenue ?? 0;
	const t0 = slot?.t ?? current.totalpass_revenue ?? 0;
	const p0 = slot?.p ?? current.products_revenue ?? 0;
	const sumKnown = m0 + w0 + t0 + p0;
	const u0 = Math.max(0, (revSlot ?? revBasis) - sumKnown);

	const prevRev = previous.revenue_total ?? revBasis;
	const growthRev = monthOverMonthGrowth(revBasis, prevRev, 0.85, 1.15);

	// User rule: Wellhub fixed to 104.848 (R$ 104.848)
	const w1 = 104848;

	// User rule: (base de alunos do mês passado + saldo de alunos das semanas já preenchidas do mês corrente) * ticket médio
	let baseStudentsPast = current.base_students_end ?? 0;
	let ticketMedio = current.avg_ticket ?? 0;

	if (
		baseStudentsPast <= 0 &&
		previous.base_students_end != null &&
		previous.base_students_end > 0
	) {
		baseStudentsPast = previous.base_students_end;
		ticketMedio = previous.avg_ticket ?? ticketMedio;
	}

	if (ticketMedio <= 0 && baseStudentsPast > 0) {
		const mBasis = current.matriculated_revenue ?? m0;
		ticketMedio = Math.round(
			mBasis > 0
				? mBasis / baseStudentsPast
				: Math.max(0, revBasis - w0 - t0) / baseStudentsPast,
		);
	}

	const netBalance = weeklyNetBalance ?? 0;
	const projectedStudents =
		baseStudentsPast > 0 ? baseStudentsPast + netBalance : 0;

	const matBasis = current.matriculated_revenue ?? m0;
	const matriculatedForecast =
		projectedStudents > 0 && ticketMedio > 0
			? Math.round(projectedStudents * ticketMedio)
			: matBasis * growthRev;

	// 3-month average for products revenue up to currentPeriod
	const allPeriodsUpToCurrent = [...byPeriodFinance.keys()]
		.filter((k) => k <= currentPeriod)
		.sort((a, b) => a.localeCompare(b));
	const last3Periods = allPeriodsUpToCurrent.slice(-3);
	const productsHistory = last3Periods
		.map((pid) => byPeriodFinance.get(pid)?.p ?? 0)
		.filter((v) => v > 0);

	const avgProducts3m =
		productsHistory.length > 0
			? Math.round(
					(productsHistory.reduce((sum, v) => sum + v, 0) /
						productsHistory.length) *
						100,
				) / 100
			: p0;

	const t1 = t0;
	const p1 = avgProducts3m;
	const u1 = u0;
	const m1 = matriculatedForecast;

	const revenueForecast = m1 + w1 + t1 + p1 + u1;

	const expBasis = current.expenses_total;
	let expF = 0;
	if (expBasis != null && expBasis > 0) {
		const pe = previous.expenses_total;
		const gExp =
			pe != null && pe > 0
				? monthOverMonthGrowth(expBasis, pe, 0.92, 1.08)
				: growthRev;
		expF = expBasis * gExp;
	} else if (previous.expenses_total != null && previous.expenses_total > 0) {
		expF = previous.expenses_total * growthRev;
	} else {
		const or = current.operational_result;
		if (or == null) return empty();
		expF = Math.max(0, revBasis - or) * growthRev;
	}

	if (expF <= 0) return empty();

	const resultForecast = revenueForecast - expF;
	const marginPct =
		revenueForecast > 0 ? (resultForecast / revenueForecast) * 100 : 0;

	const revenueVsBasisPct = ((revenueForecast - revBasis) / revBasis) * 100;
	const matriculatedVsBasisPct =
		matBasis > 0 ? ((matriculatedForecast - matBasis) / matBasis) * 100 : 0;

	const fixoK = Math.round((expF * 0.62) / 1000);
	const varK = Math.round((expF * 0.38) / 1000);
	const expenseSubline = `Fixo ~R$ ${fixoK}k · Variável ~R$ ${varK}k`;

	let matriculatedSubline: string | null = null;
	const revMeta = currentMeta.revenue_total ?? {};
	const breakdown = revMeta.breakdown as Record<string, number> | undefined;
	let recVal = 0;
	let anuVal = 0;
	let menVal = 0;
	if (breakdown && typeof breakdown === "object") {
		for (const [name, val] of Object.entries(breakdown)) {
			const lower = name.toLowerCase();
			if (lower.includes("recorrente")) recVal += val;
			else if (lower.includes("anual")) anuVal += val;
			else if (lower.includes("mensal") || lower.includes("mensalidade")) menVal += val;
		}
	}
	const fmt = (v: number) => {
		const k = v / 1000;
		return k >= 100
			? `R$ ${Math.round(k)}k`
			: `R$ ${k.toFixed(1).replace(".", ",")}k`;
	};
	if (projectedStudents > 0 && ticketMedio > 0) {
		if ((recVal > 0 || anuVal > 0 || menVal > 0) && matBasis > 0) {
			const s = matriculatedForecast / matBasis;
			matriculatedSubline = `${projectedStudents} alunos · Recorrente ${fmt(recVal * s)} · Anual ${fmt(anuVal * s)}`;
		} else {
			matriculatedSubline = `${projectedStudents} alunos · Ticket R$ ${ticketMedio}`;
		}
	} else if (
		(recVal > 0 || anuVal > 0 || menVal > 0) &&
		matBasis > 0
	) {
		const s = matriculatedForecast / matBasis;
		matriculatedSubline = `Recorrente ${fmt(recVal * s)} · Anual ${fmt(anuVal * s)} · Mensal ${fmt(menVal * s)}`;
	}

	const basisLabel = `${toLabel(currentPeriod)} (real)`;
	const nextLabelFull = toLabel(nextPeriodFirstDay(currentPeriod));
	const forecastLabel = `${nextLabelFull} (previsto)`;

	const analysis: ForecastAnalysisItem[] = [];
	const prevLab = previousPeriod ? toLabel(previousPeriod) : null;
	const balancePart =
		weeklyNetBalance != null
			? ` (${baseStudentsPast} em ${toLabel(currentPeriod)} ${weeklyNetBalance >= 0 ? "+" : ""}${weeklyNetBalance} saldo semanas preenchidas)`
			: "";

	if (projectedStudents > 0 && ticketMedio > 0) {
		analysis.push({
			type: "info",
			body: `A projeção de ${nextLabelFull} considera Wellhub em R$ 104,8k, produtos em ${brlKShort(avgProducts3m)} (média 3m) e base de ${projectedStudents} alunos${balancePart} × ticket médio de R$ ${ticketMedio}. Não substitui o fechamento contábil.`,
		});
	} else {
		analysis.push({
			type: "info",
			body: `A projeção de ${nextLabelFull} replica o ritmo entre ${prevLab ?? "o mês anterior"} e ${toLabel(currentPeriod)} (receita e despesas), com limites para suavizar picos. Não substitui o fechamento contábil.`,
		});
	}

	const revPctRounded = Math.round(revenueVsBasisPct);
	if (revenueVsBasisPct >= 0) {
		analysis.push({
			type: "good",
			body: `Receita prevista de ${brlKShort(revenueForecast)} (${revPctRounded >= 0 ? "+" : ""}${revPctRounded}% vs ${toLabel(currentPeriod)} real, ${brlKShort(revBasis)}).`,
		});
	} else {
		analysis.push({
			type: "bad",
			body: `Receita prevista de ${brlKShort(revenueForecast)} (${revPctRounded}% vs ${toLabel(currentPeriod)} real, ${brlKShort(revBasis)}). Vale revisar mix matriculados / parceiros.`,
		});
	}
	analysis.push({
		type: resultForecast >= 0 ? "warn" : "bad",
		body: `Despesas em torno de ${brlKShort(expF)} (${expenseSubline.toLowerCase()}). Resultado previsto ${resultForecast >= 0 ? "+" : "−"}${brlKShort(Math.abs(resultForecast))}, margem ${marginPct.toFixed(1).replace(".", ",")}%.`,
	});
	analysis.push({
		type: matriculatedVsBasisPct >= 0 ? "good" : "warn",
		body: `Receita de matriculados projetada em ${brlKShort(matriculatedForecast)} — principal base de previsibilidade na composição da receita.`,
	});

	const expenseDonut = [
		{ label: "Pessoal e encargos", value: expF * 0.42, color: EXPENSE_DONUT_COLOR.people },
		{ label: "Infraestrutura", value: expF * 0.28, color: EXPENSE_DONUT_COLOR.infrastructure },
		{ label: "Marketing e vendas", value: expF * 0.18, color: EXPENSE_DONUT_COLOR.marketing },
		{ label: "Demais / pontuais", value: expF * 0.12, color: EXPENSE_DONUT_COLOR.other },
	];

	const gExpPct = expBasis > 0 ? ((expF - expBasis) / expBasis) * 100 : 0;
	const expSign = gExpPct >= 0 ? "+" : "";
	const expenseTooltip = `Projetada a partir da evolução entre ${prevLab ?? "o mês anterior"} e ${toLabel(currentPeriod)} (${expSign}${gExpPct.toFixed(1).replace(".", ",")}%), aplicando a taxa sobre a base de ${toLabel(currentPeriod)} (${brlKShort(expBasis)}). Estimativa: ${expenseSubline.toLowerCase()}.`;

	const productsFormattedList = last3Periods
		.map((pid) => `${toLabel(pid)}: ${brlKShort(byPeriodFinance.get(pid)?.p ?? 0)}`)
		.join(", ");
	const productsTooltip = `Média dos últimos ${last3Periods.length} meses (${productsFormattedList}) = ${brlKShort(avgProducts3m)}.`;

	const resultTooltip = `Resultado previsto = Receita prevista (${brlKShort(revenueForecast)}) − Despesas previstas (${brlKShort(expF)}). Margem estimada de ${marginPct.toFixed(1).replace(".", ",")}% sobre a receita.`;

	return {
		hasData: true,
		nextPeriodLabel: nextLabelFull,
		basisPeriodLabel: toLabel(currentPeriod),
		previousPeriodLabel: previousPeriod ? toLabel(previousPeriod) : undefined,
		revenueForecast,
		expenseForecast: expF,
		resultForecast,
		marginPct,
		matriculatedForecast,
		revenueVsBasisPct,
		matriculatedVsBasisPct,
		expenseSubline,
		matriculatedSubline,
		analysis,
		revenueChart: {
			labels: [basisLabel, forecastLabel],
			stacked: {
				matriculated: [m0, m1],
				wellhub: [w0, w1],
				totalpass: [t0, t1],
				products: [p0, p1],
				uncategorized: [u0, u1],
			},
		},
		expenseDonut,
		projectedStudents: projectedStudents > 0 ? projectedStudents : undefined,
		baseStudentsPast: baseStudentsPast > 0 ? baseStudentsPast : undefined,
		weeklyNetBalance,
		ticketMedio: ticketMedio > 0 ? ticketMedio : undefined,
		expenseTooltip,
		productsTooltip,
		resultTooltip,
	};
}

export async function getKpiPageData(
	gymSlug = "panobianco-sjc-satelite",
	selectedPeriod?: string,
): Promise<KpiPageData> {
	const supabase = getServiceSupabase();

	const { data: gym, error: gymError } = await supabase
		.from("gyms")
		.select("id,name")
		.eq("slug", gymSlug)
		.single();

	if (gymError || !gym)
		throw new Error(`Gym load failed: ${gymError?.message}`);

	const _now = new Date();
	const _pad = (n: number) => String(n).padStart(2, "0");
	const _mk = (d: Date) => `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-01`;
	const smPayloadPeriod = _mk(_now); // current month (SM/weekly)
	const currentMonthPeriod = smPayloadPeriod;
	const prevMonthPeriod = _mk(
		new Date(_now.getFullYear(), _now.getMonth() - 1, 1),
	);

	const [allPeriodsRes, funilPeriodsRes, weeklyPeriodsRes] = await Promise.all([
		supabase.from("kpi_values").select("period_id").eq("gym_id", gym.id),
		supabase.from("funil_mensal").select("period_id").eq("gym_id", gym.id),
		Promise.all([
			supabase.from("marketing_semanal").select("period_id").eq("gym_id", gym.id),
			supabase.from("funil_semanal").select("period_id").eq("gym_id", gym.id),
			supabase.from("conversoes_semanais").select("period_id").eq("gym_id", gym.id),
			supabase.from("recepcao_semanal").select("period_id").eq("gym_id", gym.id),
		]),
	]);

	const rawPeriods = [
		...(allPeriodsRes.data ?? []).map((r) => normalizePeriodId(r.period_id)),
		...(funilPeriodsRes.data ?? []).map((r) => normalizePeriodId(r.period_id)),
		...weeklyPeriodsRes.flatMap((result) =>
			(result.data ?? []).map((r) => normalizePeriodId(r.period_id)),
		),
	];
	const availablePeriods = Array.from(new Set(rawPeriods))
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b));

	let kpiDataPeriod = prevMonthPeriod;
	if (selectedPeriod) {
		const normalized = normalizePeriodId(selectedPeriod);
		if (normalized) {
			kpiDataPeriod = normalized;
		}
	} else if (availablePeriods.length > 0) {
		if (availablePeriods.includes(prevMonthPeriod)) {
			kpiDataPeriod = prevMonthPeriod;
		} else {
			kpiDataPeriod = availablePeriods[availablePeriods.length - 1];
		}
	}

	const getOffsetMonth = (basePeriod: string, offset: number): string => {
		const parts = basePeriod.split("-").map(Number);
		const d = new Date(parts[0], parts[1] - 1 + offset, 1);
		const y = d.getFullYear();
		const mo = String(d.getMonth() + 1).padStart(2, "0");
		return `${y}-${mo}-01`;
	};

	const previousPeriod = getOffsetMonth(kpiDataPeriod, -1);
	const thirdPeriod = getOffsetMonth(kpiDataPeriod, -2);
	const fourthPeriod = getOffsetMonth(kpiDataPeriod, -3);

	const hasCurrentMonthWeeklyData = weeklyPeriodsRes.some((result) =>
		(result.data ?? []).some(
			(row) => normalizePeriodId(row.period_id) === currentMonthPeriod,
		),
	);
	// Quando o usuário escolhe um mês no seletor, a visão semanal segue essa escolha.
	// Sem escolha explícita, o padrão é o mês corrente do calendário (se já tiver dados semanais).
	const hasExplicitPeriod = Boolean(selectedPeriod && normalizePeriodId(selectedPeriod));
	const smPrimaryPeriod = hasExplicitPeriod
		? kpiDataPeriod
		: hasCurrentMonthWeeklyData
			? currentMonthPeriod
			: kpiDataPeriod;
	const smComparisonPeriod = getOffsetMonth(smPrimaryPeriod, -1);

	const currentIndex = availablePeriods.indexOf(kpiDataPeriod);
	let prevPeriodId: string | undefined = undefined;
	let nextPeriodId: string | undefined = undefined;

	if (currentIndex !== -1) {
		if (currentIndex > 0) {
			prevPeriodId = availablePeriods[currentIndex - 1];
		}
		if (currentIndex < availablePeriods.length - 1) {
			nextPeriodId = availablePeriods[currentIndex + 1];
		}
	} else {
		const calcPrev = getOffsetMonth(kpiDataPeriod, -1);
		const calcNext = getOffsetMonth(kpiDataPeriod, 1);
		if (availablePeriods.includes(calcPrev)) prevPeriodId = calcPrev;
		if (availablePeriods.includes(calcNext)) nextPeriodId = calcNext;
	}

	const forecastPeriodId = nextPeriodFirstDay(kpiDataPeriod);

	const fetchPeriodIds = Array.from(
		new Set([
			currentMonthPeriod,
			kpiDataPeriod,
			forecastPeriodId,
			previousPeriod,
			thirdPeriod,
			fourthPeriod,
			smPrimaryPeriod,
			smComparisonPeriod,
		])
	);

	const [
		defsRes,
		valuesRes,
		dashboardRes,
		salesHistoryRes,
		settingsRes,
		consultorasRes,
	] =
		await Promise.all(
		[
			supabase.from("kpi_definitions").select("id,code"),
			supabase
				.from("kpi_values")
				.select("period_id,kpi_definition_id,value_numeric,meta_json")
				.eq("gym_id", gym.id)
				.in("period_id", fetchPeriodIds),
			Promise.all([
				supabase.from("funil_mensal").select("period_id,scheduled,present,closings").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
				supabase.from("marketing_semanal").select("period_id,week_num,reach,frequency,views,followers").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
				supabase.from("funil_semanal").select("period_id,week_num,scheduled,attendance,closings").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
				supabase.from("conversoes_semanais").select("period_id,week_num,leads,sales,cancellations").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
				supabase.from("recepcao_semanal").select("period_id,week_num,receptionist_name,leads,sales").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
			]),
			supabase
				.from("kpi_values")
				.select("period_id,kpi_definition_id,value_numeric,meta_json")
				.eq("gym_id", gym.id)
				.gte("period_id", "2025-04-01")
				.lte("period_id", kpiDataPeriod)
				.order("period_id", { ascending: true }),
			supabase
				.from("gym_settings")
				.select("key,value")
				.eq("gym_id", gym.id)
				.eq("key", "totalInvested"),
			supabase
				.from("consultoras")
				.select("name, monthly_goal")
				.eq("gym_id", gym.id)
				.is("deleted_at", null),
		],
	);

	if (defsRes.error)
		throw new Error(`Definitions load failed: ${defsRes.error.message}`);
	if (valuesRes.error)
		throw new Error(`Values load failed: ${valuesRes.error.message}`);
	if (salesHistoryRes.error)
		throw new Error(
			`Sales history load failed: ${salesHistoryRes.error.message}`,
		);
	if (settingsRes.error)
		throw new Error(`Gym settings load failed: ${settingsRes.error.message}`);
	if (consultorasRes.error)
		throw new Error(`Consultoras load failed: ${consultorasRes.error.message}`);

	const [funilMensalRes, marketingSemRes, funilSemRes, conversoesRes, recepcaoRes] = dashboardRes;
	if (funilMensalRes.error) throw new Error(`Funil mensal load failed: ${funilMensalRes.error.message}`);
	if (marketingSemRes.error) throw new Error(`Marketing semanal load failed: ${marketingSemRes.error.message}`);
	if (funilSemRes.error) throw new Error(`Funil semanal load failed: ${funilSemRes.error.message}`);
	if (conversoesRes.error) throw new Error(`Conversões load failed: ${conversoesRes.error.message}`);
	if (recepcaoRes.error) throw new Error(`Recepção load failed: ${recepcaoRes.error.message}`);

	const consultorasForAssembler = (consultorasRes.data ?? []).map((c) => ({
		name: c.name,
		monthly_goal: c.monthly_goal != null ? Number(c.monthly_goal) : null,
	}));

	const buildSmPayload = (periodId: string): SalesMarketingDashboardPayload | null => {
		const pid = normalizePeriodId(periodId);
		const funil = (funilMensalRes.data ?? []).find((r) => normalizePeriodId(r.period_id) === pid) ?? null;
		const marketing = (marketingSemRes.data ?? []).filter((r) => normalizePeriodId(r.period_id) === pid).map((r) => ({ ...r, reach: r.reach != null ? Number(r.reach) : null, frequency: r.frequency != null ? Number(r.frequency) : null, views: r.views != null ? Number(r.views) : null, followers: r.followers != null ? Number(r.followers) : null }));
		const funilSem = (funilSemRes.data ?? []).filter((r) => normalizePeriodId(r.period_id) === pid);
		const conversoes = (conversoesRes.data ?? []).filter((r) => normalizePeriodId(r.period_id) === pid);
		const recepcao = (recepcaoRes.data ?? []).filter((r) => normalizePeriodId(r.period_id) === pid);
		if (!funil && !marketing.length && !funilSem.length && !conversoes.length && !recepcao.length) return null;
		return assemblePayloadFromNormalized({
			funilMensal: funil ? { scheduled: funil.scheduled, present: funil.present, closings: funil.closings } : null,
			marketingSemanal: marketing,
			funilSemanal: funilSem,
			conversoesSemanal: conversoes,
			recepcaoSemanal: recepcao,
			consultoras: consultorasForAssembler,
			periodLabel: "",
		});
	};

	const smPayloads = fetchPeriodIds.map((pid) => buildSmPayload(pid));
	const hasCurrentMonthData = false;

	const primaryPayload = buildSmPayload(smPrimaryPeriod) ?? assemblePayloadFromNormalized({
		funilMensal: null,
		marketingSemanal: [],
		funilSemanal: [],
		conversoesSemanal: [],
		recepcaoSemanal: [],
		consultoras: consultorasForAssembler,
		periodLabel: toLabel(smPrimaryPeriod),
	});
	const comparisonPayload = buildSmPayload(smComparisonPeriod) ?? assemblePayloadFromNormalized({
		funilMensal: null,
		marketingSemanal: [],
		funilSemanal: [],
		conversoesSemanal: [],
		recepcaoSemanal: [],
		consultoras: consultorasForAssembler,
		periodLabel: toLabel(smComparisonPeriod),
	});

	// Load insights for the resolved periods (separate query after resolution)
	const fetchInsightPeriods = Array.from(new Set([kpiDataPeriod, smPrimaryPeriod]));
	const insightsRes = await supabase
		.from("kpi_insights")
		.select(
			"period_id,category,insight_scope,insight_type,title,body,sort_order,meta_json",
		)
		.eq("gym_id", gym.id)
		.in("period_id", fetchInsightPeriods)
		.order("sort_order", { ascending: true });

	if (insightsRes.error)
		throw new Error(`Insights load failed: ${insightsRes.error.message}`);

	const defIdToCode = new Map((defsRes.data ?? []).map((d) => [d.id, d.code]));
	const salesDefId = defsRes.data?.find((d) => d.code === "sales_total")?.id;
	const baseStudentsGoalDefId = defsRes.data?.find(
		(d) => d.code === "base_students_goal",
	)?.id;

	const currentYear = parseInt(currentMonthPeriod.slice(0, 4), 10);
	const studentBaseGoalsByMonth = new Array(12).fill(0) as number[];
	if (baseStudentsGoalDefId) {
		const goalsRes = await supabase
			.from("kpi_values")
			.select("period_id,value_numeric")
			.eq("gym_id", gym.id)
			.eq("kpi_definition_id", baseStudentsGoalDefId)
			.gte("period_id", `${currentYear}-01-01`)
			.lte("period_id", `${currentYear}-12-01`);
		for (const row of goalsRes.data ?? []) {
			const month = parseInt((row.period_id as string).slice(5, 7), 10);
			if (
				month >= 1 &&
				month <= 12 &&
				typeof row.value_numeric === "number"
			) {
				studentBaseGoalsByMonth[month - 1] = row.value_numeric;
			}
		}
	}


	const revDefId = defsRes.data?.find((d) => d.code === "revenue_total")?.id;
	const expDefId = defsRes.data?.find((d) => d.code === "expenses_total")?.id;
	const matDefId = defsRes.data?.find(
		(d) => d.code === "matriculated_revenue",
	)?.id;
	const whDefId = defsRes.data?.find((d) => d.code === "wellhub_revenue")?.id;
	const tpDefId = defsRes.data?.find((d) => d.code === "totalpass_revenue")?.id;
	const prDefId = defsRes.data?.find((d) => d.code === "products_revenue")?.id;
	const opDefId = defsRes.data?.find(
		(d) => d.code === "operational_result",
	)?.id;

	const financePeriodRows = (salesHistoryRes.data ?? []).filter((r) => {
		const pid = normalizePeriodId(r.period_id);
		return pid >= "2025-04-01" && pid <= kpiDataPeriod;
	});
	const byPeriodFinance = new Map<
		string,
		{
			rev?: number;
			exp?: number;
			m?: number;
			w?: number;
			t?: number;
			p?: number;
			op?: number;
		}
	>();
	for (const row of financePeriodRows) {
		if (row.value_numeric == null) continue;
		const pid = normalizePeriodId(row.period_id);
		const v = Number(row.value_numeric);
		const slot = byPeriodFinance.get(pid) ?? {};
		if (row.kpi_definition_id === revDefId) {
			slot.rev = v;
			if (
				(slot.p == null || slot.p === 0) &&
				row.meta_json &&
				typeof row.meta_json === "object"
			) {
				const b = (row.meta_json as Record<string, any>).breakdown;
				if (b && typeof b === "object") {
					let prodSum = 0;
					for (const [name, val] of Object.entries(b)) {
						const l = name.toLowerCase();
						if (
							l.includes("boutique") ||
							l.includes("lanchonete") ||
							l.includes("outros") ||
							l.includes("não informado")
						) {
							prodSum += Number(val);
						}
					}
					if (prodSum > 0) {
						slot.p = prodSum;
					}
				}
			}
		}
		if (row.kpi_definition_id === expDefId) slot.exp = v;
		if (row.kpi_definition_id === matDefId) slot.m = v;
		if (row.kpi_definition_id === whDefId) slot.w = v;
		if (row.kpi_definition_id === tpDefId) slot.t = v;
		if (row.kpi_definition_id === prDefId && v > 0) slot.p = v;
		if (row.kpi_definition_id === opDefId) slot.op = v;
		byPeriodFinance.set(pid, slot);
	}
	const sortedFinancePeriods = [...byPeriodFinance.keys()].sort((a, b) =>
		a.localeCompare(b),
	);
	const financeCharts: FinanceChartPayload = {
		labels: sortedFinancePeriods.map((pid) => toLabel(pid)),
		stacked: {
			matriculated: [],
			wellhub: [],
			totalpass: [],
			products: [],
			uncategorized: [],
		},
		operationalResult: [],
	};
	for (const pid of sortedFinancePeriods) {
		const s = byPeriodFinance.get(pid);
		if (!s) continue;
		const rev = s.rev ?? 0;
		const m = s.m ?? 0;
		const w = s.w ?? 0;
		const t = s.t ?? 0;
		const p = s.p ?? 0;
		const sum = m + w + t + p;
		const unc = Math.max(0, rev - sum);
		financeCharts.stacked.matriculated.push(m);
		financeCharts.stacked.wellhub.push(w);
		financeCharts.stacked.totalpass.push(t);
		financeCharts.stacked.products.push(p);
		financeCharts.stacked.uncategorized.push(unc);
		const op = s.op ?? (s.rev != null && s.exp != null ? s.rev - s.exp : 0);
		financeCharts.operationalResult.push(op);
	}

	const monthlySalesChart: MonthlySalesBar[] = [];
	if (salesDefId && salesHistoryRes.data?.length) {
		const byPeriod = new Map<string, number>();
		for (const row of salesHistoryRes.data) {
			if (row.kpi_definition_id !== salesDefId || row.value_numeric == null)
				continue;
			const pid = normalizePeriodId(row.period_id);
			byPeriod.set(pid, Number(row.value_numeric));
		}
		const sortedPeriods = [...byPeriod.keys()].sort((a, b) =>
			a.localeCompare(b),
		);
		sortedPeriods.forEach((periodId, i) => {
			const value = byPeriod.get(periodId);
			if (value === undefined) return;
			monthlySalesChart.push({
				periodId,
				label: toLabel(periodId),
				value,
				color: HISTORY_BAR_COLORS[i % HISTORY_BAR_COLORS.length],
			});
		});
	}

	const settingsMap = new Map(
		(settingsRes.data ?? []).map((r) => [r.key as string, r.value as string]),
	);
	const configuredTotalInvestedRaw = settingsMap.get("totalInvested");
	const configuredTotalInvested =
		configuredTotalInvestedRaw != null
			? Number(configuredTotalInvestedRaw)
			: Number.NaN;
	const consultorasSalesTarget = (consultorasRes.data ?? []).reduce(
		(sum, row) => {
			const v = Number(row.monthly_goal);
			return sum + (Number.isFinite(v) && v > 0 ? v : 0);
		},
		0,
	);

	/** Grade semanal: sempre calendário mês corrente × mês anterior (parcial por coluna). */
	let smDashboardPayload: SalesMarketingDashboardPayload | null = null;
	let weekSourcePeriod: string[] = [];
	let weekSourcePeriodId: string[] = [];

	if (primaryPayload || comparisonPayload) {
		const mergedResult = mergeSmWeeklyWithPeriodSource(
			primaryPayload,
			comparisonPayload,
			smPrimaryPeriod,
			comparisonPayload ? smComparisonPeriod : null,
		);
		smDashboardPayload = mergedResult.merged;
		weekSourcePeriodId = mergedResult.weekSourcePeriodId;
		weekSourcePeriod = weekSourcePeriodId.map((id) => toLabel(id));
	}

	if (smDashboardPayload) {
		smDashboardPayload.receptionists = primaryPayload.receptionists;
		smDashboardPayload.receptionistsPeriodLabel = toLabel(smPrimaryPeriod);

		// Force the monthly funnel & composition to come from the resolved general KPI payload (e.g. May/26)
		let monthlyFunnelSource = smPayloads[1]; // May
		if (!monthlyFunnelSource || isExperimentalFunnelEmpty(monthlyFunnelSource.funnel)) {
			monthlyFunnelSource = smPayloads[2]; // April
		}
		if (!monthlyFunnelSource || isExperimentalFunnelEmpty(monthlyFunnelSource.funnel)) {
			monthlyFunnelSource = smPayloads[3]; // March
		}

		if (monthlyFunnelSource) {
			smDashboardPayload.funnel = structuredClone(monthlyFunnelSource.funnel);
			if (monthlyFunnelSource.salesComposition) {
				smDashboardPayload.salesComposition = structuredClone(monthlyFunnelSource.salesComposition);
			}
		}
	}

	let prevSmDashboardPayload: SalesMarketingDashboardPayload | null = null;
	const prevPrimaryPayload = buildSmPayload(previousPeriod) ?? assemblePayloadFromNormalized({
		funilMensal: null,
		marketingSemanal: [],
		funilSemanal: [],
		conversoesSemanal: [],
		recepcaoSemanal: [],
		consultoras: consultorasForAssembler,
		periodLabel: toLabel(previousPeriod),
	});
	const prevComparisonPayload = buildSmPayload(thirdPeriod) ?? assemblePayloadFromNormalized({
		funilMensal: null,
		marketingSemanal: [],
		funilSemanal: [],
		conversoesSemanal: [],
		recepcaoSemanal: [],
		consultoras: consultorasForAssembler,
		periodLabel: toLabel(thirdPeriod),
	});

	if (prevPrimaryPayload || prevComparisonPayload) {
		const mergedResult = mergeSmWeeklyWithPeriodSource(
			prevPrimaryPayload,
			prevComparisonPayload,
			previousPeriod,
			prevComparisonPayload ? thirdPeriod : null,
		);
		prevSmDashboardPayload = mergedResult.merged;
	}

	if (prevSmDashboardPayload) {
		prevSmDashboardPayload.receptionists = prevPrimaryPayload.receptionists;
		prevSmDashboardPayload.receptionistsPeriodLabel = toLabel(previousPeriod);

		let monthlyFunnelSource = buildSmPayload(previousPeriod);
		if (!monthlyFunnelSource || isExperimentalFunnelEmpty(monthlyFunnelSource.funnel)) {
			monthlyFunnelSource = buildSmPayload(thirdPeriod);
		}
		if (!monthlyFunnelSource || isExperimentalFunnelEmpty(monthlyFunnelSource.funnel)) {
			monthlyFunnelSource = buildSmPayload(fourthPeriod);
		}

		if (monthlyFunnelSource) {
			prevSmDashboardPayload.funnel = structuredClone(monthlyFunnelSource.funnel);
			if (monthlyFunnelSource.salesComposition) {
				prevSmDashboardPayload.salesComposition = structuredClone(monthlyFunnelSource.salesComposition);
			}
		}
	}

	const primaryPeriodLabel = toLabel(smPrimaryPeriod);
	const comparisonPeriodLabel =
		comparisonPayload != null ? toLabel(smComparisonPeriod) : null;

	// Totais mensais (kpi_values) dos meses que a visão semanal realmente usa.
	// Evita comparar o mês primário contra ele mesmo quando smPrimaryPeriod != kpiDataPeriod.
	const smPrimaryMonthly: KpiMap = {};
	const smComparisonMonthly: KpiMap = {};
	for (const row of valuesRes.data ?? []) {
		const code = defIdToCode.get(row.kpi_definition_id);
		if (!code || row.value_numeric == null) continue;
		const rowPeriod = normalizePeriodId(row.period_id);
		if (rowPeriod === smPrimaryPeriod) smPrimaryMonthly[code] = Number(row.value_numeric);
		if (rowPeriod === smComparisonPeriod) smComparisonMonthly[code] = Number(row.value_numeric);
	}

	const salesMarketingDashboard = {
		payload: smDashboardPayload,
		previousPayload: prevSmDashboardPayload,
		primaryPayload: primaryPayload ? normalizeSmPayloadWeeks(structuredClone(primaryPayload)) : null,
		comparisonPayload: comparisonPayload ? normalizeSmPayloadWeeks(structuredClone(comparisonPayload)) : null,
		monthlySalesChart,
		salesTarget: consultorasSalesTarget > 0 ? consultorasSalesTarget : 150,
		primaryPeriodLabel,
		primaryPeriodLongLabel: toLongLabel(smPrimaryPeriod),
		comparisonPeriodLabel,
		primaryPeriodId: smPrimaryPeriod,
		comparisonPeriodId: smComparisonPeriod,
		primaryMonthly: smPrimaryMonthly,
		comparisonMonthly: smComparisonMonthly,
		weekSourcePeriod,
		calendarCurrentMonthLabel: toLabel(currentMonthPeriod),
	};
	const current: KpiMap = {};
	const previous: KpiMap = {};
	const previousPrevious: KpiMap = {};
	const currentMeta: KpiMetaMap = {};
	const previousMeta: KpiMetaMap = {};
	const previousPreviousMeta: KpiMetaMap = {};

	for (const row of valuesRes.data) {
		const code = defIdToCode.get(row.kpi_definition_id);
		if (!code || row.value_numeric == null) continue;
		const value = Number(row.value_numeric);
		const rowPeriod = normalizePeriodId(row.period_id);
		if (rowPeriod === kpiDataPeriod) {
			current[code] = value;
			const meta = row.meta_json;
			if (meta && typeof meta === "object" && !Array.isArray(meta)) {
				currentMeta[code] = meta as Record<string, unknown>;
			}
		}
		if (previousPeriod && rowPeriod === previousPeriod) {
			previous[code] = value;
			const meta = row.meta_json;
			if (meta && typeof meta === "object" && !Array.isArray(meta)) {
				previousMeta[code] = meta as Record<string, unknown>;
			}
		}
		if (thirdPeriod && rowPeriod === thirdPeriod) {
			previousPrevious[code] = value;
			const meta = row.meta_json;
			if (meta && typeof meta === "object" && !Array.isArray(meta)) {
				previousPreviousMeta[code] = meta as Record<string, unknown>;
			}
		}
	}

	// Dynamic calculation of matriculated_revenue, products_revenue, and avg_ticket from metadata breakdown
	const computeDynamicRevenuesAndTicket = (
		map: KpiMap,
		metaMap: KpiMetaMap,
		isCurrent: boolean,
	) => {
		const revMeta = metaMap["revenue_total"] ?? {};
		const breakdown = revMeta.breakdown as Record<string, number> | undefined;

		let recorrente = 0;
		let anual = 0;
		let mensal = 0;
		let boutique = 0;
		let lanchonete = 0;
		let hasBreakdown = false;

		if (breakdown && typeof breakdown === "object") {
			hasBreakdown = true;
			for (const [name, val] of Object.entries(breakdown)) {
				const lower = name.toLowerCase();
				if (lower.includes("recorrente")) {
					recorrente += val;
				} else if (lower.includes("anual")) {
					anual += val;
				} else if (lower.includes("mensal") || lower.includes("mensalidade")) {
					mensal += val;
				} else if (lower.includes("boutique")) {
					boutique += val;
				} else if (lower.includes("lanchonete")) {
					lanchonete += val;
				}
			}
		}

		if (hasBreakdown) {
			map["matriculated_revenue"] = recorrente + anual + mensal;
			map["products_revenue"] = boutique + lanchonete;
		}

		// Calculate avg_ticket using formula: (revenue_total - wellhub_revenue - totalpass_revenue) / base_students_end
		const rev = map["revenue_total"];
		const wh = map["wellhub_revenue"] ?? 0;
		const tp = map["totalpass_revenue"] ?? 0;
		const base = map["base_students_end"];

		if (rev != null && base != null && base > 0) {
			const avg = Math.round((rev - wh - tp) / base);
			map["avg_ticket"] = avg;

			if (isCurrent) {
				metaMap["avg_ticket"] = {
					...(metaMap["avg_ticket"] ?? {}),
					partial: true,
				};
			}
		}
	};

	computeDynamicRevenuesAndTicket(current, currentMeta, true);
	computeDynamicRevenuesAndTicket(previous, previousMeta, false);
	computeDynamicRevenuesAndTicket(previousPrevious, previousPreviousMeta, false);

	if (currentMeta["avg_ticket"]) {
		delete currentMeta["avg_ticket"].breakdown_line;
		delete currentMeta["avg_ticket"].meta_line;
		delete currentMeta["avg_ticket"].goal_brl;
	}

	if (
		Number.isFinite(configuredTotalInvested) &&
		configuredTotalInvested >= 0
	) {
		current["total_invested"] = configuredTotalInvested;
	}

	// royalties_validation: prefer value from finance expense breakdown when available.
	{
		const royaltiesCurrent = getRoyaltiesExpenseValue(current);
		if (royaltiesCurrent != null) {
			current["royalties_validation"] = royaltiesCurrent;
			currentMeta["royalties_validation"] = {
				...(currentMeta["royalties_validation"] ?? {}),
				source: "finance_expenses_breakdown",
			};
		}
		const royaltiesPrevious = getRoyaltiesExpenseValue(previous);
		if (royaltiesPrevious != null) {
			previous["royalties_validation"] = royaltiesPrevious;
		}
		const royaltiesThird = getRoyaltiesExpenseValue(previousPrevious);
		if (royaltiesThird != null) {
			previousPrevious["royalties_validation"] = royaltiesThird;
		}
	}

	// Ensure dividends_total and clean operational expenses for current, previous, and third
	const sanitizeDividendsAndExpenses = (map: KpiMap) => {
		let divSum = map["dividends_total"] ?? 0;
		let rawExpDivSum = 0;
		for (const [k, v] of Object.entries(map)) {
			if (k.startsWith("expense_") && isDividendExpense(k)) {
				rawExpDivSum += v;
			}
		}
		if (rawExpDivSum > 0) {
			divSum = Math.max(divSum, rawExpDivSum);
		}
		map["dividends_total"] = divSum;

		const expenseKeys = Object.keys(map).filter((k) => k.startsWith("expense_"));
		if (expenseKeys.length > 0) {
			const opExp = expenseKeys
				.filter((k) => !isDividendExpense(k))
				.reduce((acc, k) => acc + (map[k] ?? 0), 0);
			map["expenses_total"] = opExp;
		}
	};
	sanitizeDividendsAndExpenses(current);
	sanitizeDividendsAndExpenses(previous);
	sanitizeDividendsAndExpenses(previousPrevious);

	// operational_result: always computed from revenue_total - expenses_total
	{
		const rev = current["revenue_total"];
		const exp = current["expenses_total"];
		if (rev != null && exp != null) {
			current["operational_result"] = rev - exp;
		}
	}
	{
		const rev = previous["revenue_total"];
		const exp = previous["expenses_total"];
		if (rev != null && exp != null) {
			previous["operational_result"] = rev - exp;
		}
	}
	{
		const rev = previousPrevious["revenue_total"];
		const exp = previousPrevious["expenses_total"];
		if (rev != null && exp != null) {
			previousPrevious["operational_result"] = rev - exp;
		}
	}

	// cash_generation: operational_result - dividends_total
	if (current["operational_result"] != null || current["dividends_total"] != null) {
		current["cash_generation"] =
			(current["operational_result"] ?? 0) - (current["dividends_total"] ?? 0);
	}
	if (previous["operational_result"] != null || previous["dividends_total"] != null) {
		previous["cash_generation"] =
			(previous["operational_result"] ?? 0) - (previous["dividends_total"] ?? 0);
	}
	if (previousPrevious["operational_result"] != null || previousPrevious["dividends_total"] != null) {
		previousPrevious["cash_generation"] =
			(previousPrevious["operational_result"] ?? 0) - (previousPrevious["dividends_total"] ?? 0);
	}

	// operational_result_100pct_nf: revenue - expenses (includes royalties) - 13.4% tax on revenue
	{
		const rev = current["revenue_total"];
		const exp = current["expenses_total"];
		if (rev != null && exp != null) {
			current["operational_result_100pct_nf"] = rev - exp - 0.134 * rev;
		}
	}

	if (
		current["operational_result"] != null &&
		current["revenue_total"] != null &&
		current["revenue_total"] > 0
	) {
		currentMeta["operational_result"] = {
			...(currentMeta["operational_result"] ?? {}),
			margin_percent:
				(current["operational_result"] / current["revenue_total"]) * 100,
		};
	}
	if (current["dividends_total"] != null) {
		currentMeta["dividends_total"] = {
			...(currentMeta["dividends_total"] ?? {}),
			ref_period: "previous_month",
			ref_label: "Ref. resultado do mês anterior",
		};
	}

	// no_show_rate and present_conversion_rate: computed from SM payload funnel
	{
		const f = salesMarketingDashboard.payload?.funnel;
		if (f) {
			const scheduled = f.scheduled.value;
			const present = f.present.value;
			const closings = f.closings.value;
			if (scheduled > 0) {
				current["no_show_rate"] =
					Math.round((1 - present / scheduled) * 100 * 10) / 10;
			}
			if (present > 0) {
				current["present_conversion_rate"] =
					Math.round((closings / present) * 100 * 10) / 10;
			}
			if (!current["vendas_via_experimental"] || current["vendas_via_experimental"] === 0) {
				current["vendas_via_experimental"] = closings;
			}
		}
	}

	if (salesMarketingDashboard.payload) {
		const comp = buildSalesComposition(current);
		if (comp) {
			salesMarketingDashboard.payload.salesComposition = comp;
		}
	}

	// meta_ads_investment = Propaganda E Marketing (cost center from expense breakdown)
	if (current["expense_propaganda_e_marketing"] != null) {
		current["meta_ads_investment"] = current["expense_propaganda_e_marketing"];
	}

	// instagram_total_reach = monthly reach field
	if (current["marketing_reach"] != null) {
		current["instagram_total_reach"] = current["marketing_reach"];
	}

	// cac_per_sale = Propaganda E Marketing spend / sales_total
	{
		const totalMarketing = current["expense_propaganda_e_marketing"] ?? 0;
		const sales = current["sales_total"];
		if (totalMarketing > 0 && sales != null && sales > 0) {
			current["cac_per_sale"] = Math.round(totalMarketing / sales);
		}
	}

	// sales_total goal (overview): sum of active sellers' monthly goals.
	if (consultorasSalesTarget > 0) {
		currentMeta["sales_total"] = {
			...(currentMeta["sales_total"] ?? {}),
			goal: consultorasSalesTarget,
		};
	}

	// recovery_balance: total_invested minus all profit/dividends distributed up to kpiDataPeriod
	const periodDivTotal = new Map<string, number>();
	const periodExpDivSum = new Map<string, number>();
	const allHistoricalPids = new Set<string>();

	for (const row of salesHistoryRes.data ?? []) {
		if (row.value_numeric == null) continue;
		const pid = normalizePeriodId(row.period_id);
		if (pid > kpiDataPeriod) continue;
		allHistoricalPids.add(pid);
		const code = defIdToCode.get(row.kpi_definition_id);
		if (!code) continue;

		if (code === "dividends_total") {
			periodDivTotal.set(
				pid,
				Math.max(periodDivTotal.get(pid) ?? 0, Number(row.value_numeric)),
			);
		} else if (code.startsWith("expense_") && isDividendExpense(code)) {
			periodExpDivSum.set(
				pid,
				(periodExpDivSum.get(pid) ?? 0) + Number(row.value_numeric),
			);
		}
	}
	allHistoricalPids.add(kpiDataPeriod);
	if (current["dividends_total"] != null) {
		periodDivTotal.set(
			kpiDataPeriod,
			Math.max(
				periodDivTotal.get(kpiDataPeriod) ?? 0,
				current["dividends_total"],
			),
		);
	}

	const effectiveTotalInvested =
		current["total_invested"] ??
		(Number.isFinite(configuredTotalInvested) && configuredTotalInvested > 0
			? configuredTotalInvested
			: 1_020_300);

	const sortedHistoricPids = Array.from(allHistoricalPids).sort();
	const dynamicRecoveryLabels: string[] = [];
	const dynamicRecoveryValues: number[] = [];

	let runningRecoveryBalance = effectiveTotalInvested;
	let totalDividendsDistributed = 0;
	let prevPeriodRecoveryBalance = effectiveTotalInvested;
	let currentMonthDividends = 0;

	for (const pid of sortedHistoricPids) {
		const monthDiv = Math.max(
			periodDivTotal.get(pid) ?? 0,
			periodExpDivSum.get(pid) ?? 0,
		);
		totalDividendsDistributed += monthDiv;
		runningRecoveryBalance = Math.max(0, runningRecoveryBalance - monthDiv);
		dynamicRecoveryLabels.push(toLabel(pid));
		dynamicRecoveryValues.push(runningRecoveryBalance);

		if (previousPeriod && pid === previousPeriod) {
			prevPeriodRecoveryBalance = runningRecoveryBalance;
			previous["recovery_balance"] = runningRecoveryBalance;
			previousMeta["recovery_balance"] = {
				card_title: "A recuperar",
				subline: "investido - lucro distribuído",
			};
		}
		if (thirdPeriod && pid === thirdPeriod) {
			previousPrevious["recovery_balance"] = runningRecoveryBalance;
		}
		if (pid === kpiDataPeriod) {
			currentMonthDividends = monthDiv;
		}
	}

	current["recovery_balance"] = runningRecoveryBalance;

	const hasCurrentMonthDiv = currentMonthDividends > 0;
	const subline = hasCurrentMonthDiv
		? `Saldo ant. ${formatCompactBrl(prevPeriodRecoveryBalance)} − ${formatCompactBrl(currentMonthDividends)} no mês`
		: totalDividendsDistributed > 0
			? `Saldo progressivo (${formatCompactBrl(totalDividendsDistributed)} amortizados)`
			: "Saldo inicial a recuperar";

	const detailLine =
		totalDividendsDistributed > 0
			? `Total amortizado: ${formatCompactBrl(totalDividendsDistributed)} de ${formatCompactBrl(effectiveTotalInvested)} investidos`
			: undefined;

	const deltaPill = hasCurrentMonthDiv
		? `-${formatCompactBrl(currentMonthDividends)} no mês`
		: undefined;

	currentMeta["recovery_balance"] = {
		...(currentMeta["recovery_balance"] ?? {}),
		card_title: "A recuperar",
		subline,
		detail_line: detailLine,
		delta_pill: deltaPill,
	};

	currentMeta["total_invested"] = {
		...(currentMeta["total_invested"] ?? {}),
		roi_charts: {
			composition: [
				{
					label: "Materiais",
					value: 497_000,
					color: ROI_COMPOSITION_COLOR.materials,
				},
				{
					label: "Serviços",
					value: 351_000,
					color: ROI_COMPOSITION_COLOR.services,
				},
				{
					label: "Franquia",
					value: 80_000,
					color: ROI_COMPOSITION_COLOR.franchise,
				},
				{ label: "Outros", value: 65_000, color: ROI_COMPOSITION_COLOR.other },
			],
			recoveryEvolution: {
				labels: dynamicRecoveryLabels,
				values: dynamicRecoveryValues,
			},
		},
	};

	// roi_payback_months: computed from recovery_balance divided by 3-month average of profit distribution
	{
		const divCurrent = currentMonthDividends;
		const divPrev = previousPeriod
			? Math.max(
					periodDivTotal.get(previousPeriod) ?? 0,
					periodExpDivSum.get(previousPeriod) ?? 0,
				)
			: 0;
		const divThird = thirdPeriod
			? Math.max(
					periodDivTotal.get(thirdPeriod) ?? 0,
					periodExpDivSum.get(thirdPeriod) ?? 0,
				)
			: 0;

		const samples = [divCurrent];
		if (previousPeriod) samples.push(divPrev);
		if (thirdPeriod) samples.push(divThird);
		const avgDividends3m =
			samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);

		const rec = current["recovery_balance"];
		if (avgDividends3m > 0 && rec != null && rec > 0) {
			const paybackMonths = Math.round(rec / avgDividends3m);
			current["roi_payback_months"] = paybackMonths;

			const years = Math.floor(paybackMonths / 12);
			const remainingMos = paybackMonths % 12;
			const timeStr =
				years > 0
					? `${years} ${years === 1 ? "ano" : "anos"}${remainingMos > 0 ? ` e ${remainingMos} ${remainingMos === 1 ? "mês" : "meses"}` : ""}`
					: `${paybackMonths} meses`;

			const singleMonthPayback =
				divCurrent > 0 ? Math.round(rec / divCurrent) : null;
			const latestPaceStr =
				singleMonthPayback != null && singleMonthPayback !== paybackMonths
					? ` · No ritmo de ${toLabel(kpiDataPeriod)} (${formatCompactBrl(divCurrent)}): ~${singleMonthPayback} meses`
					: "";

			currentMeta["roi_payback_months"] = {
				...(currentMeta["roi_payback_months"] ?? {}),
				subline: `no ritmo atual (média 3m: ${formatCompactBrl(Math.round(avgDividends3m))}/mês)`,
				detail_line: `~${timeStr} para recuperar ${formatCompactBrl(rec)}${latestPaceStr}`,
				avg_dividends_3m: avgDividends3m,
			};
		} else if (rec === 0) {
			current["roi_payback_months"] = 0;
			currentMeta["roi_payback_months"] = {
				...(currentMeta["roi_payback_months"] ?? {}),
				subline: "investimento 100% recuperado",
				detail_line: "Todo o capital investido foi retornado",
			};
		} else {
			// Fallback to operational margin if no dividends were distributed yet
			const margem =
				(current["revenue_total"] ?? 0) - (current["expenses_total"] ?? 0);
			if (margem > 0 && rec != null) {
				current["roi_payback_months"] = Math.ceil(rec / margem);
			}
		}
	}

	const insights: KpiPageData["insights"] = {};
	const analysis: KpiPageData["analysis"] = [];
	let featureOfMonth: KpiPageData["featureOfMonth"] = null;

	const insightCategoryOrder: Record<string, number> = {
		overview: 0,
		sales_marketing: 1,
		retention: 2,
		finance: 3,
		roi: 4,
	};
	const sortedInsightRows = [...insightsRes.data].sort((a, b) => {
		const da = insightCategoryOrder[a.category] ?? 99;
		const db = insightCategoryOrder[b.category] ?? 99;
		if (da !== db) return da - db;
		return (a.sort_order ?? 0) - (b.sort_order ?? 0);
	});

	for (const row of sortedInsightRows) {
		const rowPeriod = normalizePeriodId(row.period_id);
		if (row.category === "sales_marketing_weekly") {
			if (rowPeriod !== smPrimaryPeriod) continue;
		} else {
			if (rowPeriod !== kpiDataPeriod) continue;
		}

		if (row.insight_scope === "analysis") {
			analysis.push({
				section: String(
					(row.meta_json as { section?: string })?.section ?? row.category,
				),
				category: row.category,
				analysis: row.body,
			});
			continue;
		}
		if (row.insight_scope === "feature_of_month") {
			const meta = row.meta_json as {
				status?: string;
				impact?: Record<string, number>;
			};
			featureOfMonth = {
				title: row.title,
				description: row.body,
				status: meta?.status,
				impact: meta?.impact ?? {},
			};
			continue;
		}
		const key = row.category;
		insights[key] ||= [];
		insights[key].push({
			type: row.insight_type,
			title: row.title,
			body: row.body,
			meta_json: row.meta_json,
		});
	}

	const baseDefId = defsRes.data?.find(
		(d) => d.code === "base_students_end",
	)?.id;
	const baseHistoricRows = (salesHistoryRes.data ?? [])
		.filter(
			(r) =>
				baseDefId != null &&
				r.kpi_definition_id === baseDefId &&
				r.value_numeric != null &&
				normalizePeriodId(r.period_id) < kpiDataPeriod,
		)
		.map((r) => ({
			pid: normalizePeriodId(r.period_id),
			v: Number(r.value_numeric),
		}))
		.sort((a, b) => a.pid.localeCompare(b.pid));

	const nHist = baseHistoricRows.length;
	const histLabels = baseHistoricRows.map((r) => toLabel(r.pid));
	const histValues = baseHistoricRows.map((r) => r.v);
	const lastHistVal = nHist > 0 ? histValues[nHist - 1] : undefined;
	const lastHist = lastHistVal !== undefined ? lastHistVal : 827;
	const REF_ANCHOR = 827;
	const refProj = [861, 914, 967, 1020, 1073, 1126];
	const projScaled = refProj.map((p) => lastHist + (p - REF_ANCHOR));
	const projLabels = projectionMonthStarLabels(
		kpiDataPeriod,
		projScaled.length,
	);
	const chartLabels = [...histLabels, ...projLabels];

	const baseHistoric: (number | null)[] = chartLabels.map((_, i) => {
		if (i >= nHist) return null;
		const v = histValues[i];
		return v === undefined ? null : v;
	});
	const baseProjection: (number | null)[] = chartLabels.map((_, i) => {
		if (i < nHist - 1) return null;
		if (i === nHist - 1) return lastHist;
		const j = i - nHist;
		const step = projScaled[j];
		return step === undefined ? null : step;
	});

	const openMeta = (currentMeta.open_default_count ?? {}) as Record<
		string,
		unknown
	>;
	const recC = current.recovered_default_count ?? 0;
	const openC = current.open_default_count ?? 0;
	const cancelled =
		typeof openMeta.cancelled_count === "number" ? openMeta.cancelled_count : 0;
	const recordCount =
		typeof openMeta.month_total_records === "number"
			? openMeta.month_total_records
			: Math.round(recC + openC + cancelled);

	applyFinancePageFallbacks(current, currentMeta, insights);

	// Resultado se 100% NF: margem e imposto teórico alinhados ao valor calculado (podem ser negativos).
	{
		const rev = current["revenue_total"];
		const res100 = current["operational_result_100pct_nf"];
		if (
			rev != null &&
			rev > 0 &&
			res100 != null &&
			!Number.isNaN(res100)
		) {
			const pct = Math.round((res100 / rev) * 1000) / 10;
			const taxTheory = Math.round(rev * 0.134);
			currentMeta["operational_result_100pct_nf"] = {
				...(currentMeta["operational_result_100pct_nf"] ?? {}),
				margin_line: `margem ${pct.toFixed(1).replace(".", ",")}% (simulação 13,4%)`,
				tax_theory_line: `Imposto teórico: R$ ${brlWholePtBr(taxTheory)}/mês sobre receita total`,
			};
		}
	}

	// Royalties validation: 12% sobre o faturamento do mês anterior
	{
		const prevRev = previous["revenue_total"];
		if (prevRev != null && prevRev > 0) {
			const devidos = Math.round(prevRev * 0.12);
			const pagos =
				current["royalties_validation"] ?? getRoyaltiesExpenseValue(current);
			if (pagos != null) {
				current["royalties_validation"] = pagos;
				const diff = pagos - devidos;
				const pct = (pagos / prevRev) * 100;
				const shortfallPill =
					diff < -10
						? `−R$ ${new Intl.NumberFormat("pt-BR").format(Math.round(Math.abs(diff)))}`
						: diff > 10
							? `+R$ ${new Intl.NumberFormat("pt-BR").format(Math.round(diff))}`
							: "OK";

				currentMeta["royalties_validation"] = {
					...(currentMeta["royalties_validation"] ?? {}),
					pct_line: `${pct.toFixed(1).replace(".", ",")}% da receita anterior (deveria ser 12%)`,
					shortfall_pill: shortfallPill,
				};
			}
		}
	}

	const roiCharts = applyRoiPageFallbacks(current, currentMeta, insights);

	let forecastWeeklyBalance: number | null = null;
	const forecastSm = buildSmPayload(forecastPeriodId);
	if (forecastSm?.weekly?.salesWeekly?.netBalanceByWeek) {
		const filled = forecastSm.weekly.salesWeekly.netBalanceByWeek.filter(
			(v): v is number => v !== null && v !== undefined,
		);
		if (filled.length > 0) {
			forecastWeeklyBalance = filled.reduce((a, b) => a + b, 0);
		}
	} else if (kpiDataPeriod === currentMonthPeriod) {
		const currSm = buildSmPayload(currentMonthPeriod);
		if (currSm?.weekly?.salesWeekly?.netBalanceByWeek) {
			const filled = currSm.weekly.salesWeekly.netBalanceByWeek.filter(
				(v): v is number => v !== null && v !== undefined,
			);
			if (filled.length > 0) {
				forecastWeeklyBalance = filled.reduce((a, b) => a + b, 0);
			}
		}
	}

	const nextMonthForecast = buildNextMonthForecast(
		kpiDataPeriod,
		previousPeriod,
		byPeriodFinance,
		current,
		previous,
		currentMeta,
		forecastWeeklyBalance,
	);

	if (!insights.forecast || insights.forecast.length === 0) {
		insights.forecast = nextMonthForecast.analysis.map((a) => ({
			type: a.type,
			title: "",
			body: a.body,
		}));
	}

	const retentionCharts: RetentionChartPayload = {
		chartLabels,
		baseHistoric,
		baseProjection,
		baseGoalLine: 875,
		inadimplencia: {
			titleSuffix: `${toLabel(kpiDataPeriod)} (parcial)`,
			recordCount,
			recovered: recC,
			open: openC,
			cancelled,
			valueRecovered: current.recovered_default_value ?? 0,
			valueOpen: current.open_default_value ?? 0,
		},
	};

	// Build Executive Summary: Snapshot (6 cards) and Six-Month Trends (Opção B)
	const exitsDefId = defsRes.data?.find((d) => d.code === "monthly_exits")?.id;
	const cancDefId = defsRes.data?.find((d) => d.code === "monthly_cancellations")?.id;
	const nonRenewedDefId = defsRes.data?.find((d) => d.code === "monthly_non_renewed")?.id;
	const openValDefId = defsRes.data?.find((d) => d.code === "open_default_value")?.id;
	const recValDefId = defsRes.data?.find((d) => d.code === "recovered_default_value")?.id;

	const historyByPeriodDef = new Map<string, number>();
	for (const row of salesHistoryRes.data ?? []) {
		if (row.value_numeric == null) continue;
		const pid = normalizePeriodId(row.period_id);
		historyByPeriodDef.set(`${pid}_${row.kpi_definition_id}`, Number(row.value_numeric));
	}

	const sixPeriods: string[] = [];
	for (let offset = -5; offset <= 0; offset++) {
		sixPeriods.push(getOffsetMonth(kpiDataPeriod, offset));
	}

	const sixPeriodLabels = sixPeriods.map((pid) => toLabel(pid));

	const sixRevenue: number[] = [];
	const sixExpenses: number[] = [];
	const sixOpResult: number[] = [];
	const sixMargins: number[] = [];

	const sixBaseEnd: (number | null)[] = [];
	const sixNewSales: number[] = [];
	const sixExits: (number | null)[] = [];
	const sixCancellations: (number | null)[] = [];
	const sixNonRenewed: (number | null)[] = [];
	const sixNetGrowth: (number | null)[] = [];
	const sixGoals: (number | null)[] = [];

	const sixOpenValues: (number | null)[] = [];
	const sixRecoveredValues: (number | null)[] = [];

	for (const pid of sixPeriods) {
		const isCurrent = pid === kpiDataPeriod;

		// Revenue
		const rVal = (isCurrent ? current["revenue_total"] : revDefId ? historyByPeriodDef.get(`${pid}_${revDefId}`) : undefined) ?? 0;
		sixRevenue.push(rVal);

		// Operational Result
		let opVal = (isCurrent ? current["operational_result"] : opDefId ? historyByPeriodDef.get(`${pid}_${opDefId}`) : undefined) ?? 0;

		// Expenses
		let eVal = (isCurrent ? current["expenses_total"] : expDefId ? historyByPeriodDef.get(`${pid}_${expDefId}`) : undefined) ?? 0;
		if (eVal === 0 && rVal > 0 && opVal !== 0) {
			eVal = rVal - opVal;
		} else if (opVal === 0 && rVal > 0 && eVal > 0) {
			opVal = rVal - eVal;
		}
		sixExpenses.push(eVal);
		sixOpResult.push(opVal);

		const margin = rVal > 0 ? (opVal / rVal) * 100 : 0;
		sixMargins.push(Math.round(margin * 10) / 10);

		// Base End
		const baseVal = (isCurrent ? current["base_students_end"] : baseDefId ? historyByPeriodDef.get(`${pid}_${baseDefId}`) : undefined) ?? null;
		sixBaseEnd.push(baseVal);

		// Sales
		const sVal = (isCurrent ? current["sales_total"] : salesDefId ? historyByPeriodDef.get(`${pid}_${salesDefId}`) : undefined) ?? 0;
		sixNewSales.push(sVal);

		// Cancellations & Exits
		const cVal = (isCurrent ? current["monthly_cancellations"] : cancDefId ? historyByPeriodDef.get(`${pid}_${cancDefId}`) : undefined) ?? null;
		const nrVal = (isCurrent ? current["monthly_non_renewed"] : nonRenewedDefId ? historyByPeriodDef.get(`${pid}_${nonRenewedDefId}`) : undefined) ?? null;
		sixCancellations.push(cVal);
		sixNonRenewed.push(nrVal);

		let exitVal: number | null = null;
		if (cVal != null || nrVal != null) {
			exitVal = (cVal ?? 0) + (nrVal ?? 0);
		} else {
			exitVal = (isCurrent ? current["monthly_exits"] : exitsDefId ? historyByPeriodDef.get(`${pid}_${exitsDefId}`) : undefined) ?? null;
		}
		sixExits.push(exitVal);

		if (sVal != null && exitVal != null) {
			sixNetGrowth.push(sVal - exitVal);
		} else {
			sixNetGrowth.push(null);
		}

		// Goal for the month
		const pMonth = parseInt(pid.slice(5, 7), 10);
		const goalVal = (baseStudentsGoalDefId ? historyByPeriodDef.get(`${pid}_${baseStudentsGoalDefId}`) : undefined) ??
			(pMonth >= 1 && pMonth <= 12 && studentBaseGoalsByMonth[pMonth - 1] > 0 ? studentBaseGoalsByMonth[pMonth - 1] : 875);
		sixGoals.push(goalVal);

		// Default risk
		const openV = (isCurrent ? current["open_default_value"] : openValDefId ? historyByPeriodDef.get(`${pid}_${openValDefId}`) : undefined) ?? null;
		const recV = (isCurrent ? current["recovered_default_value"] : recValDefId ? historyByPeriodDef.get(`${pid}_${recValDefId}`) : undefined) ?? null;
		sixOpenValues.push(openV);
		sixRecoveredValues.push(recV);
	}

	const sumRevenue = sixRevenue.reduce((a, b) => a + b, 0);
	const avgRevenue = Math.round(sumRevenue / sixRevenue.length);
	const sumExpenses = sixExpenses.reduce((a, b) => a + b, 0);
	const avgExpenses = Math.round(sumExpenses / sixExpenses.length);
	const accumulatedResult = sixOpResult.reduce((a, b) => a + b, 0);
	const avgMarginPercent = sumRevenue > 0 ? Math.round((accumulatedResult / sumRevenue) * 1000) / 10 : 0;

	const validNetGrowths = sixNetGrowth.filter((v): v is number => v !== null);
	const totalNetGrowth = validNetGrowths.reduce((a, b) => a + b, 0);
	const avgNewSales = Math.round(sixNewSales.reduce((a, b) => a + b, 0) / sixNewSales.length);
	const validExits = sixExits.filter((v): v is number => v !== null);
	const avgExits = validExits.length > 0 ? Math.round(validExits.reduce((a, b) => a + b, 0) / validExits.length) : 0;

	const sixMonthsPayload: ExecutiveSixMonthsPayload = {
		periods: sixPeriodLabels,
		periodIds: sixPeriods,
		financial: {
			revenue: sixRevenue,
			expenses: sixExpenses,
			operationalResult: sixOpResult,
			marginPercent: sixMargins,
			avgRevenue,
			avgExpenses,
			accumulatedResult,
			avgMarginPercent,
		},
		students: {
			baseEnd: sixBaseEnd,
			newSales: sixNewSales,
			exits: sixExits,
			cancellations: sixCancellations,
			nonRenewed: sixNonRenewed,
			netGrowth: sixNetGrowth,
			goals: sixGoals,
			totalNetGrowth,
			avgNewSales,
			avgExits,
		},
		defaultRisk: {
			openValues: sixOpenValues,
			recoveredValues: sixRecoveredValues,
		},
	};

	// Snapshot (6 cards)
	const baseGoal = (currentMeta.base_students_end?.goal as number | undefined) ?? current["base_students_goal"] ?? 875;
	const salesGoal = (currentMeta.sales_total?.goal as number | undefined) ?? consultorasSalesTarget ?? 150;
	const salesVal = current["sales_total"] ?? null;
	const salesGap = salesVal != null ? salesVal - salesGoal : null;

	const revVal = current["revenue_total"] ?? null;
	const prevRevVal = previous["revenue_total"] ?? null;
	const revDeltaMoM = revVal != null && prevRevVal != null && prevRevVal > 0 ? ((revVal - prevRevVal) / prevRevVal) * 100 : null;
	const matRevVal = current["matriculated_revenue"] ?? null;
	const matPct = revVal != null && matRevVal != null && revVal > 0 ? Math.round((matRevVal / revVal) * 100) : null;

	const opResultVal = current["operational_result"] ?? null;
	const opMargin = revVal != null && opResultVal != null && revVal > 0 ? (opResultVal / revVal) * 100 : (currentMeta["operational_result"]?.margin_percent as number | undefined) ?? null;

	const cancVal = current["monthly_cancellations"] ?? null;
	const nonRenVal = current["monthly_non_renewed"] ?? null;
	const exitsCurrentSum = cancVal != null || nonRenVal != null ? (cancVal ?? 0) + (nonRenVal ?? 0) : (current["monthly_exits"] ?? null);
	const netBal = salesVal != null && exitsCurrentSum != null ? salesVal - exitsCurrentSum : null;

	const openDefaultC = current["open_default_count"] ?? null;
	const openDefaultV = current["open_default_value"] ?? null;
	const recDefaultC = current["recovered_default_count"] ?? null;
	const recDefaultV = current["recovered_default_value"] ?? null;
	const recRate = typeof openMeta.recovery_rate_pct === "number"
		? openMeta.recovery_rate_pct
		: (recordCount > 0 && recC > 0 ? Math.round((recC / recordCount) * 100) : null);
	const pill3d = typeof openMeta.recovery_3d_pill === "string" ? openMeta.recovery_3d_pill : undefined;

	const snapshot: ExecutiveMonthSnapshot = {
		baseStudents: {
			value: current["base_students_end"] ?? null,
			goal: baseGoal,
			isPartial: currentMeta.base_students_end?.partial === true,
			pendingNote: currentMeta.base_students_end?.pending_note as string | undefined,
		},
		sales: {
			value: salesVal,
			goal: salesGoal,
			gap: salesGap,
			isPartial: currentMeta.sales_total?.partial === true,
		},
		revenue: {
			value: revVal,
			deltaMoM: revDeltaMoM != null ? Math.round(revDeltaMoM * 10) / 10 : null,
			matriculatedPercent: matPct,
		},
		operationalResult: {
			value: opResultVal,
			marginPercent: opMargin != null ? Math.round(opMargin * 10) / 10 : null,
			isRecord: currentMeta.operational_result?.record === true,
			result100PctNf: current["operational_result_100pct_nf"] ?? null,
			dividendsDistributed: current["dividends_total"] ?? null,
			netProfitAfterDividends:
				opResultVal != null && current["dividends_total"] != null
					? opResultVal - current["dividends_total"]
					: null,
		},
		exits: {
			total: exitsCurrentSum,
			cancellations: cancVal,
			nonRenewed: nonRenVal,
			netBalance: netBal,
		},
		defaultRisk: {
			openCount: openDefaultC,
			openValue: openDefaultV,
			recoveredCount: recDefaultC,
			recoveredValue: recDefaultV,
			recoveryRatePct: recRate,
			pill3d,
		},
	};

	return {
		gymName: gym.name,
		kpiDataPeriod,
		selectedPeriod: kpiDataPeriod,
		prevPeriodId,
		nextPeriodId,
		availablePeriods,
		smPrimaryPeriod,
		isCurrentMonthData: hasCurrentMonthData,
		currentMonthLabel: toLongLabel(kpiDataPeriod),
		currentPeriodLabel: toLongLabel(kpiDataPeriod),
		previousPeriodLabel: previousPeriod
			? toLongLabel(previousPeriod)
			: undefined,
		previousPreviousPeriodLabel: thirdPeriod
			? toLongLabel(thirdPeriod)
			: undefined,
		current,
		previous,
		previousPrevious,
		currentMeta,
		retentionCharts,
		insights,
		analysis,
		featureOfMonth,
		salesMarketingDashboard,
		financeCharts,
		nextMonthForecast,
		roiCharts,
		gymConfiguration: {
			goal: studentBaseGoalsByMonth,
			salesTarget: salesMarketingDashboard.salesTarget,
		},
		executiveSummary: {
			snapshot,
			sixMonths: sixMonthsPayload,
		},
	};
}
