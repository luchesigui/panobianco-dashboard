import { applyFinancePageFallbacks } from "@/lib/data/finance-fallbacks";
import {
	applyRoiPageFallbacks,
	type RoiChartPayload,
} from "@/lib/data/roi-fallbacks";
import { getServiceSupabase } from "@/lib/supabase/server";
import type {
	MonthlySalesBar,
	SalesMarketingDashboardPayload,
} from "@/lib/data/sales-marketing-dashboard";

type KpiMap = Record<string, number>;

export type KpiMetaMap = Record<string, Record<string, unknown>>;

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
};

export type KpiPageData = {
	gymName: string;
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
		Array<{ type: string; title: string; body: string }>
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
		monthlySalesChart: MonthlySalesBar[];
		salesTarget: number;
		isCurrentMonthPayload: boolean;
		payloadPeriodLabel: string | null;
	};
	financeCharts: FinanceChartPayload;
	nextMonthForecast: NextMonthForecastPayload;
	roiCharts: RoiChartPayload;
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
	const revenueForecast = revBasis * growthRev;

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

	const matBasis = current.matriculated_revenue ?? m0;
	const matriculatedForecast = matBasis * growthRev;

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
	const mm = currentMeta.matriculated_revenue as
		| { recorrente?: number; anual?: number; mensal?: number }
		| undefined;
	if (
		mm &&
		typeof mm.recorrente === "number" &&
		typeof mm.anual === "number" &&
		typeof mm.mensal === "number" &&
		matBasis > 0
	) {
		const s = matriculatedForecast / matBasis;
		const fmt = (v: number) => {
			const k = v / 1000;
			return k >= 100
				? `R$ ${Math.round(k)}k`
				: `R$ ${k.toFixed(1).replace(".", ",")}k`;
		};
		matriculatedSubline = `Recorrente ${fmt(mm.recorrente * s)} · Anual ${fmt(mm.anual * s)} · Mensal ${fmt(mm.mensal * s)}`;
	}

	const basisLabel = `${toLabel(currentPeriod)} (real)`;
	const nextLabelFull = toLabel(nextPeriodFirstDay(currentPeriod));
	const forecastLabel = `${nextLabelFull} (previsto)`;

	const g = growthRev;
	const m1 = m0 * g;
	const w1 = w0 * g;
	const t1 = t0 * g;
	const p1 = p0 * g;
	const u1 = u0 * g;

	const analysis: ForecastAnalysisItem[] = [];
	const prevLab = previousPeriod ? toLabel(previousPeriod) : null;
	analysis.push({
		type: "info",
		body: `A projeção de ${nextLabelFull} replica o ritmo entre ${prevLab ?? "o mês anterior"} e ${toLabel(currentPeriod)} (receita e despesas), com limites para suavizar picos. Não substitui o fechamento contábil.`,
	});
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
		{ label: "Pessoal e encargos", value: expF * 0.42, color: "#553c9a" },
		{ label: "Infraestrutura", value: expF * 0.28, color: "#ed8936" },
		{ label: "Marketing e vendas", value: expF * 0.18, color: "#dd6b20" },
		{ label: "Demais / pontuais", value: expF * 0.12, color: "#63b3ed" },
	];

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
	};
}

export async function getKpiPageData(
	gymSlug = "panobianco-sjc-satelite",
): Promise<KpiPageData> {
	const supabase = getServiceSupabase();

	const { data: gym, error: gymError } = await supabase
		.from("gyms")
		.select("id,name")
		.eq("slug", gymSlug)
		.single();

	console.log("gym", gym);
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
	const prev2MonthPeriod = _mk(
		new Date(_now.getFullYear(), _now.getMonth() - 2, 1),
	);
	const prev3MonthPeriod = _mk(
		new Date(_now.getFullYear(), _now.getMonth() - 3, 1),
	);

	// Fetch values for current month + 3 prior months in one query; resolve kpiDataPeriod after
	const fetchPeriodIds = [
		currentMonthPeriod,
		prevMonthPeriod,
		prev2MonthPeriod,
		prev3MonthPeriod,
	];

	const [defsRes, valuesRes, dashboardRes, salesHistoryRes] = await Promise.all(
		[
			supabase.from("kpi_definitions").select("id,code"),
			supabase
				.from("kpi_values")
				.select("period_id,kpi_definition_id,value_numeric,meta_json")
				.eq("gym_id", gym.id)
				.in("period_id", fetchPeriodIds),
			supabase
				.from("sales_marketing_dashboard_payload")
				.select("period_id,payload")
				.eq("gym_id", gym.id)
				.in("period_id", [currentMonthPeriod, prevMonthPeriod]),
			supabase
				.from("kpi_values")
				.select("period_id,kpi_definition_id,value_numeric")
				.eq("gym_id", gym.id)
				.gte("period_id", "2025-04-01")
				.lte("period_id", prevMonthPeriod)
				.order("period_id", { ascending: true }),
		],
	);

	if (defsRes.error)
		throw new Error(`Definitions load failed: ${defsRes.error.message}`);
	if (valuesRes.error)
		throw new Error(`Values load failed: ${valuesRes.error.message}`);
	if (dashboardRes.error)
		throw new Error(`Dashboard payload load failed: ${dashboardRes.error.message}`);
	if (salesHistoryRes.error)
		throw new Error(
			`Sales history load failed: ${salesHistoryRes.error.message}`,
		);

	// Resolve kpiDataPeriod: use current month if it has data, otherwise fall back to previous month
	const hasCurrentMonthData = (valuesRes.data ?? []).some(
		(r) => normalizePeriodId(r.period_id) === currentMonthPeriod,
	);
	const kpiDataPeriod = hasCurrentMonthData
		? currentMonthPeriod
		: prevMonthPeriod;
	const previousPeriod = hasCurrentMonthData
		? prevMonthPeriod
		: prev2MonthPeriod;
	const thirdPeriod = hasCurrentMonthData ? prev2MonthPeriod : prev3MonthPeriod;

	// Load insights for the resolved period (separate query after resolution)
	const insightsRes = await supabase
		.from("kpi_insights")
		.select(
			"category,insight_scope,insight_type,title,body,sort_order,meta_json",
		)
		.eq("gym_id", gym.id)
		.eq("period_id", kpiDataPeriod)
		.order("sort_order", { ascending: true });

	if (insightsRes.error)
		throw new Error(`Insights load failed: ${insightsRes.error.message}`);

	const defIdToCode = new Map((defsRes.data ?? []).map((d) => [d.id, d.code]));
	const salesDefId = defsRes.data?.find((d) => d.code === "sales_total")?.id;

	const CHART_BAR_COLORS = [
		"#d85a30",
		"#185fa5",
		"#0f6e56",
		"#0f6e56",
		"#185fa5",
		"#d85a30",
		"#185fa5",
		"#d85a30",
		"#d85a30",
		"#0f6e56",
		"#185fa5",
		"#d85a30",
		"#d85a30",
	];
	const revDefId = defsRes.data?.find((d) => d.code === "revenue_total")?.id;
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
		if (row.kpi_definition_id === revDefId) slot.rev = v;
		if (row.kpi_definition_id === matDefId) slot.m = v;
		if (row.kpi_definition_id === whDefId) slot.w = v;
		if (row.kpi_definition_id === tpDefId) slot.t = v;
		if (row.kpi_definition_id === prDefId) slot.p = v;
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
		financeCharts.operationalResult.push(s.op ?? 0);
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
				color: CHART_BAR_COLORS[i % CHART_BAR_COLORS.length],
			});
		});
	}

	const smRows = dashboardRes.data ?? [];
	const smRow =
		smRows.find((r) => normalizePeriodId(r.period_id) === kpiDataPeriod) ??
		smRows.find((r) => normalizePeriodId(r.period_id) === prevMonthPeriod);
	const smPayloadFromCurrentMonth =
		smRow != null && normalizePeriodId(smRow.period_id) === smPayloadPeriod;
	const smPayloadPeriodLabel = smRow
		? toLongLabel(normalizePeriodId(smRow.period_id))
		: null;
	const rawPayload = smRow?.payload;
	const salesMarketingDashboard = {
		payload:
			rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
				? (rawPayload as SalesMarketingDashboardPayload)
				: null,
		monthlySalesChart,
		salesTarget: 150,
		isCurrentMonthPayload: smPayloadFromCurrentMonth,
		payloadPeriodLabel: smPayloadPeriodLabel,
	};
	const current: KpiMap = {};
	const previous: KpiMap = {};
	const previousPrevious: KpiMap = {};
	const currentMeta: KpiMetaMap = {};

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
		if (previousPeriod && rowPeriod === previousPeriod) previous[code] = value;
		if (thirdPeriod && rowPeriod === thirdPeriod)
			previousPrevious[code] = value;
	}

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

	// operational_result_100pct_nf: revenue - expenses (includes royalties) - 13.4% tax on revenue
	{
		const rev = current["revenue_total"];
		const exp = current["expenses_total"];
		if (rev != null && exp != null) {
			current["operational_result_100pct_nf"] = rev - exp - 0.134 * rev;
		}
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
		}
	}

	// meta_ads_investment = marketing_cost_traffic (same field, different label)
	if (current["marketing_cost_traffic"] != null) {
		current["meta_ads_investment"] = current["marketing_cost_traffic"];
	}

	// instagram_total_reach = monthly reach field
	if (current["marketing_reach"] != null) {
		current["instagram_total_reach"] = current["marketing_reach"];
	}

	// cac_per_sale = total marketing spend / sales_total
	{
		const totalMarketing =
			(current["marketing_cost_traffic"] ?? 0) +
			(current["marketing_cost_labor"] ?? 0) +
			(current["marketing_cost_production"] ?? 0);
		const sales = current["sales_total"];
		if (totalMarketing > 0 && sales != null && sales > 0) {
			current["cac_per_sale"] = Math.round(totalMarketing / sales);
		}
	}

	// roi_payback_months: computed from entered data, never stored in DB
	{
		const margem =
			(current["revenue_total"] ?? 0) - (current["expenses_total"] ?? 0);
		const rec = current["recovery_balance"];
		if (margem > 0 && rec != null) {
			current["roi_payback_months"] = Math.ceil(rec / margem);
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
	const roiCharts = applyRoiPageFallbacks(current, currentMeta, insights);

	const nextMonthForecast = buildNextMonthForecast(
		kpiDataPeriod,
		previousPeriod,
		byPeriodFinance,
		current,
		previous,
		currentMeta,
	);

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

	return {
		gymName: gym.name,
		isCurrentMonthData: hasCurrentMonthData,
		currentMonthLabel: toLongLabel(smPayloadPeriod),
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
	};
}
