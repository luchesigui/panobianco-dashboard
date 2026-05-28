import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { createDefaultSmPayload, recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";

export type FunilMensalRow = {
  scheduled: number;
  present: number;
  closings: number;
};

export type MarketingSemanalRow = {
  week_num: number;
  reach: number | null;
  frequency: number | null;
  views: number | null;
  followers: number | null;
};

export type FunilSemanalRow = {
  week_num: number;
  scheduled: number | null;
  attendance: number | null;
  closings: number | null;
};

export type ConversoesSemanalRow = {
  week_num: number;
  leads: number | null;
  sales: number | null;
};

export type RecepcaoSemanalRow = {
  week_num: number;
  receptionist_name: string;
  leads: number | null;
  sales: number | null;
};

export type ConsultoraRef = {
  name: string;
  monthly_goal: number | null;
};

const W = 5;
const nullArray = (): Array<number | null> => Array.from({ length: W }, () => null);

export function assemblePayloadFromNormalized({
  funilMensal,
  marketingSemanal,
  funilSemanal,
  conversoesSemanal,
  recepcaoSemanal,
  consultoras,
  periodLabel,
}: {
  funilMensal: FunilMensalRow | null;
  marketingSemanal: MarketingSemanalRow[];
  funilSemanal: FunilSemanalRow[];
  conversoesSemanal: ConversoesSemanalRow[];
  recepcaoSemanal: RecepcaoSemanalRow[];
  consultoras: ConsultoraRef[];
  periodLabel: string;
}): SalesMarketingDashboardPayload {
  if (!funilMensal && !marketingSemanal.length && !funilSemanal.length && !conversoesSemanal.length && !recepcaoSemanal.length) {
    return createDefaultSmPayload(periodLabel);
  }

  const reach = nullArray();
  const frequency = nullArray();
  const views = nullArray();
  const followers = nullArray();
  for (const r of marketingSemanal) {
    const i = r.week_num - 1;
    if (i >= 0 && i < W) {
      reach[i] = r.reach;
      frequency[i] = r.frequency;
      views[i] = r.views;
      followers[i] = r.followers;
    }
  }

  const fwScheduled = nullArray();
  const fwAttendance = nullArray();
  const fwClosings = nullArray();
  for (const r of funilSemanal) {
    const i = r.week_num - 1;
    if (i >= 0 && i < W) {
      fwScheduled[i] = r.scheduled;
      fwAttendance[i] = r.attendance;
      fwClosings[i] = r.closings;
    }
  }

  const leadsByWeek = nullArray();
  const salesByWeek = nullArray();
  for (const r of conversoesSemanal) {
    const i = r.week_num - 1;
    if (i >= 0 && i < W) {
      leadsByWeek[i] = r.leads;
      salesByWeek[i] = r.sales;
    }
  }

  const namesInOrder = consultoras.length
    ? consultoras.map((c) => c.name)
    : [...new Set(recepcaoSemanal.map((r) => r.receptionist_name))];

  const byReceptionist = namesInOrder.map((name) => {
    const weekLeads = nullArray();
    const weekSales = nullArray();
    for (const r of recepcaoSemanal.filter((x) => x.receptionist_name === name)) {
      const i = r.week_num - 1;
      if (i >= 0 && i < W) {
        weekLeads[i] = r.leads;
        weekSales[i] = r.sales;
      }
    }
    return {
      name,
      leadsByWeek: weekLeads,
      leadsTotal: null as number | null,
      salesByWeek: weekSales,
      salesTotal: null as number | null,
    };
  });

  const scheduled = funilMensal?.scheduled ?? 0;
  const present = funilMensal?.present ?? 0;
  const closings = funilMensal?.closings ?? 0;
  const conversionValue = scheduled > 0 ? Math.round((closings / scheduled) * 1000) / 10 : 0;

  const receptionists = namesInOrder.map((name) => {
    const row = byReceptionist.find((r) => r.name === name);
    const consultoraGoal = consultoras.find((c) => c.name === name)?.monthly_goal ?? 0;
    let leads = 0;
    let sales = 0;
    let hasAny = false;
    if (row) {
      for (let i = 0; i < W; i++) {
        if (row.leadsByWeek[i] !== null) { leads += row.leadsByWeek[i]!; hasAny = true; }
        if (row.salesByWeek[i] !== null) { sales += row.salesByWeek[i]!; hasAny = true; }
      }
    }
    const conversion_pct = leads > 0 ? Math.round((sales / leads) * 1000) / 10 : 0;
    return {
      name,
      leads: hasAny ? leads : null,
      sales: hasAny ? sales : null,
      goal: consultoraGoal,
      conversion_pct,
    };
  });

  const payload: SalesMarketingDashboardPayload = {
    funnel: {
      scheduled: { value: scheduled, subtext: "—" },
      present: { value: present, subtext: "—" },
      closings: { value: closings, subtext: "—" },
      conversion: { value: conversionValue, subtext: "—", isPercent: true },
    },
    weekly: {
      weekHeaders: ["S1", "S2", "S3", "S4", "S5"],
      marketingTitle: "MARKETING — META ADS / INSTAGRAM",
      marketing: {
        reach,
        frequency,
        views,
        followers,
        totals: { reach: 0, frequency: 0, views: 0, followers: 0 },
      },
      funnelTitle: "FUNIL DE AULA EXPERIMENTAL",
      funnelWeekly: {
        scheduled: fwScheduled,
        attendance: fwAttendance,
        closings: fwClosings,
        totals: { scheduled: 0, attendance: 0, closings: 0 },
      },
      salesTitle: "VENDAS TOTAIS",
      salesWeekly: {
        leadsByWeek,
        leadsGrandTotal: 0,
        totals: salesByWeek,
        grandTotal: 0,
        byReceptionist,
      },
    },
    receptionistsPeriodLabel: periodLabel,
    receptionists,
  };

  recomputeWeeklyTotals(payload.weekly);
  return payload;
}

export type NormalizedWriteRows = {
  funilMensal: { scheduled: number; present: number; closings: number };
  marketingSemanal: MarketingSemanalRow[];
  funilSemanal: FunilSemanalRow[];
  conversoesSemanal: ConversoesSemanalRow[];
  recepcaoSemanal: Array<RecepcaoSemanalRow & { consultora_id?: string | null }>;
};

export function decomposePayloadToRows(payload: SalesMarketingDashboardPayload): NormalizedWriteRows {
  const { funnel, weekly } = payload;
  const { marketing, funnelWeekly, salesWeekly } = weekly;

  const funilMensal = {
    scheduled: funnel.scheduled.value,
    present: funnel.present.value,
    closings: funnel.closings.value,
  };

  const marketingSemanal: MarketingSemanalRow[] = [];
  for (let i = 0; i < W; i++) {
    const reach = marketing.reach[i] ?? null;
    const frequency = marketing.frequency[i] ?? null;
    const views = marketing.views[i] ?? null;
    const followers = marketing.followers[i] ?? null;
    if (reach !== null || frequency !== null || views !== null || followers !== null) {
      marketingSemanal.push({ week_num: i + 1, reach, frequency, views, followers });
    }
  }

  const funilSemanal: FunilSemanalRow[] = [];
  for (let i = 0; i < W; i++) {
    const scheduled = funnelWeekly.scheduled[i] ?? null;
    const attendance = funnelWeekly.attendance[i] ?? null;
    const closings = funnelWeekly.closings[i] ?? null;
    if (scheduled !== null || attendance !== null || closings !== null) {
      funilSemanal.push({ week_num: i + 1, scheduled, attendance, closings });
    }
  }

  const conversoesSemanal: ConversoesSemanalRow[] = [];
  for (let i = 0; i < W; i++) {
    const leads = salesWeekly.leadsByWeek[i] ?? null;
    const sales = salesWeekly.totals[i] ?? null;
    if (leads !== null || sales !== null) {
      conversoesSemanal.push({ week_num: i + 1, leads, sales });
    }
  }

  const recepcaoSemanal: NormalizedWriteRows["recepcaoSemanal"] = [];
  for (const row of salesWeekly.byReceptionist ?? []) {
    for (let i = 0; i < W; i++) {
      const leads = row.leadsByWeek[i] ?? null;
      const sales = row.salesByWeek[i] ?? null;
      if (leads !== null || sales !== null) {
        recepcaoSemanal.push({ week_num: i + 1, receptionist_name: row.name, leads, sales });
      }
    }
  }

  return { funilMensal, marketingSemanal, funilSemanal, conversoesSemanal, recepcaoSemanal };
}
