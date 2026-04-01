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

export type KpiPageData = {
  gymName: string;
  currentPeriodLabel: string;
  previousPeriodLabel?: string;
  /** Two months before current (e.g. Jan when current is Mar and previous is Feb). */
  previousPreviousPeriodLabel?: string;
  current: KpiMap;
  previous: KpiMap;
  previousPrevious: KpiMap;
  currentMeta: KpiMetaMap;
  retentionCharts: RetentionChartPayload;
  insights: Record<string, Array<{ type: string; title: string; body: string }>>;
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
  };
  financeCharts: FinanceChartPayload;
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
function projectionMonthStarLabels(periodYyyyMmDd: string, count: number): string[] {
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

export async function getKpiPageData(
  gymSlug = "panobianco-jd-satelite",
): Promise<KpiPageData> {
  const supabase = getServiceSupabase();

  const { data: gym, error: gymError } = await supabase
    .from("gyms")
    .select("id,name")
    .eq("slug", gymSlug)
    .single();
  if (gymError || !gym) throw new Error(`Gym load failed: ${gymError?.message}`);

  const { data: periodRows, error: periodsError } = await supabase
    .from("kpi_values")
    .select("period_id")
    .eq("gym_id", gym.id)
    .order("period_id", { ascending: false });
  if (periodsError || !periodRows?.length) {
    throw new Error(`Periods load failed: ${periodsError?.message}`);
  }

  const uniquePeriods = [
    ...new Set(periodRows.map((p) => normalizePeriodId(p.period_id))),
  ].sort((a, b) => b.localeCompare(a));
  const currentPeriod = uniquePeriods[0];
  const previousPeriod = uniquePeriods[1];
  const thirdPeriod = uniquePeriods[2];
  const periodIds = [currentPeriod, previousPeriod, thirdPeriod].filter(Boolean) as string[];

  const [defsRes, valuesRes, insightsRes, dashboardRes, salesHistoryRes] =
    await Promise.all([
      supabase.from("kpi_definitions").select("id,code"),
      supabase
        .from("kpi_values")
        .select("period_id,kpi_definition_id,value_numeric,meta_json")
        .eq("gym_id", gym.id)
        .in("period_id", periodIds),
      supabase
        .from("kpi_insights")
        .select("category,insight_scope,insight_type,title,body,sort_order,meta_json")
        .eq("gym_id", gym.id)
        .eq("period_id", currentPeriod)
        .order("sort_order", { ascending: true }),
      supabase
        .from("sales_marketing_dashboard_payload")
        .select("payload")
        .eq("gym_id", gym.id)
        .eq("period_id", currentPeriod)
        .maybeSingle(),
      supabase
        .from("kpi_values")
        .select("period_id,kpi_definition_id,value_numeric")
        .eq("gym_id", gym.id)
        .gte("period_id", "2025-04-01")
        .lte("period_id", currentPeriod)
        .order("period_id", { ascending: true }),
    ]);

  if (defsRes.error) throw new Error(`Definitions load failed: ${defsRes.error.message}`);
  if (valuesRes.error) throw new Error(`Values load failed: ${valuesRes.error.message}`);
  if (insightsRes.error) throw new Error(`Insights load failed: ${insightsRes.error.message}`);
  if (dashboardRes.error) {
    throw new Error(`Dashboard payload load failed: ${dashboardRes.error.message}`);
  }
  if (salesHistoryRes.error) {
    throw new Error(`Sales history load failed: ${salesHistoryRes.error.message}`);
  }

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
  const matDefId = defsRes.data?.find((d) => d.code === "matriculated_revenue")?.id;
  const whDefId = defsRes.data?.find((d) => d.code === "wellhub_revenue")?.id;
  const tpDefId = defsRes.data?.find((d) => d.code === "totalpass_revenue")?.id;
  const prDefId = defsRes.data?.find((d) => d.code === "products_revenue")?.id;
  const opDefId = defsRes.data?.find((d) => d.code === "operational_result")?.id;

  const financePeriodRows = (salesHistoryRes.data ?? []).filter((r) => {
    const pid = normalizePeriodId(r.period_id);
    return pid >= "2025-04-01" && pid <= currentPeriod;
  });
  const byPeriodFinance = new Map<
    string,
    { rev?: number; m?: number; w?: number; t?: number; p?: number; op?: number }
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
      if (row.kpi_definition_id !== salesDefId || row.value_numeric == null) continue;
      const pid = normalizePeriodId(row.period_id);
      byPeriod.set(pid, Number(row.value_numeric));
    }
    const sortedPeriods = [...byPeriod.keys()].sort((a, b) => a.localeCompare(b));
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

  const rawPayload = dashboardRes.data?.payload;
  const salesMarketingDashboard = {
    payload:
      rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
        ? (rawPayload as SalesMarketingDashboardPayload)
        : null,
    monthlySalesChart,
    salesTarget: 150,
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
    if (rowPeriod === currentPeriod) {
      current[code] = value;
      const meta = row.meta_json;
      if (meta && typeof meta === "object" && !Array.isArray(meta)) {
        currentMeta[code] = meta as Record<string, unknown>;
      }
    }
    if (previousPeriod && rowPeriod === previousPeriod) previous[code] = value;
    if (thirdPeriod && rowPeriod === thirdPeriod) previousPrevious[code] = value;
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
        section: String((row.meta_json as { section?: string })?.section ?? row.category),
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

  const baseDefId = defsRes.data?.find((d) => d.code === "base_students_end")?.id;
  const baseHistoricRows = (salesHistoryRes.data ?? [])
    .filter(
      (r) =>
        baseDefId != null &&
        r.kpi_definition_id === baseDefId &&
        r.value_numeric != null &&
        normalizePeriodId(r.period_id) < currentPeriod,
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
  const projLabels = projectionMonthStarLabels(currentPeriod, projScaled.length);
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

  const openMeta = (currentMeta.open_default_count ?? {}) as Record<string, unknown>;
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

  const retentionCharts: RetentionChartPayload = {
    chartLabels,
    baseHistoric,
    baseProjection,
    baseGoalLine: 875,
    inadimplencia: {
      titleSuffix: `${toLabel(currentPeriod)} (parcial)`,
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
    currentPeriodLabel: toLabel(currentPeriod),
    previousPeriodLabel: previousPeriod ? toLabel(previousPeriod) : undefined,
    previousPreviousPeriodLabel: thirdPeriod ? toLabel(thirdPeriod) : undefined,
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
    roiCharts,
  };
}
