"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KPI_FORM_GROUPS,
  REFERENCE_DOC_HINT,
  type KpiFormField,
} from "@/lib/data/dashboard-input-requirements";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";
import type { GymOption } from "@/lib/data/entrada-load";
import { saveMonthlyKpisAction, saveSmDashboardAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function parsePtBrNumber(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const normalized = t.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function numRowToStrings(arr: Array<number | null | undefined> | undefined, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const v = arr?.[i];
    out.push(v == null || v === undefined ? "" : String(v));
  }
  return out;
}

function stringsToNumRow(s: string[]): Array<number | null> {
  return s.map((x) => {
    const v = parsePtBrNumber(x);
    return v === undefined ? null : v;
  });
}

function formatCurrency(raw: string): string {
  if (!raw.trim()) return "";
  const num = parsePtBrNumber(raw);
  if (num === undefined) return raw;
  return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num)}`;
}

function formatMonthPtBr(yyyyMm: string): string {
  if (!yyyyMm) return "";
  const d = new Date(`${yyyyMm}-01T12:00:00`);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
  return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
}

type WeeklyStrings = {
  reach: string[];
  frequency: string[];
  views: string[];
  followers: string[];
  sch: string[];
  att: string[];
  clo: string[];
  salesTot: string[];
};

type RecepWeekRow = { id: string; name: string; weeks: string[] };

function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type FunnelStepStr = { value: string };

type RecepMonthRow = {
  id: string;
  name: string;
  leads: string;
  sales: string;
  goal: string;
  badge: string;
};

type Props = {
  gyms: GymOption[];
  initialGymSlug: string;
  initialPeriodId: string;
  initialKpiValues: Record<string, number>;
  initialMetaByCode: Record<string, Record<string, unknown>>;
  initialSmPayload: SalesMarketingDashboardPayload;
};

function buildWeeklyStrings(p: SalesMarketingDashboardPayload): WeeklyStrings {
  const n = p.weekly.weekHeaders.length;
  const w = p.weekly;
  return {
    reach: numRowToStrings(w.marketing.reach, n),
    frequency: numRowToStrings(w.marketing.frequency, n),
    views: numRowToStrings(w.marketing.views, n),
    followers: numRowToStrings(w.marketing.followers, n),
    sch: numRowToStrings(w.funnelWeekly.scheduled, n),
    att: numRowToStrings(w.funnelWeekly.attendance, n),
    clo: numRowToStrings(w.funnelWeekly.closings, n),
    salesTot: numRowToStrings(w.salesWeekly.totals, n),
  };
}

function recepRowsFromPayload(p: SalesMarketingDashboardPayload): RecepWeekRow[] {
  const n = p.weekly.weekHeaders.length;
  const rows = p.weekly.salesWeekly.byReceptionist ?? [];
  if (rows.length === 0) return [];
  return rows.map((r) => ({
    id: newRowId(),
    name: r.name,
    weeks: numRowToStrings(r.salesByWeek, n),
  }));
}

function funnelToState(p: SalesMarketingDashboardPayload): {
  scheduled: FunnelStepStr;
  present: FunnelStepStr;
  closings: FunnelStepStr;
} {
  const f = p.funnel;
  return {
    scheduled: { value: String(f.scheduled.value) },
    present: { value: String(f.present.value) },
    closings: { value: String(f.closings.value) },
  };
}

function recepMonthFromPayload(p: SalesMarketingDashboardPayload): RecepMonthRow[] {
  if (p.receptionists.length === 0) {
    return [
      {
        id: newRowId(),
        name: "",
        leads: "",
        sales: "",
        goal: "38",
        badge: "",
      },
    ];
  }
  return p.receptionists.map((r) => ({
    id: newRowId(),
    name: r.name,
    leads: String(r.leads),
    sales: String(r.sales),
    goal: String(r.goal),
    badge: r.badge ?? "",
  }));
}

function compFromPayload(p: SalesMarketingDashboardPayload) {
  const c = p.salesComposition;
  return {
    expV: c ? String(c.experimental.value) : "",
    expS: c?.experimental.subtext ?? "",
    othV: c ? String(c.otherChannels.value) : "",
    othS: c?.otherChannels.subtext ?? "",
  };
}

function assembleSmPayload(
  base: SalesMarketingDashboardPayload,
  funnel: ReturnType<typeof funnelToState>,
  weeklyStr: WeeklyStrings,
  recepRows: RecepWeekRow[],
  recepMonth: RecepMonthRow[],
  recLabel: string,
  comp: ReturnType<typeof compFromPayload>,
  monthlyMarketing?: { reach?: number; frequency?: number; views?: number; followers?: number },
): SalesMarketingDashboardPayload {
  const out: SalesMarketingDashboardPayload = structuredClone(base);
  const sch = parsePtBrNumber(funnel.scheduled.value) ?? 0;
  const pres = parsePtBrNumber(funnel.present.value) ?? 0;
  const clo = parsePtBrNumber(funnel.closings.value) ?? 0;
  const conv = pres > 0 ? Math.round((clo / pres) * 100 * 10) / 10 : 0;
  out.funnel.scheduled = { value: sch, subtext: "—" };
  out.funnel.present = { value: pres, subtext: "—" };
  out.funnel.closings = { value: clo, subtext: "—" };
  out.funnel.conversion = { value: conv, subtext: "—", isPercent: true };

  const ev = parsePtBrNumber(comp.expV) ?? 0;
  const ov = parsePtBrNumber(comp.othV) ?? 0;
  if (ev > 0 || ov > 0) {
    out.salesComposition = {
      sectionTitle: "Composição das vendas",
      experimental: {
        title: "Via aula experimental",
        value: ev,
        subtext: comp.expS || "—",
      },
      otherChannels: {
        title: "Outros canais",
        value: ov,
        subtext: comp.othS || "—",
      },
    };
  } else {
    delete out.salesComposition;
  }

  out.receptionists = recepMonth
    .filter((r) => r.name.trim() !== "")
    .map((r) => {
      const leads = parsePtBrNumber(r.leads) ?? 0;
      const sales = parsePtBrNumber(r.sales) ?? 0;
      const conversion_pct = leads > 0 ? Math.round((sales / leads) * 100 * 10) / 10 : 0;
      return {
        name: r.name.trim(),
        leads,
        sales,
        goal: parsePtBrNumber(r.goal) ?? 0,
        conversion_pct,
        badge: r.badge.trim() || undefined,
      };
    });
  out.receptionistsPeriodLabel = recLabel.trim() || undefined;

  const n = out.weekly.weekHeaders.length;
  out.weekly.marketing.reach = stringsToNumRow(weeklyStr.reach);
  out.weekly.marketing.frequency = stringsToNumRow(weeklyStr.frequency);
  out.weekly.marketing.views = stringsToNumRow(weeklyStr.views);
  out.weekly.marketing.followers = stringsToNumRow(weeklyStr.followers);
  out.weekly.funnelWeekly.scheduled = stringsToNumRow(weeklyStr.sch);
  out.weekly.funnelWeekly.attendance = stringsToNumRow(weeklyStr.att);
  out.weekly.funnelWeekly.closings = stringsToNumRow(weeklyStr.clo);
  out.weekly.salesWeekly.totals = stringsToNumRow(weeklyStr.salesTot);
  out.weekly.salesWeekly.byReceptionist = recepRows
    .filter((r) => r.name.trim() !== "")
    .map((r) => {
      const salesByWeek = stringsToNumRow(r.weeks.slice(0, n));
      while (salesByWeek.length < n) salesByWeek.push(null);
      return {
        name: r.name.trim(),
        salesByWeek,
        rowTotal: 0,
      };
    });
  recomputeWeeklyTotals(out.weekly);
  // Override marketing totals with monthly values when provided
  if (monthlyMarketing) {
    const t = out.weekly.marketing.totals;
    if (monthlyMarketing.reach != null)     t.reach     = monthlyMarketing.reach;
    if (monthlyMarketing.frequency != null) t.frequency = monthlyMarketing.frequency;
    if (monthlyMarketing.views != null)     t.views     = monthlyMarketing.views;
    if (monthlyMarketing.followers != null) t.followers = monthlyMarketing.followers;
  }
  return out;
}

function weekMismatchMessages(
  ws: WeeklyStrings,
  recepRows: RecepWeekRow[],
  n: number,
): string[] {
  const msgs: string[] = [];
  for (let i = 0; i < n; i++) {
    let sumR = 0;
    let any = false;
    for (const row of recepRows) {
      if (!row.name.trim()) continue;
      const v = parsePtBrNumber(row.weeks[i] ?? "");
      if (v !== undefined) {
        sumR += v;
        any = true;
      }
    }
    const agg = parsePtBrNumber(ws.salesTot[i] ?? "");
    if (any && agg !== undefined && sumR !== agg) {
      msgs.push(
        `Semana ${i + 1}: soma recepcionistas (${sumR}) ≠ vendas todos canais (${agg}).`,
      );
    }
  }
  return msgs;
}

function fieldToInputKey(f: KpiFormField): string {
  return f.code;
}

export function EntradaDadosForm({
  gyms,
  initialGymSlug,
  initialPeriodId,
  initialKpiValues,
  initialMetaByCode,
  initialSmPayload,
}: Props) {
  const router = useRouter();
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [kpiSaving, setKpiSaving] = useState(false);
  const [smSaving, setSmSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const gymSlug = initialGymSlug;
  const monthValue = initialPeriodId.slice(0, 7);

  const navigateTo = (gym: string, month: string) => {
    const p = month.length === 7 ? `${month}-01` : month;
    router.push(`/kpis/entrada-dados?gym=${encodeURIComponent(gym)}&month=${encodeURIComponent(p)}`);
  };

  const [kpiInputs, setKpiInputs] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const g of KPI_FORM_GROUPS) {
      for (const f of g.fields) {
        const k = fieldToInputKey(f);
        const v = initialKpiValues[f.code];
        o[k] = v === undefined ? "" : String(v);
      }
    }
    return o;
  });

  const [metaJson, setMetaJson] = useState(() =>
    Object.keys(initialMetaByCode).length
      ? JSON.stringify(initialMetaByCode, null, 2)
      : "",
  );

  const [smPayload] = useState<SalesMarketingDashboardPayload>(() =>
    structuredClone(initialSmPayload),
  );
  const [funnel, setFunnel] = useState(() => funnelToState(initialSmPayload));
  const [comp, setComp] = useState(() => compFromPayload(initialSmPayload));
  const [recepMonth, setRecepMonth] = useState(() => recepMonthFromPayload(initialSmPayload));
  const [recLabel, setRecLabel] = useState(
    () => initialSmPayload.receptionistsPeriodLabel ?? "",
  );
  const [weeklyStr, setWeeklyStr] = useState(() => buildWeeklyStrings(initialSmPayload));
  const [recepWeekRows, setRecepWeekRows] = useState(() => recepRowsFromPayload(initialSmPayload));

  const nWeeks = smPayload.weekly.weekHeaders.length;
  const weekHeaders = smPayload.weekly.weekHeaders;

  const mismatch = useMemo(
    () => weekMismatchMessages(weeklyStr, recepWeekRows, nWeeks),
    [weeklyStr, recepWeekRows, nWeeks],
  );

  const handleSaveKpis = async () => {
    setMessage(null);
    setKpiSaving(true);
    try {
      const values: Record<string, number> = {};
      for (const g of KPI_FORM_GROUPS) {
        for (const f of g.fields) {
          const k = fieldToInputKey(f);
          const num = parsePtBrNumber(kpiInputs[k] ?? "");
          values[f.code] = num ?? 0;
        }
      }
      // expenses_total = sum of expense breakdown fields (calculated, not entered)
      const expensesTotal =
        (values["expenses_products"] ?? 0) +
        (values["expenses_taxes"] ?? 0) +
        (values["expenses_payroll"] ?? 0) +
        (values["expenses_property"] ?? 0) +
        (values["expenses_other"] ?? 0) +
        (values["expenses_financing"] ?? 0) +
        (values["royalties_validation"] ?? 0);
      values["expenses_total"] = expensesTotal;

      // revenue_total = sum of the four revenue streams (calculated, not entered)
      const revenueTotal =
        (values["matriculated_revenue"] ?? 0) +
        (values["wellhub_revenue"] ?? 0) +
        (values["totalpass_revenue"] ?? 0) +
        (values["products_revenue"] ?? 0);
      values["revenue_total"] = revenueTotal;

      let metaByCode: Record<string, Record<string, unknown>> | undefined;
      if (metaJson.trim()) {
        try {
          const parsed = JSON.parse(metaJson) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            metaByCode = parsed as Record<string, Record<string, unknown>>;
          } else throw new Error("JSON deve ser um objeto.");
        } catch {
          setMessage({ type: "err", text: "Metadados JSON inválido." });
          setKpiSaving(false);
          return;
        }
      }
      const res = await saveMonthlyKpisAction({
        gymSlug: initialGymSlug,
        periodId: initialPeriodId,
        values,
        metaByCode,
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "KPIs mensais gravados." });
        router.refresh();
      } else setMessage({ type: "err", text: res.error });
    } finally {
      setKpiSaving(false);
    }
  };

  const handleSaveSm = async () => {
    setMessage(null);
    setSmSaving(true);
    try {
      const monthlyMarketing = {
        reach:     parsePtBrNumber(kpiInputs["marketing_reach"] ?? "") ?? undefined,
        frequency: parsePtBrNumber(kpiInputs["marketing_frequency"] ?? "") ?? undefined,
        views:     parsePtBrNumber(kpiInputs["marketing_views"] ?? "") ?? undefined,
        followers: parsePtBrNumber(kpiInputs["marketing_followers"] ?? "") ?? undefined,
      };
      const assembled = assembleSmPayload(
        smPayload,
        funnel,
        weeklyStr,
        recepWeekRows,
        recepMonth,
        recLabel,
        comp,
        monthlyMarketing,
      );
      const res = await saveSmDashboardAction({
        gymSlug: initialGymSlug,
        periodId: initialPeriodId,
        payload: assembled,
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Payload vendas/marketing gravado." });
        router.refresh();
      } else setMessage({ type: "err", text: res.error });
    } finally {
      setSmSaving(false);
    }
  };

  const copyRecepNames = () => {
    const names = recepMonth.map((r) => r.name.trim()).filter(Boolean);
    if (names.length === 0) {
      setMessage({ type: "err", text: "Preencha primeiro os nomes na tabela mensal." });
      return;
    }
    setRecepWeekRows(
      names.map((name) => ({
        id: newRowId(),
        name,
        weeks: Array.from({ length: nWeeks }, () => ""),
      })),
    );
    setMessage({ type: "ok", text: "Nomes copiados; preencha as vendas por semana." });
  };

  const updateMatrix = (key: keyof WeeklyStrings, weekIdx: number, value: string) => {
    setWeeklyStr((prev) => {
      const row = [...prev[key]];
      row[weekIdx] = value;
      return { ...prev, [key]: row };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">Entrada de dados</h1>
          <p className="text-sm text-slate-500">
            Academia: <span className="font-medium text-slate-700">{gyms.find((g) => g.slug === gymSlug)?.name ?? gymSlug}</span>
            <span className="mx-2 text-slate-300">·</span>
            Período: <span className="font-medium text-slate-700">{formatMonthPtBr(initialPeriodId.slice(0, 7))}</span>
          </p>
        </div>

        {/* Toolbar */}
        <Card className="mb-8 shadow-sm border-slate-200">
          <CardContent className="py-5 px-6">
            <div className="flex flex-wrap gap-5 items-end">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gym" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academia</Label>
                  <Select value={gymSlug} onValueChange={(v) => { if (v) navigateTo(v, monthValue); }}>
                    <SelectTrigger id="gym" className="w-52 h-10 bg-white">
                      <SelectValue>{gyms.find((g) => g.slug === gymSlug)?.name ?? gymSlug}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {gyms.map((g) => (
                        <SelectItem key={g.slug} value={g.slug}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês</Label>
                  {(() => {
                    const now = new Date();
                    const maxMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                    const atMax = monthValue >= maxMonth;
                    const goPrev = () => {
                      const [y, m] = monthValue.split("-").map(Number);
                      navigateTo(gymSlug, m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`);
                    };
                    const goNext = () => {
                      if (atMax) return;
                      const [y, m] = monthValue.split("-").map(Number);
                      navigateTo(gymSlug, m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`);
                    };
                    return (
                      <div className="flex items-center h-10 rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          aria-label="Mês anterior"
                          onClick={goPrev}
                          className="flex items-center justify-center w-9 h-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-200 shrink-0 text-lg leading-none"
                        >
                          ‹
                        </button>
                        <span className="flex-1 text-center text-sm text-slate-900 select-none px-2 whitespace-nowrap min-w-44">
                          {formatMonthPtBr(monthValue)}
                        </span>
                        <button
                          type="button"
                          aria-label="Próximo mês"
                          onClick={goNext}
                          disabled={atMax}
                          className="flex items-center justify-center w-9 h-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-l border-slate-200 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                        >
                          ›
                        </button>
                      </div>
                    );
                  })()}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Status message */}
        {message ? (
          <div
            className={`px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 ${
              message.type === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "ok" ? "✓" : "✕"} {message.text}
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="semanal">
          <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
            <TabsTrigger value="semanal" className="px-6 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Semanal</TabsTrigger>
            <TabsTrigger value="mensal" className="px-6 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Mensal</TabsTrigger>
          </TabsList>

        {/* ── Tab Mensal ── */}
        <TabsContent value="mensal" className="space-y-5">
          {KPI_FORM_GROUPS.map((group) => (
            <Card key={group.id} className="shadow-sm border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{group.title}</CardTitle>
                {group.description ? (
                  <CardDescription className="text-xs text-slate-400 mt-0.5">{group.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
                  {group.fields.map((f) => {
                    const k = fieldToInputKey(f);
                    const isFocused = focusedInput === k;
                    const rawVal = kpiInputs[k] ?? "";
                    const displayVal =
                      f.unit === "currency" && !isFocused ? formatCurrency(rawVal) : rawVal;
                    return (
                      <div key={`${group.id}-${k}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={k} className="text-xs font-medium text-slate-600">{f.label}</Label>
                          {f.hint ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-slate-300 cursor-help text-xs leading-none hover:text-slate-500 transition-colors">ⓘ</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {f.hint}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                        <Input
                          id={k}
                          inputMode="decimal"
                          value={displayVal}
                          onFocus={() => setFocusedInput(k)}
                          onBlur={() => setFocusedInput(null)}
                          onChange={(e) =>
                            setKpiInputs((prev) => ({ ...prev, [k]: e.target.value }))
                          }
                          className="h-10 bg-white border-slate-200 focus:border-slate-400"
                          placeholder={
                            f.unit === "currency" ? "R$ 0" : f.unit === "percent" ? "ex: 77" : ""
                          }
                        />
                      </div>
                    );
                  })}
                  {group.id === "finance_expenses" && (() => {
                    const total =
                      (parsePtBrNumber(kpiInputs["expenses_products"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["expenses_taxes"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["expenses_payroll"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["expenses_property"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["expenses_other"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["expenses_financing"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["royalties_validation"] ?? "") ?? 0);
                    return (
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs font-medium text-slate-600">Despesas totais</Label>
                        <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 select-none">
                          {total > 0 ? formatCurrency(String(total)) : "—"}
                        </div>
                      </div>
                    );
                  })()}
                  {group.id === "finance_revenues" && (() => {
                    const total =
                      (parsePtBrNumber(kpiInputs["matriculated_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["wellhub_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["totalpass_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["products_revenue"] ?? "") ?? 0);
                    return (
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs font-medium text-slate-600">Receita total</Label>
                        <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 select-none">
                          {total > 0 ? formatCurrency(String(total)) : "—"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Funil + Recepcionistas */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Funil e recepcionistas (mensal)</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Funil mensal e recepcionistas. Salvo junto com os dados semanais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Funil */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  Funil (valores do mês)
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                  {(
                    [
                      ["scheduled", "Agendadas"],
                      ["present", "Presentes"],
                      ["closings", "Fechamentos"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <Label htmlFor={`funnel-${key}`} className="text-xs font-medium text-slate-600">{label}</Label>
                      <Input
                        id={`funnel-${key}`}
                        type="text"
                        inputMode="numeric"
                        value={funnel[key].value}
                        onChange={(e) =>
                          setFunnel((prev) => ({
                            ...prev,
                            [key]: { value: e.target.value },
                          }))
                        }
                        className="h-10 bg-white border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recepcionistas mês */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Recepcionistas (mês)
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Nome · Leads · Vendas · Meta
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 mb-1">
                    {["Nome", "Leads", "Vendas", "Meta"].map((h, i) => (
                      <p key={h} className={`text-xs text-slate-400 font-medium ${i === 0 ? "col-span-2" : ""}`}>{h}</p>
                    ))}
                  </div>
                  {recepMonth.map((r) => (
                    <div key={r.id} className="grid grid-cols-5 gap-2">
                      <Input
                        value={r.name}
                        onChange={(e) =>
                          setRecepMonth((prev) =>
                            prev.map((row) =>
                              row.id === r.id ? { ...row, name: e.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Nome"
                        className="col-span-2 h-10 bg-white border-slate-200"
                      />
                      <Input
                        value={r.leads}
                        onChange={(e) =>
                          setRecepMonth((prev) =>
                            prev.map((row) =>
                              row.id === r.id ? { ...row, leads: e.target.value } : row,
                            ),
                          )
                        }
                        placeholder="0"
                        className="h-10 bg-white border-slate-200 text-center"
                      />
                      <Input
                        value={r.sales}
                        onChange={(e) =>
                          setRecepMonth((prev) =>
                            prev.map((row) =>
                              row.id === r.id ? { ...row, sales: e.target.value } : row,
                            ),
                          )
                        }
                        placeholder="0"
                        className="h-10 bg-white border-slate-200 text-center"
                      />
                      <Input
                        value={r.goal}
                        onChange={(e) =>
                          setRecepMonth((prev) =>
                            prev.map((row) =>
                              row.id === r.id ? { ...row, goal: e.target.value } : row,
                            ),
                          )
                        }
                        placeholder="38"
                        className="h-10 bg-white border-slate-200 text-center"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() =>
                      setRecepMonth((prev) => [
                        ...prev,
                        { id: newRowId(), name: "", leads: "", sales: "", goal: "38", badge: "" },
                      ])
                    }
                  >
                    + Linha
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() =>
                      setRecepMonth((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
                    }
                  >
                    − Remover última
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => void (async () => { await handleSaveKpis(); await handleSaveSm(); })()}
            disabled={kpiSaving || smSaving}
            className="h-10 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm"
          >
            {kpiSaving || smSaving ? "Salvando…" : "Salvar dados mensais"}
          </Button>
        </TabsContent>

        {/* ── Tab Semanal ── */}
        <TabsContent value="semanal" className="space-y-5">
          {mismatch.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
              <strong>Aviso (não bloqueia gravação):</strong>
              <ul className="mt-1.5 ml-4 list-disc">
                {mismatch.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade semanal</CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">S1–S4 = dom–sáb por semana.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5 min-w-36">
                        Métrica
                      </th>
                      {weekHeaders.map((h) => (
                        <th key={h} className="text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Alcance", "reach"],
                        ["Frequência", "frequency"],
                        ["Visualizações", "views"],
                        ["Novos seguidores", "followers"],
                      ] as const
                    ).map(([label, key]) => (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">{label}</td>
                        {weeklyStr[key].map((cell, wi) => (
                          <td key={`${key}-${weekHeaders[wi] ?? wi}`} className="border border-slate-200 px-1.5 py-1.5">
                            <Input value={cell} onChange={(e) => updateMatrix(key, wi, e.target.value)} className="w-20 h-8 text-right text-sm bg-white border-slate-200" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={nWeeks + 1} className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2">
                        Funil semanal
                      </td>
                    </tr>
                    {(
                      [
                        ["Agendadas", "sch"],
                        ["Presenças", "att"],
                        ["Fechamentos", "clo"],
                      ] as const
                    ).map(([label, key]) => (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">{label}</td>
                        {weeklyStr[key].map((cell, wi) => (
                          <td key={`${key}-${weekHeaders[wi] ?? wi}`} className="border border-slate-200 px-1.5 py-1.5">
                            <Input value={cell} onChange={(e) => updateMatrix(key as keyof WeeklyStrings, wi, e.target.value)} className="w-20 h-8 text-right text-sm bg-white border-slate-200" />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={nWeeks + 1} className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2">
                        Vendas — por recepcionista
                      </td>
                    </tr>
                    {recepWeekRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-200 px-1.5 py-1.5 bg-slate-50/70">
                          <Input
                            value={row.name}
                            onChange={(e) => setRecepWeekRows((prev) => prev.map((rw) => rw.id === row.id ? { ...rw, name: e.target.value } : rw))}
                            placeholder="Nome"
                            className="h-8 text-sm w-32 bg-white border-slate-200"
                          />
                        </td>
                        {row.weeks.map((cell, wi) => (
                          <td key={`${row.id}-w${wi}`} className="border border-slate-200 px-1.5 py-1.5">
                            <Input
                              value={cell}
                              onChange={(e) => setRecepWeekRows((prev) => prev.map((rw) => { if (rw.id !== row.id) return rw; const wk = [...rw.weeks]; wk[wi] = e.target.value; return { ...rw, weeks: wk }; }))}
                              className="w-20 h-8 text-right text-sm bg-white border-slate-200"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={nWeeks + 1} className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2">
                        Vendas (todos canais)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">Total</td>
                      {weeklyStr.salesTot.map((cell, wi) => (
                        <td key={`salesTot-${weekHeaders[wi] ?? wi}`} className="border border-slate-200 px-1.5 py-1.5">
                          <Input value={cell} onChange={(e) => updateMatrix("salesTot", wi, e.target.value)} className="w-20 h-8 text-right text-sm bg-white border-slate-200" />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setRecepWeekRows((prev) => [...prev, { id: newRowId(), name: "", weeks: Array.from({ length: nWeeks }, () => "") }])}>
                  + Recepcionista
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setRecepWeekRows((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))}>
                  − Remover última
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50" onClick={copyRecepNames}>
                  Copiar nomes da tabela mensal
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => void handleSaveSm()}
            disabled={smSaving}
            className="h-10 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm"
          >
            {smSaving ? "Salvando…" : "Salvar payload vendas/marketing"}
          </Button>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
