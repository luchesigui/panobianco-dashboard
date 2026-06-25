import { applyFinancePageFallbacks } from "@/lib/data/finance-fallbacks";
import {
	applyRoiPageFallbacks,
	type RoiChartPayload,
} from "@/lib/data/roi-fallbacks";
import {
	hasAnySmData,
	isExperimentalFunnelEmpty,
	mergeSmWeeklyWithPeriodSource,
	normalizeSmPayloadWeeks,
} from "@/lib/data/sales-marketing-payload-merge";
import { assemblePayloadFromNormalized } from "@/lib/data/vendas-marketing-assembler";
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
};

export type KpiPageData = {
	gymName: string;
	kpiDataPeriod: string;
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
		primaryPayload: SalesMarketingDashboardPayload | null;
		comparisonPayload: SalesMarketingDashboardPayload | null;
		monthlySalesChart: MonthlySalesBar[];
		salesTarget: number;
		/** Short label for the primary SM month, e.g. "Mai/26". */
		primaryPeriodLabel: string;
		/** Comparison month for deltas (previous calendar month in the chosen window), e.g. "Abr/26". */
		comparisonPeriodLabel: string | null;
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
				supabase.from("conversoes_semanais").select("period_id,week_num,leads,sales").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
				supabase.from("recepcao_semanal").select("period_id,week_num,receptionist_name,leads,sales").eq("gym_id", gym.id).in("period_id", fetchPeriodIds),
			]),
			supabase
				.from("kpi_values")
				.select("period_id,kpi_definition_id,value_numeric")
				.eq("gym_id", gym.id)
				.gte("period_id", "2025-04-01")
				.lte("period_id", prevMonthPeriod)
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
	const periodHasKpiData = (periodId: string): boolean => {
		return valuesRes.data.some((row) => {
			const rowPeriod = normalizePeriodId(row.period_id);
			const def = (defsRes.data ?? []).find((d) => d.id === row.kpi_definition_id);
			return (
				rowPeriod === periodId &&
				(def?.code === "revenue_total" || def?.code === "base_students_end") &&
				row.value_numeric != null
			);
		});
	};
	const kpiDataPeriod = prevMonthPeriod; // General dashboard always targets previous calendar month
	const hasCurrentMonthData = false;

	const getOffsetMonth = (basePeriod: string, offset: number): string => {
		const parts = basePeriod.split("-").map(Number);
		const d = new Date(parts[0], parts[1] - 1 + offset, 1);
		const y = d.getFullYear();
		const mo = String(d.getMonth() + 1).padStart(2, "0");
		return `${y}-${mo}-01`;
	};

	const previousPeriod = getOffsetMonth(kpiDataPeriod, -1); // Month before previous (e.g. April)
	const thirdPeriod = getOffsetMonth(kpiDataPeriod, -2);

	// Resolve the weekly sales & marketing primary/comparison periods
	const hasCurrentWeeklyData = smPayloads[0] && hasAnySmData(smPayloads[0]);

	const smPrimaryPeriod = hasCurrentWeeklyData ? currentMonthPeriod : prevMonthPeriod;
	const smComparisonPeriod = hasCurrentWeeklyData ? prevMonthPeriod : prev2MonthPeriod;

	const primaryPayload = hasCurrentWeeklyData ? smPayloads[0] : smPayloads[1];
	const comparisonPayload = hasCurrentWeeklyData ? buildSmPayload(smComparisonPeriod) : buildSmPayload(smComparisonPeriod);

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
		const consultorasList = (consultorasRes.data ?? []) as Array<{ name: string; monthly_goal: number }>;
		const goalByName = new Map(consultorasList.map(c => [c.name, c.monthly_goal]));

		let receptionistsList: SalesMarketingDashboardPayload["receptionists"] = [];
		let receptionistsPeriodLabel = "";

		// Check if the current calendar month (June 2026, which is smPayloads[0]) has any weekly receptionist data
		const JuneRecepRows = smPayloads[0]?.weekly?.salesWeekly?.byReceptionist ?? [];
		const JuneHasRecepData = JuneRecepRows.some(
			(r) => r.leadsByWeek.some((l) => l != null && l > 0) || r.salesByWeek.some((s) => s != null && s > 0)
		);

		if (JuneHasRecepData) {
			receptionistsList = JuneRecepRows.map((r) => {
				let leads = 0;
				let sales = 0;
				let hasAny = false;
				for (let i = 0; i < 5; i++) {
					const lw = r.leadsByWeek[i];
					const sw = r.salesByWeek[i];
					if (lw != null || sw != null) {
						leads += (lw ?? 0);
						sales += (sw ?? 0);
						hasAny = true;
					}
				}
				return {
					name: r.name,
					leads: hasAny ? leads : null,
					sales: hasAny ? sales : null,
					goal: goalByName.get(r.name) ?? 0,
					conversion_pct: (hasAny && leads > 0) ? Math.round((sales / leads) * 100 * 10) / 10 : 0,
				};
			});
			receptionistsPeriodLabel = toLabel(currentMonthPeriod);
		} else {
			// Fallback: sum May weekly data (smPayloads[1])
			const MayRecepRows = smPayloads[1]?.weekly?.salesWeekly?.byReceptionist ?? [];
			receptionistsList = MayRecepRows.map((r) => {
				let leads = 0;
				let sales = 0;
				let hasAny = false;
				for (let i = 0; i < 5; i++) {
					const lw = r.leadsByWeek[i];
					const sw = r.salesByWeek[i];
					if (lw != null || sw != null) {
						leads += (lw ?? 0);
						sales += (sw ?? 0);
						hasAny = true;
					}
				}
				return {
					name: r.name,
					leads: hasAny ? leads : null,
					sales: hasAny ? sales : null,
					goal: goalByName.get(r.name) ?? 0,
					conversion_pct: (hasAny && leads > 0) ? Math.round((sales / leads) * 100 * 10) / 10 : 0,
				};
			});
			receptionistsPeriodLabel = toLabel(prevMonthPeriod);
		}

		smDashboardPayload.receptionists = receptionistsList;
		smDashboardPayload.receptionistsPeriodLabel = receptionistsPeriodLabel;

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

	const primaryPeriodLabel = toLabel(smPrimaryPeriod);
	const comparisonPeriodLabel =
		comparisonPayload != null ? toLabel(smComparisonPeriod) : null;

	const salesMarketingDashboard = {
		payload: smDashboardPayload,
		primaryPayload: primaryPayload ? normalizeSmPayloadWeeks(structuredClone(primaryPayload)) : null,
		comparisonPayload: comparisonPayload ? normalizeSmPayloadWeeks(structuredClone(comparisonPayload)) : null,
		monthlySalesChart,
		salesTarget: consultorasSalesTarget > 0 ? consultorasSalesTarget : 150,
		primaryPeriodLabel,
		comparisonPeriodLabel,
		weekSourcePeriod,
		calendarCurrentMonthLabel: toLabel(currentMonthPeriod),
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
		kpiDataPeriod,
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
	};
}
