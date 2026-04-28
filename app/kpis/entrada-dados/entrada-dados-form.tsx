"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KPI_FORM_GROUPS,
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
import { Lock, LockOpen, Upload } from "lucide-react";

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

function slugifyExpenseCode(label: string): string {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `expense_${normalized}`;
}

function titleFromExpenseCode(code: string): string {
  const raw = code.replace(/^expense_/, "").replace(/_/g, " ").trim();
  if (!raw) return code;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function mapRevenueGroupsToCodes(groups: Record<string, number>): Record<string, number> {
  let matriculated = 0;
  let wellhub = 0;
  let totalpass = 0;
  let products = 0;

  for (const [name, value] of Object.entries(groups)) {
    const lower = name.toLowerCase();
    if (lower.startsWith("matriculado")) {
      matriculated += value;
      continue;
    }
    if (lower.includes("wellhub")) {
      wellhub += value;
      continue;
    }
    if (lower.includes("totalpass")) {
      totalpass += value;
      continue;
    }
    products += value;
  }

  return {
    matriculated_revenue: matriculated,
    wellhub_revenue: wellhub,
    totalpass_revenue: totalpass,
    products_revenue: products,
  };
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
  const [uploadingFile, setUploadingFile] = useState({
    crescimento: false,
    recebimentos: false,
    custos: false,
  });
  const [crescimentoLocked, setCrescimentoLocked] = useState(false);
  const [recebimentosLocked, setRecebimentosLocked] = useState(() => {
    const raw = initialMetaByCode["revenue_total"]?.breakdown;
    return !!raw && typeof raw === "object" && !Array.isArray(raw);
  });

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

  const metaJson = useMemo(
    () =>
      Object.keys(initialMetaByCode).length
        ? JSON.stringify(initialMetaByCode, null, 2)
        : "",
    [initialMetaByCode],
  );
  const [recebimentosBreakdown, setRecebimentosBreakdown] = useState<Record<string, number>>(() => {
    const raw = initialMetaByCode["revenue_total"]?.breakdown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, typeof v === "number" ? v : 0]),
    );
  });
  const [custosBreakdown, setCustosBreakdown] = useState<Record<string, number>>(() => {
    return Object.fromEntries(
      Object.entries(initialKpiValues)
        .filter(([code]) => code.startsWith("expense_"))
        .map(([code, value]) => [code, value]),
    );
  });
  const [custosLocked, setCustosLocked] = useState(() =>
    Object.keys(initialKpiValues).some((code) => code.startsWith("expense_")),
  );

  const [smPayload] = useState<SalesMarketingDashboardPayload>(() =>
    structuredClone(initialSmPayload),
  );
  const [funnel, setFunnel] = useState(() => funnelToState(initialSmPayload));
  const [comp] = useState(() => compFromPayload(initialSmPayload));
  const [recepMonth, setRecepMonth] = useState(() => recepMonthFromPayload(initialSmPayload));
  const [recLabel] = useState(
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

  const mappedRevenueCodes = useMemo(
    () => mapRevenueGroupsToCodes(recebimentosBreakdown),
    [recebimentosBreakdown],
  );
  const expenseEntries = useMemo(
    () =>
      Object.entries(custosBreakdown)
        .map(([code, value]) => ({ code, label: titleFromExpenseCode(code), value }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    [custosBreakdown],
  );

  const handleUploadCrescimento = async (file: File) => {
    setMessage(null);
    setUploadingFile((prev) => ({ ...prev, crescimento: true }));
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/parse/crescimento", { method: "POST", body: data });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Falha ao processar crescimento.");
      }
      const updates: Record<string, string> = {
        base_students_end: String(Number(json.base_students_end ?? 0)),
        sales_total: String(Number(json.sales_total ?? 0)),
        monthly_cancellations: String(Number(json.monthly_cancellations ?? 0)),
        monthly_non_renewed: String(Number(json.monthly_non_renewed ?? 0)),
      };
      setKpiInputs((prev) => ({ ...prev, ...updates }));
      setCrescimentoLocked(true);
      setMessage({ type: "ok", text: "Arquivo de crescimento processado." });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Erro ao processar arquivo de crescimento.";
      setMessage({ type: "err", text });
    } finally {
      setUploadingFile((prev) => ({ ...prev, crescimento: false }));
    }
  };

  const handleUploadRecebimentos = async (file: File) => {
    setMessage(null);
    setUploadingFile((prev) => ({ ...prev, recebimentos: true }));
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/parse/recebimentos", { method: "POST", body: data });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Falha ao processar recebimentos.");
      }
      const groups =
        json.groups && typeof json.groups === "object" && !Array.isArray(json.groups)
          ? (json.groups as Record<string, number>)
          : {};
      setRecebimentosBreakdown(groups);
      const mapped = mapRevenueGroupsToCodes(groups);
      setKpiInputs((prev) => ({
        ...prev,
        matriculated_revenue: String(mapped.matriculated_revenue),
        wellhub_revenue: String(mapped.wellhub_revenue),
        totalpass_revenue: String(mapped.totalpass_revenue),
        products_revenue: String(mapped.products_revenue),
      }));
      setRecebimentosLocked(true);
      setMessage({ type: "ok", text: "Arquivo de recebimentos processado." });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Erro ao processar arquivo de recebimentos.";
      setMessage({ type: "err", text });
    } finally {
      setUploadingFile((prev) => ({ ...prev, recebimentos: false }));
    }
  };

  const handleUploadCustos = async (file: File) => {
    setMessage(null);
    setUploadingFile((prev) => ({ ...prev, custos: true }));
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/parse/custos", { method: "POST", body: data });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Falha ao processar custos.");
      }
      const items =
        json.items && typeof json.items === "object" && !Array.isArray(json.items)
          ? (json.items as Record<string, number>)
          : {};
      const parsed = Object.fromEntries(
        Object.entries(items).map(([label, value]) => [slugifyExpenseCode(label), Number(value ?? 0)]),
      );
      setCustosBreakdown(parsed);
      setCustosLocked(true);
      setMessage({ type: "ok", text: "Arquivo de custos processado." });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Erro ao processar arquivo de custos.";
      setMessage({ type: "err", text });
    } finally {
      setUploadingFile((prev) => ({ ...prev, custos: false }));
    }
  };

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
      const expenseItems = structuredClone(custosBreakdown);
      const expensesTotal =
        Object.keys(expenseItems).length > 0
          ? Object.values(expenseItems).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)
          : (values["expenses_total"] ?? 0);
      values["expenses_total"] = expensesTotal;

      // revenue_total = sum of the four revenue streams (calculated, not entered)
      const revenueFromGroups = mapRevenueGroupsToCodes(recebimentosBreakdown);
      if (Object.keys(recebimentosBreakdown).length > 0) {
        values["matriculated_revenue"] = revenueFromGroups.matriculated_revenue;
        values["wellhub_revenue"] = revenueFromGroups.wellhub_revenue;
        values["totalpass_revenue"] = revenueFromGroups.totalpass_revenue;
        values["products_revenue"] = revenueFromGroups.products_revenue;
      }
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
      metaByCode = metaByCode ?? {};
      if (Object.keys(recebimentosBreakdown).length > 0) {
        metaByCode["revenue_total"] = { breakdown: recebimentosBreakdown };
      }
      const res = await saveMonthlyKpisAction({
        gymSlug: initialGymSlug,
        periodId: initialPeriodId,
        values,
        expenseItems: Object.keys(expenseItems).length > 0 ? expenseItems : undefined,
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

  const isGroupLocked = (groupId: string): boolean => {
    if (groupId === "overview" || groupId === "retention") return crescimentoLocked;
    if (groupId === "finance_revenues") return recebimentosLocked;
    return false;
  };

  const FileUploadArea = ({
    label,
    onFile,
    loading,
  }: {
    label: string;
    onFile: (file: File) => void;
    loading: boolean;
  }) => (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span>{label}</span>
      <span className="inline-flex items-center gap-2">
        <Upload className="h-3.5 w-3.5" />
        {loading ? "Processando..." : "Importar .xlsx"}
      </span>
      <input
        type="file"
        accept=".xlsx"
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );

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
          <Card className="shadow-sm border-slate-200">
            <CardContent className="pt-5">
              <FileUploadArea
                label="Importe o arquivo de crescimento para preencher Visão geral + Retenção."
                onFile={(file) => void handleUploadCrescimento(file)}
                loading={uploadingFile.crescimento}
              />
            </CardContent>
          </Card>

          {KPI_FORM_GROUPS.map((group) => (
            <Card key={group.id} className="shadow-sm border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{group.title}</CardTitle>
                    {group.description ? (
                      <CardDescription className="text-xs text-slate-400 mt-0.5">{group.description}</CardDescription>
                    ) : null}
                  </div>
                  {(group.id === "overview" || group.id === "retention" || group.id === "finance_revenues") ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-slate-200"
                      onClick={() => {
                        if (group.id === "finance_revenues") {
                          setRecebimentosLocked((prev) => !prev);
                        } else {
                          setCrescimentoLocked((prev) => !prev);
                        }
                      }}
                      title="Bloquear/desbloquear edição manual"
                    >
                      {isGroupLocked(group.id) ? (
                        <Lock className="h-4 w-4 text-slate-500" />
                      ) : (
                        <LockOpen className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {group.id === "finance_revenues" ? (
                  <div className="mb-4 space-y-3">
                    <FileUploadArea
                      label="Importe o arquivo de recebimentos para preencher receitas."
                      onFile={(file) => void handleUploadRecebimentos(file)}
                      loading={uploadingFile.recebimentos}
                    />
                    {Object.keys(recebimentosBreakdown).length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Mapeamento automático: Matriculado / Wellhub / Totalpass / Produtos.
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
                          disabled={isGroupLocked(group.id)}
                          onFocus={() => setFocusedInput(k)}
                          onBlur={() => setFocusedInput(null)}
                          onChange={(e) =>
                            setKpiInputs((prev) => ({ ...prev, [k]: e.target.value }))
                          }
                          className="h-10 bg-white border-slate-200 focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                          placeholder={
                            f.unit === "currency" ? "R$ 0" : f.unit === "percent" ? "ex: 77" : ""
                          }
                        />
                      </div>
                    );
                  })}
                  {group.id === "finance_revenues" && (() => {
                    const total =
                      (parsePtBrNumber(kpiInputs["matriculated_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["wellhub_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["totalpass_revenue"] ?? "") ?? 0) +
                      (parsePtBrNumber(kpiInputs["products_revenue"] ?? "") ?? 0);
                    return (
                      <>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-medium text-slate-600">Receita total</Label>
                          <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 select-none">
                            {total > 0 ? formatCurrency(String(total)) : "—"}
                          </div>
                        </div>
                        {Object.keys(recebimentosBreakdown).length > 0 ? (
                          <div className="col-span-full rounded-md border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Centros de receita importados</p>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                              {Object.entries(recebimentosBreakdown)
                                .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                                .map(([name, value]) => (
                                  <div key={name} className="flex flex-col gap-1">
                                    <Label className="text-xs font-medium text-slate-600">{name}</Label>
                                    <Input disabled value={formatCurrency(String(value))} className="h-9 bg-slate-50 border-slate-200 text-slate-500" />
                                  </div>
                                ))}
                            </div>
                            <div className="mt-3 text-xs text-slate-500">
                              Mapeado para: Matriculados {formatCurrency(String(mappedRevenueCodes.matriculated_revenue))} · Wellhub {formatCurrency(String(mappedRevenueCodes.wellhub_revenue))} · Totalpass {formatCurrency(String(mappedRevenueCodes.totalpass_revenue))} · Produtos {formatCurrency(String(mappedRevenueCodes.products_revenue))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Financeiro — Despesas</CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-0.5">Despesas totais calculadas automaticamente.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-slate-200"
                  onClick={() => setCustosLocked((prev) => !prev)}
                  title="Bloquear/desbloquear edição manual"
                >
                  {custosLocked ? (
                    <Lock className="h-4 w-4 text-slate-500" />
                  ) : (
                    <LockOpen className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <FileUploadArea
                label="Importe o arquivo de custos para preencher despesas detalhadas."
                onFile={(file) => void handleUploadCustos(file)}
                loading={uploadingFile.custos}
              />
              {expenseEntries.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
                  {expenseEntries.map((item) => (
                    <div key={item.code} className="flex flex-col gap-2">
                      <Label className="text-xs font-medium text-slate-600">{item.label}</Label>
                      <Input
                        disabled={custosLocked}
                        value={custosLocked ? formatCurrency(String(item.value)) : String(item.value)}
                        onChange={(e) => {
                          const parsed = parsePtBrNumber(e.target.value) ?? 0;
                          setCustosBreakdown((prev) => ({ ...prev, [item.code]: parsed }));
                        }}
                        className="h-10 bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-medium text-slate-600">Despesas totais</Label>
                    <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 select-none">
                      {formatCurrency(
                        String(expenseEntries.reduce((acc, item) => acc + item.value, 0)),
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Importe o arquivo de custos para carregar as despesas granulares.</p>
              )}
            </CardContent>
          </Card>

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
