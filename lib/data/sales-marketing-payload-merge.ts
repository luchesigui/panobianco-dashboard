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
  sw.grandTotal = sumNullable(sw.totals);
  const rows = sw.byReceptionist;
  if (rows?.length) {
    for (const row of rows) {
      row.rowTotal = sumNullable(row.salesByWeek);
    }
  }
}

const W = 5;
const z = (): Array<number | null> => Array.from({ length: W }, () => null);

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
        totals: z(),
        grandTotal: 0,
        byReceptionist: [],
      },
    },
    receptionistsPeriodLabel: periodLabel,
    receptionists: [],
  };
}
