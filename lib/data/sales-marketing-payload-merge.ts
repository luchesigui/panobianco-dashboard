import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";

/** Sum non-null numeric cells (week columns). */
function sumNullable(arr: Array<number | null | undefined>): number {
  let s = 0;
  for (const v of arr) {
    if (typeof v === "number" && !Number.isNaN(v)) s += v;
  }
  return s;
}

function avgNullable(arr: Array<number | null | undefined>): number {
  const nums = arr.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Sum non-null numeric cells. Returns null if all are null/undefined. */
function sumNullableOrNull(arr: Array<number | null | undefined>): number | null {
  let s = 0;
  let hasAny = false;
  for (const v of arr) {
    if (typeof v === "number" && !Number.isNaN(v)) {
      s += v;
      hasAny = true;
    }
  }
  return hasAny ? s : null;
}

/** Recalculate derived totals after editing weekly arrays. */
export function recomputeWeeklyTotals(weekly: SalesMarketingDashboardPayload["weekly"]): void {
  const mk = weekly.marketing;
  mk.totals.reach = sumNullable(mk.reach);
  mk.totals.views = sumNullable(mk.views);
  mk.totals.followers = sumNullable(mk.followers);
  mk.totals.frequency = avgNullable(mk.frequency);

  const fw = weekly.funnelWeekly;
  fw.totals.scheduled = sumNullable(fw.scheduled);
  fw.totals.attendance = sumNullable(fw.attendance);
  fw.totals.closings = sumNullable(fw.closings);

  const sw = weekly.salesWeekly;
  sw.leadsGrandTotal = sumNullable(sw.leadsByWeek);
  sw.grandTotal = sumNullable(sw.totals);
  const rows = sw.byReceptionist;
  if (rows?.length) {
    for (const row of rows) {
      row.leadsTotal = sumNullableOrNull(row.leadsByWeek);
      row.salesTotal = sumNullableOrNull(row.salesByWeek);
    }
  }
}

const W = 5;
const WEEK_LABELS = ["S1", "S2", "S3", "S4", "S5"] as const;
const z = (): Array<number | null> => Array.from({ length: W }, () => null);

function padNullable(arr: Array<number | null | undefined> | null | undefined, n: number): Array<number | null> {
  const out: Array<number | null> = (arr || []).slice(0, n).map((v) => v ?? null);
  while (out.length < n) out.push(null);
  return out;
}

function funnelMetric(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** True when agendadas/presentes/fechamentos são todos zero (ou ausentes / não numéricos). */
export function isExperimentalFunnelEmpty(
  funnel: SalesMarketingDashboardPayload["funnel"] | null | undefined,
): boolean {
  if (!funnel?.scheduled || !funnel.present || !funnel.closings) return true;
  return (
    funnelMetric(funnel.scheduled.value) === 0 &&
    funnelMetric(funnel.present.value) === 0 &&
    funnelMetric(funnel.closings.value) === 0
  );
}

/** Ensure a loaded payload always has exactly W (5) week columns. Safe to call on any payload. */
export function normalizeSmPayloadWeeks(
  payload: SalesMarketingDashboardPayload,
): SalesMarketingDashboardPayload {
  const w = payload.weekly;
  w.weekHeaders = WEEK_LABELS.slice(0, W) as unknown as string[];
  const mk = w.marketing;
  mk.reach = padNullable(mk.reach, W);
  mk.frequency = padNullable(mk.frequency, W);
  mk.views = padNullable(mk.views, W);
  mk.followers = padNullable(mk.followers, W);
  const fw = w.funnelWeekly;
  fw.scheduled = padNullable(fw.scheduled, W);
  fw.attendance = padNullable(fw.attendance, W);
  fw.closings = padNullable(fw.closings, W);
  const sw = w.salesWeekly;
  sw.leadsByWeek = padNullable(sw.leadsByWeek ?? [], W);
  sw.totals = padNullable(sw.totals, W);
  for (const row of sw.byReceptionist ?? []) {
    row.leadsByWeek = padNullable(row.leadsByWeek, W);
    row.salesByWeek = padNullable(row.salesByWeek, W);
  }
  return payload;
}

function columnHasWeeklyData(
  cw: SalesMarketingDashboardPayload["weekly"],
  i: number,
): boolean {
  return (
    cw.marketing.reach[i] != null ||
    cw.marketing.frequency[i] != null ||
    cw.marketing.views[i] != null ||
    cw.marketing.followers[i] != null ||
    cw.funnelWeekly.scheduled[i] != null ||
    cw.funnelWeekly.attendance[i] != null ||
    cw.funnelWeekly.closings[i] != null ||
    cw.salesWeekly.totals[i] != null
  );
}

/**
 * Merge `primary` weekly columns with `fallback` where primary has no data in that week.
 * Only touches weekly arrays; funnel/composition/receptionists are applied by the caller.
 * Returns which calendar period id each week column came from (for UI pills).
 */
export function mergeSmWeeklyWithPeriodSource(
  primary: SalesMarketingDashboardPayload | null | undefined,
  fallback: SalesMarketingDashboardPayload | null | undefined,
  primaryPeriodId: string,
  fallbackPeriodId: string | null,
): {
  merged: SalesMarketingDashboardPayload;
  weekSourcePeriodId: string[];
} {
  const fbId = fallbackPeriodId ?? primaryPeriodId;

  if (!primary && !fallback) {
    return {
      merged: createDefaultSmPayload(""),
      weekSourcePeriodId: Array.from({ length: W }, () => primaryPeriodId),
    };
  }
  if (!primary && fallback) {
    const merged = normalizeSmPayloadWeeks(structuredClone(fallback));
    return {
      merged,
      weekSourcePeriodId: Array.from({ length: W }, () => fbId),
    };
  }
  if (primary && !fallback) {
    const merged = normalizeSmPayloadWeeks(structuredClone(primary));
    return {
      merged,
      weekSourcePeriodId: Array.from({ length: W }, () => primaryPeriodId),
    };
  }

  const c = normalizeSmPayloadWeeks(structuredClone(primary as SalesMarketingDashboardPayload));
  const p = normalizeSmPayloadWeeks(structuredClone(fallback as SalesMarketingDashboardPayload));
  const weekSourcePeriodId: string[] = [];

  const cw = c.weekly;
  const pw = p.weekly;

  for (let i = 0; i < W; i++) {
    const hasData = columnHasWeeklyData(cw, i);
    weekSourcePeriodId.push(hasData ? primaryPeriodId : fbId);

    if (!hasData) {
      cw.marketing.reach[i] = pw.marketing.reach[i];
      cw.marketing.frequency[i] = pw.marketing.frequency[i];
      cw.marketing.views[i] = pw.marketing.views[i];
      cw.marketing.followers[i] = pw.marketing.followers[i];
      cw.funnelWeekly.scheduled[i] = pw.funnelWeekly.scheduled[i];
      cw.funnelWeekly.attendance[i] = pw.funnelWeekly.attendance[i];
      cw.funnelWeekly.closings[i] = pw.funnelWeekly.closings[i];
      cw.salesWeekly.leadsByWeek[i] = pw.salesWeekly.leadsByWeek[i];
      cw.salesWeekly.totals[i] = pw.salesWeekly.totals[i];

      if (cw.salesWeekly.byReceptionist?.length) {
        for (const row of cw.salesWeekly.byReceptionist) {
          const prevRow = pw.salesWeekly.byReceptionist?.find((r) => r.name === row.name);
          row.leadsByWeek[i] = prevRow?.leadsByWeek[i] ?? null;
          row.salesByWeek[i] = prevRow?.salesByWeek[i] ?? null;
        }
      } else if (pw.salesWeekly.byReceptionist?.length) {
        cw.salesWeekly.byReceptionist = cw.salesWeekly.byReceptionist ?? [];
        for (const prevRow of pw.salesWeekly.byReceptionist) {
          let row = cw.salesWeekly.byReceptionist.find((r) => r.name === prevRow.name);
          if (!row) {
            row = {
              name: prevRow.name,
              leadsByWeek: Array(W).fill(null),
              leadsTotal: 0,
              salesByWeek: Array(W).fill(null),
              salesTotal: 0,
            };
            cw.salesWeekly.byReceptionist.push(row);
          }
          row.leadsByWeek[i] = prevRow.leadsByWeek[i];
          row.salesByWeek[i] = prevRow.salesByWeek[i];
        }
      }
    }
  }

  recomputeWeeklyTotals(cw);

  return { merged: c, weekSourcePeriodId };
}

/** Default payload for a month when none exists yet (valid shape for UI + DB). */
export function createDefaultSmPayload(periodLabel: string): SalesMarketingDashboardPayload {
  return {
    funnel: {
      scheduled: { value: 0, subtext: "—" },
      present: { value: 0, subtext: "—" },
      closings: { value: 0, subtext: "—" },
      conversion: { value: 0, subtext: "—", isPercent: true },
    },
    weekly: {
      weekHeaders: ["S1", "S2", "S3", "S4", "S5"],
      marketingTitle: "MARKETING — META ADS / INSTAGRAM",
      marketing: {
        reach: z(),
        frequency: z(),
        views: z(),
        followers: z(),
        totals: { reach: 0, frequency: 0, views: 0, followers: 0 },
      },
      funnelTitle: "FUNIL DE AULA EXPERIMENTAL",
      funnelWeekly: {
        scheduled: z(),
        attendance: z(),
        closings: z(),
        totals: { scheduled: 0, attendance: 0, closings: 0 },
      },
      salesTitle: "VENDAS TOTAIS",
      salesWeekly: {
        leadsByWeek: z(),
        leadsGrandTotal: 0,
        totals: z(),
        grandTotal: 0,
        byReceptionist: [],
      },
    },
    receptionistsPeriodLabel: periodLabel,
    receptionists: [],
  };
}
