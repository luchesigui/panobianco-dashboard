import type { ReactNode } from "react";
import { getKpiPageData, type KpiPageData } from "@/lib/data/kpis";
import { FinanceDeepDive } from "./FinanceDeepDive";
import { RetentionDeepDive } from "./RetentionDeepDive";
import { RoiDeepDive } from "./RoiDeepDive";
import { SalesMarketingDeepDive } from "./SalesMarketingDeepDive";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type KpiCard = { key: string; label: string; unit?: "currency" | "percent" | "count" };

type SectionTheme = {
  themeSection: string;
  iconShort: string;
  iconVariant: string;
  badgeVariant: string;
  insightHeader: string;
};

const sections: Array<{
  id: string;
  title: string;
  theme: SectionTheme;
  cards: KpiCard[];
}> = [
  {
    id: "overview",
    title: "Visão geral",
    theme: {
      themeSection: styles.themeSectionOverview,
      iconShort: "VG",
      iconVariant: styles.themeIconAccent,
      badgeVariant: styles.badgeOverview,
      insightHeader: styles.headerOverview,
    },
    cards: [
      { key: "base_students_end", label: "Base de alunos" },
      { key: "sales_total", label: "Vendas no mês" },
      { key: "revenue_total", label: "Receita total", unit: "currency" },
      { key: "operational_result", label: "Resultado operacional", unit: "currency" },
    ],
  },
  {
    id: "sales_marketing",
    title: "Vendas e marketing",
    theme: {
      themeSection: styles.themeSectionVendas,
      iconShort: "VM",
      iconVariant: styles.themeIconBlue,
      badgeVariant: styles.badgeVendas,
      insightHeader: styles.headerVendas,
    },
    cards: [
      { key: "sales_total", label: "Vendas totais" },
      { key: "no_show_rate", label: "No-show experimental", unit: "percent" },
      { key: "present_conversion_rate", label: "Conversão presentes", unit: "percent" },
      { key: "leads_generated", label: "Leads gerados" },
      { key: "avg_ticket", label: "Ticket médio", unit: "currency" },
      { key: "cac_per_sale", label: "CAC por venda", unit: "currency" },
      { key: "meta_ads_investment", label: "Investimento Meta Ads", unit: "currency" },
      { key: "instagram_total_reach", label: "Alcance total" },
    ],
  },
  {
    id: "retention",
    title: "Retenção",
    theme: {
      themeSection: styles.themeSectionRetencao,
      iconShort: "R",
      iconVariant: styles.themeIconCoral,
      badgeVariant: styles.badgeRetencao,
      insightHeader: styles.headerRetencao,
    },
    cards: [],
  },
  {
    id: "finance",
    title: "Financeiro",
    theme: {
      themeSection: styles.themeSectionFinanceiro,
      iconShort: "F",
      iconVariant: styles.themeIconPurple,
      badgeVariant: styles.badgeFinanceiro,
      insightHeader: styles.headerFinanceiro,
    },
    cards: [],
  },
  {
    id: "roi",
    title: "Retorno do investimento",
    theme: {
      themeSection: styles.themeSectionRoi,
      iconShort: "RI",
      iconVariant: styles.themeIconRoiBrown,
      badgeVariant: styles.badgeRoi,
      insightHeader: styles.headerRoi,
    },
    cards: [],
  },
];

/** Bottom accent bar colors (reference KPI cards) */
const KPI_BAR: Record<string, string> = {
  base_students_end: "#0f6e56",
  sales_total: "#d85a30",
  revenue_total: "#0f6e56",
  operational_result: "#0f6e56",
  leads_generated: "#185fa5",
  experimental_scheduled: "#534ab7",
  experimental_attendance: "#d85a30",
  experimental_closings: "#0f6e56",
  no_show_rate: "#a32d2d",
  present_conversion_rate: "#0f6e56",
  open_default_count: "#a32d2d",
  open_default_value: "#a32d2d",
  recovered_default_count: "#0f6e56",
  recovered_default_value: "#0f6e56",
  expenses_total: "#854f0b",
  matriculated_revenue: "#378add",
  wellhub_revenue: "#0f6e56",
  totalpass_revenue: "#ef9f27",
  products_revenue: "#d85a30",
  total_invested: "#854f0b",
  cash_balance: "#0f6e56",
  recovery_balance: "#8b4513",
  roi_payback_months: "#378add",
  avg_ticket: "#d85a30",
  cac_per_sale: "#534ab7",
  meta_ads_investment: "#534ab7",
  instagram_total_reach: "#534ab7",
  invoice_tax_nf: "#a32d2d",
  operational_result_100pct_nf: "#8b6914",
  accumulated_operational_no_contributions: "#a32d2d",
  accumulated_with_contributions: "#0f6e56",
  royalties_validation: "#a32d2d",
};

const SALES_VM_BAR: Record<string, string> = {
  sales_total: "#185fa5",
  no_show_rate: "#a32d2d",
  present_conversion_rate: "#0f6e56",
  leads_generated: "#185fa5",
  avg_ticket: "#d85a30",
  cac_per_sale: "#534ab7",
  meta_ads_investment: "#534ab7",
  instagram_total_reach: "#534ab7",
};

function salesMarketingBarColor(cardKey: string): string {
  return SALES_VM_BAR[cardKey] ?? "#6b6a65";
}

function barColor(key: string): string {
  return KPI_BAR[key] ?? "#6b6a65";
}

function formatCompactBrl(value: number): string {
  const k = Math.round(value / 1000);
  return `R$ ${k}k`;
}

function formatCompactBrlOneDecimal(value: number): string {
  const k = value / 1000;
  return `R$ ${k.toFixed(1).replace(".", ",")}k`;
}

function formatCurrencySignedK(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const k = Math.round(Math.abs(value) / 1000);
  return `${sign}R$ ${k}k`;
}

function formatValue(value?: number, unit?: KpiCard["unit"]): string {
  if (value == null) return "N/A";
  if (unit === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "percent") return `${value.toFixed(0)}%`;
  return new Intl.NumberFormat("pt-BR").format(value);
}

type KpiMeta = Record<string, unknown>;

function overviewMainValue(
  card: KpiCard,
  current: number | undefined,
  meta: KpiMeta | undefined,
): string {
  if (current == null) return "N/A";
  if (card.key === "base_students_end") {
    const star = meta?.partial === true ? "*" : "";
    return `${new Intl.NumberFormat("pt-BR").format(current)}${star}`;
  }
  if (card.key === "revenue_total" && meta?.compact_currency === true) {
    return formatCompactBrl(current);
  }
  if (card.key === "operational_result") {
    return formatCurrencySignedK(current);
  }
  return formatValue(current, card.unit);
}

function overviewMetaLine(cardKey: string, meta: KpiMeta | undefined): string | null {
  if (!meta) return null;
  if (cardKey === "base_students_end") {
    const goal = meta.goal;
    const pending =
      typeof meta.pending_note_overview === "string"
        ? meta.pending_note_overview
        : meta.pending_note;
    if (typeof goal === "number" && typeof pending === "string") {
      return `*${pending} · meta: ${goal}`;
    }
  }
  if (cardKey === "sales_total") {
    const g = meta.goal;
    if (typeof g === "number") return `meta: ${g}`;
  }
  if (cardKey === "operational_result") {
    const m = meta.margin_percent;
    const rec = meta.record === true;
    if (typeof m === "number") {
      const parts = [`margem ${m.toFixed(1).replace(".", ",")}%`];
      if (rec) parts.push("novo recorde");
      return parts.join(" · ");
    }
  }
  return null;
}

function overviewBarColor(
  cardKey: string,
  current: number | undefined,
  previous: number | undefined,
): string {
  if (cardKey === "sales_total") {
    if (current == null || previous == null || previous === 0) {
      return KPI_BAR.sales_total;
    }
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    if (pct < 0) return "#a32d2d";
  }
  return barColor(cardKey);
}

type DeltaParts = {
  pill: string | null;
  tail: string;
  pillClass: string;
};

type DeltaOptions = {
  deltaPctDisplay?: number;
  invertColors?: boolean;
  /** Reference-style whole % (+9% vs +8,9%). */
  pctAsInteger?: boolean;
};

function formatDeltaPill(pct: number, asInteger: boolean): string {
  if (asInteger) {
    const r = Math.round(pct);
    return `${r > 0 ? "+" : ""}${r}%`;
  }
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function renderDelta(
  current?: number,
  previous?: number,
  vsLabel?: string,
  options?: DeltaOptions,
): DeltaParts {
  const up = options?.invertColors ? styles.deltaDown : styles.deltaUp;
  const down = options?.invertColors ? styles.deltaUp : styles.deltaDown;
  const intPct = options?.pctAsInteger === true;
  if (options?.deltaPctDisplay != null) {
    const pct = options.deltaPctDisplay;
    const pill = formatDeltaPill(pct, intPct);
    const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
    if (pct > 0) return { pill, tail, pillClass: up };
    if (pct < 0) return { pill, tail, pillClass: down };
    return { pill: "0%", tail, pillClass: styles.deltaNeutral };
  }
  if (current == null || previous == null || previous === 0) {
    return {
      pill: null,
      tail: "Sem comparativo",
      pillClass: styles.deltaNeutral,
    };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const pill = formatDeltaPill(pct, intPct);
  const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
  if (pct > 0) return { pill, tail, pillClass: up };
  if (pct < 0) return { pill, tail, pillClass: down };
  return { pill: "0%", tail, pillClass: styles.deltaNeutral };
}

function salesMarketingMetaLines(cardKey: string, meta: KpiMeta): string[] {
  const lines: string[] = [];
  if (
    cardKey === "sales_total" &&
    typeof meta.goal === "number" &&
    typeof meta.goal_pct === "number"
  ) {
    lines.push(`Meta ${meta.goal} (${meta.goal_pct}%)`);
  }
  if (
    ["no_show_rate", "present_conversion_rate", "cac_per_sale", "meta_ads_investment"].includes(
      cardKey,
    ) &&
    typeof meta.detail_line === "string"
  ) {
    lines.push(meta.detail_line);
  }
  if (cardKey === "avg_ticket") {
    if (typeof meta.meta_line === "string") lines.push(meta.meta_line);
    if (typeof meta.breakdown_line === "string") lines.push(meta.breakdown_line);
  }
  if (cardKey === "instagram_total_reach" && typeof meta.detail_line === "string") {
    lines.push(meta.detail_line);
  }
  return lines;
}

function insightIconClass(type: string): string {
  const t = type.toLowerCase();
  if (t === "good" || t === "positive" || t === "success") return styles.insightIconGood;
  if (t === "bad" || t === "negative" || t === "danger") return styles.insightIconBad;
  if (t === "warn" || t === "warning") return styles.insightIconWarn;
  if (t === "neutral") return styles.insightIconNeutral;
  return styles.insightIconInfo;
}

function insightGlyph(type: string): string {
  const t = type.toLowerCase();
  if (t === "good" || t === "positive" || t === "success") return "▲";
  if (t === "bad" || t === "negative" || t === "danger") return "▼";
  if (t === "warn" || t === "warning" || t === "neutral") return "●";
  return "i";
}

const INSIGHT_HEADER_LABEL: Record<string, string> = {
  overview: "Destaques do mês",
  sales_marketing: "Análise de vendas e marketing",
  retention: "Análise de retenção",
  finance: "ANÁLISE FINANCEIRA",
};

function InsightHeaderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <title>Informação</title>
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V4zM8 12a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

function highlight50PercentInBody(body: string) {
  const idx = body.indexOf("50%");
  if (idx === -1) return body;
  return (
    <>
      {body.slice(0, idx)}
      <span className={styles.insightGoodMark}>50%</span>
      {body.slice(idx + 3)}
    </>
  );
}

function highlightPayback19Meses(body: string): ReactNode {
  const marker = "~19 meses";
  const i = body.indexOf(marker);
  if (i !== -1) {
    return (
      <>
        {body.slice(0, i)}
        <span className={styles.insightGoodMark}>{marker}</span>
        {body.slice(i + marker.length)}
      </>
    );
  }
  return body;
}

const FINANCE_CARDS: KpiCard[] = [
  { key: "revenue_total", label: "Receita total", unit: "currency" },
  { key: "expenses_total", label: "Despesa total", unit: "currency" },
  { key: "operational_result", label: "Resultado operacional", unit: "currency" },
  { key: "invoice_tax_nf", label: "Imposto NF emitido", unit: "currency" },
  { key: "operational_result_100pct_nf", label: "Resultado se 100% NF", unit: "currency" },
  {
    key: "accumulated_operational_no_contributions",
    label: "Acumulado sem aportes",
    unit: "currency",
  },
  { key: "accumulated_with_contributions", label: "Acumulado com aportes", unit: "currency" },
  { key: "matriculated_revenue", label: "Receita matriculados", unit: "currency" },
  { key: "wellhub_revenue", label: "Receita Wellhub", unit: "currency" },
  { key: "royalties_validation", label: "Royalties (validação)", unit: "currency" },
];

function financeMainDisplay(
  cardKey: string,
  current: number | undefined,
  meta: KpiMeta | undefined,
): string {
  const m = meta ?? {};
  if (current == null) return "N/A";
  if (cardKey === "revenue_total") {
    return formatCompactBrl(current);
  }
  if (cardKey === "expenses_total" || cardKey === "matriculated_revenue" || cardKey === "wellhub_revenue") {
    return formatCompactBrl(current);
  }
  if (
    cardKey === "operational_result" ||
    cardKey === "operational_result_100pct_nf" ||
    cardKey === "accumulated_operational_no_contributions"
  ) {
    return formatCurrencySignedK(current);
  }
  if (cardKey === "accumulated_with_contributions") {
    if (m.compact_currency === true) {
      const k = Math.round(Math.abs(current) / 1000);
      const sign = current >= 0 ? "+" : "-";
      return `${sign}R$ ${k}k`;
    }
    return formatCurrencySignedK(current);
  }
  if (cardKey === "invoice_tax_nf") {
    if (m.approximate_main === true || Math.abs(current) < 500) return "~R$ 0";
    return formatValue(current, "currency");
  }
  if (cardKey === "royalties_validation") {
    return formatCompactBrlOneDecimal(current);
  }
  return formatValue(current, "currency");
}

function FinanceKpiCards({ data }: { data: KpiPageData }) {
  const vsLabel = data.previousPeriodLabel;
  const revenueTotal = data.current.revenue_total;

  const renderCard = (card: KpiCard) => {
    const current = data.current[card.key];
    const previous = data.previous[card.key];
    const meta = data.currentMeta[card.key];
    const m = meta ?? {};
    const metaLines: ReactNode[] = [];
    let deltaBlock: ReactNode = null;
    let afterDelta: ReactNode = null;
    const key = card.key;

    if (key === "revenue_total") {
      const deltaOpts =
        typeof m.delta_pct_display === "number"
          ? { deltaPctDisplay: m.delta_pct_display as number, pctAsInteger: true }
          : { pctAsInteger: true };
      const delta = renderDelta(current, previous, vsLabel, deltaOpts);
      deltaBlock = (
        <div className={styles.kpiSub}>
          {delta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.pill}</span>
              {delta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.tail}</span>
          )}
        </div>
      );
    } else if (key === "expenses_total") {
      const delta = renderDelta(current, previous, vsLabel, {
        invertColors: true,
        pctAsInteger: true,
      });
      deltaBlock = (
        <div className={styles.kpiSub}>
          {delta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.pill}</span>
              {delta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.tail}</span>
          )}
          {typeof m.delta_abs_line === "string" ? (
            <span className={styles.kpiMetaMuted}> {m.delta_abs_line}</span>
          ) : null}
        </div>
      );
    } else if (key === "operational_result") {
      const mPct = meta?.margin_percent;
      if (typeof mPct === "number") {
        metaLines.push(
          <p key="opm" className={styles.kpiMetaLine}>
            margem {mPct.toFixed(1).replace(".", ",")}%
          </p>,
        );
      }
      const deltaOpts =
        typeof m.delta_pct_display === "number"
          ? { deltaPctDisplay: m.delta_pct_display as number, pctAsInteger: true }
          : { pctAsInteger: true };
      const delta = renderDelta(current, previous, vsLabel, deltaOpts);
      deltaBlock = (
        <div className={styles.kpiSub}>
          {delta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.pill}</span>
              {delta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.tail}</span>
          )}
        </div>
      );
    } else if (key === "invoice_tax_nf") {
      if (typeof m.pct_revenue_line === "string") {
        metaLines.push(
          <p key="p1" className={styles.kpiMetaLine}>
            {m.pct_revenue_line}
          </p>,
        );
      }
      if (typeof m.ref_line === "string") {
        metaLines.push(
          <p key="p2" className={styles.kpiMetaDanger}>
            {m.ref_line}
          </p>,
        );
      }
      if (typeof m.footnote === "string") {
        metaLines.push(
          <p key="p3" className={styles.kpiDetailLine}>
            {m.footnote}
          </p>,
        );
      }
    } else if (key === "operational_result_100pct_nf") {
      if (typeof m.margin_line === "string") {
        metaLines.push(
          <p key="m1" className={styles.kpiMetaLine}>
            {m.margin_line}
          </p>,
        );
      }
      if (typeof m.tax_theory_line === "string") {
        metaLines.push(
          <p key="m2" className={styles.kpiDetailLine}>
            {m.tax_theory_line}
          </p>,
        );
      }
    } else if (key === "accumulated_operational_no_contributions") {
      if (typeof m.subline === "string") {
        metaLines.push(
          <p key="s1" className={styles.kpiMetaLine}>
            {m.subline}
          </p>,
        );
      }
      if (typeof m.delta_vs_prev_pill === "string") {
        deltaBlock = (
          <div className={styles.kpiSub}>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>{m.delta_vs_prev_pill}</span>
          </div>
        );
      }
      if (typeof m.footnote === "string") {
        afterDelta = (
          <p key="s2" className={styles.kpiDetailLine}>
            {m.footnote}
          </p>
        );
      }
    } else if (key === "accumulated_with_contributions") {
      if (typeof m.subline === "string") {
        metaLines.push(
          <p key="a1" className={styles.kpiMetaLine}>
            {m.subline}
          </p>,
        );
      }
      if (typeof m.delta_vs_prev_pill === "string") {
        deltaBlock = (
          <div className={styles.kpiSub}>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>{m.delta_vs_prev_pill}</span>
          </div>
        );
      }
      if (typeof m.aportes_line === "string") {
        afterDelta = (
          <p key="a2" className={styles.kpiDetailLine}>
            {m.aportes_line}
          </p>
        );
      }
    } else if (key === "matriculated_revenue") {
      if (revenueTotal != null && revenueTotal > 0 && current != null) {
        const pct = ((current / revenueTotal) * 100).toFixed(1).replace(".", ",");
        metaLines.push(
          <p key="mat1" className={styles.kpiMetaLine}>
            {pct}% do total
          </p>,
        );
      }
      const deltaOpts =
        typeof m.delta_pct_display === "number"
          ? { deltaPctDisplay: m.delta_pct_display as number, pctAsInteger: true }
          : { pctAsInteger: true };
      const delta = renderDelta(current, previous, vsLabel, deltaOpts);
      deltaBlock = (
        <div className={styles.kpiSub}>
          {delta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.pill}</span>
              {delta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.tail}</span>
          )}
        </div>
      );
      if (
        typeof m.recorrente === "number" &&
        typeof m.anual === "number" &&
        typeof m.mensal === "number"
      ) {
        afterDelta = (
          <p key="mat2" className={styles.kpiDetailLine}>
            Recorrente {formatCompactBrlOneDecimal(m.recorrente)} · Anual{" "}
            {formatCompactBrlOneDecimal(m.anual)} · Mensal{" "}
            {formatCompactBrlOneDecimal(m.mensal)}
          </p>
        );
      }
    } else if (key === "wellhub_revenue") {
      if (revenueTotal != null && revenueTotal > 0 && current != null) {
        const pct = ((current / revenueTotal) * 100).toFixed(1).replace(".", ",");
        metaLines.push(
          <p key="wh1" className={styles.kpiMetaLine}>
            {pct}% do total
          </p>,
        );
      }
      const deltaOpts =
        typeof m.delta_pct_display === "number"
          ? { deltaPctDisplay: m.delta_pct_display as number, pctAsInteger: true }
          : { pctAsInteger: true };
      const delta = renderDelta(current, previous, vsLabel, deltaOpts);
      deltaBlock = (
        <div className={styles.kpiSub}>
          {delta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.pill}</span>
              {delta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>{delta.tail}</span>
          )}
        </div>
      );
    } else if (key === "royalties_validation") {
      if (typeof m.pct_line === "string") {
        metaLines.push(
          <p key="r1" className={styles.kpiMetaLine}>
            {m.pct_line}
          </p>,
        );
      }
      if (typeof m.shortfall_pill === "string") {
        deltaBlock = (
          <div className={styles.kpiSub}>
            <span className={`${styles.kpiDelta} ${styles.deltaDown}`}>{m.shortfall_pill}</span>
          </div>
        );
      }
    }

    return (
      <article key={card.key} className={styles.kpiCard}>
        <span className={styles.kpiLabel}>{card.label}</span>
        <p className={styles.kpiValue}>{financeMainDisplay(card.key, current, meta)}</p>
        {metaLines}
        {deltaBlock}
        {afterDelta}
        <div className={styles.kpiBar} style={{ background: barColor(card.key) }} />
      </article>
    );
  };

  return <div className={styles.kpiGrid}>{FINANCE_CARDS.map(renderCard)}</div>;
}

function RoiKpiCards({ data }: { data: KpiPageData }) {
  const ti = (data.currentMeta.total_invested ?? {}) as Record<string, unknown>;
  const cashM = (data.currentMeta.cash_balance ?? {}) as Record<string, unknown>;
  const recM = (data.currentMeta.recovery_balance ?? {}) as Record<string, unknown>;
  const payM = (data.currentMeta.roi_payback_months ?? {}) as Record<string, unknown>;

  const total = data.current.total_invested;
  const cashV = data.current.cash_balance;
  const recV = data.current.recovery_balance;
  const payMos = data.current.roi_payback_months;

  const cardTitle = (m: Record<string, unknown>, fallback: string) =>
    typeof m.card_title === "string" ? m.card_title : fallback;

  return (
    <>
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>
          {cardTitle(ti, "Total investido (Bruno+Guilherme)")}
        </span>
        <p className={styles.kpiValue}>
          {total != null ? formatCompactBrl(total) : "N/A"}
        </p>
        {typeof ti.subline === "string" ? (
          <p className={styles.kpiMetaLine}>{ti.subline}</p>
        ) : null}
        {typeof ti.detail_line === "string" ? (
          <p className={styles.kpiDetailLine}>{ti.detail_line}</p>
        ) : null}
        <div className={styles.kpiBar} style={{ background: barColor("total_invested") }} />
      </article>

      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>
          {cardTitle(cashM, "Saldo em caixa (fluxo real)")}
        </span>
        <p className={styles.kpiValue}>
          {cashV != null ? formatCompactBrl(cashV) : "N/A"}
        </p>
        {typeof cashM.subline === "string" ? (
          <p className={styles.kpiMetaLine}>{cashM.subline}</p>
        ) : null}
        {typeof cashM.pct_of_investment_pill === "string" ? (
          <div className={styles.kpiSub}>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
              {cashM.pct_of_investment_pill}
            </span>
          </div>
        ) : null}
        <div className={styles.kpiBar} style={{ background: barColor("cash_balance") }} />
      </article>

      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>{cardTitle(recM, "A recuperar")}</span>
        <p className={styles.kpiValue}>
          {recV != null ? formatCompactBrl(recV) : "N/A"}
        </p>
        {typeof recM.subline === "string" ? (
          <p className={styles.kpiMetaLine}>{recM.subline}</p>
        ) : null}
        <div className={styles.kpiBar} style={{ background: barColor("recovery_balance") }} />
      </article>

      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Payback estimado</span>
        <p className={styles.kpiValue}>
          {payMos != null ? `${Math.round(payMos)} meses` : "N/A"}
        </p>
        {typeof payM.subline === "string" ? (
          <p className={styles.kpiMetaLine}>{payM.subline}</p>
        ) : null}
        {typeof payM.detail_line === "string" ? (
          <p className={styles.kpiDetailLine}>{payM.detail_line}</p>
        ) : null}
        <div className={styles.kpiBar} style={{ background: barColor("roi_payback_months") }} />
      </article>
    </>
  );
}

function RetentionKpiCards({ data }: { data: KpiPageData }) {
  const baseM = data.currentMeta.base_students_end ?? {};
  const baseVal = data.current.base_students_end;
  const openM = (data.currentMeta.open_default_count ?? {}) as Record<string, unknown>;
  const openC = data.current.open_default_count;
  const openV = data.current.open_default_value;
  const recC = data.current.recovered_default_count ?? 0;
  const recV = data.current.recovered_default_value ?? 0;
  const cancelled =
    typeof openM.cancelled_count === "number" ? openM.cancelled_count : 0;
  const recordCount =
    typeof openM.month_total_records === "number"
      ? openM.month_total_records
      : Math.round((openC ?? 0) + recC + cancelled);
  const recoveryPct =
    typeof openM.recovery_rate_pct === "number"
      ? openM.recovery_rate_pct
      : recordCount > 0
        ? Math.round((recC / recordCount) * 100)
        : null;
  const pill3d =
    typeof openM.recovery_3d_pill === "string" ? openM.recovery_3d_pill : null;
  const monthShort = (data.currentPeriodLabel.split("/")[0] ?? "mês").toLowerCase();
  const exitsVal = data.previous.monthly_exits;
  const exitsPrev = data.previousPrevious.monthly_exits;
  const vsExit = data.previousPreviousPeriodLabel;
  const exitDelta = renderDelta(exitsVal, exitsPrev, vsExit, { invertColors: true });

  const star = baseM.partial === true ? "*" : "";
  const baseDisplay =
    baseVal != null
      ? `${new Intl.NumberFormat("pt-BR").format(baseVal)}${star}`
      : "N/A";
  const foot =
    typeof baseM.pending_note === "string" ? `*${baseM.pending_note}` : null;

  return (
    <>
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Base de alunos</span>
        <p className={styles.kpiValue}>{baseDisplay}</p>
        {foot ? <p className={styles.kpiMetaLine}>{foot}</p> : null}
        <div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
      </article>
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Inadimpl. em aberto ({monthShort})</span>
        <p className={styles.kpiValue}>
          {openC != null ? new Intl.NumberFormat("pt-BR").format(openC) : "N/A"}
        </p>
        {openV != null ? (
          <p className={styles.kpiMetaLine}>{formatCompactBrlOneDecimal(openV)} em aberto</p>
        ) : null}
        <p className={styles.kpiDetailLine}>
          {recC} recuperados ({formatCompactBrlOneDecimal(recV)}) · {cancelled} canceladas
        </p>
        <div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
      </article>
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Taxa recuperação ({monthShort})</span>
        <p className={styles.kpiValue}>
          {recoveryPct != null ? `${recoveryPct}%` : "N/A"}
        </p>
        <p className={styles.kpiMetaLine}>
          {recC} de {recordCount}
        </p>
        {pill3d ? (
          <div className={styles.kpiSub}>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>{pill3d}</span>
          </div>
        ) : null}
        <div className={styles.kpiBar} style={{ background: "#0f6e56" }} />
      </article>
      <article className={styles.kpiCard}>
        <span className={styles.kpiLabel}>
          Saídas
          {data.previousPeriodLabel ? ` (${data.previousPeriodLabel})` : ""}
        </span>
        <p className={styles.kpiValue}>
          {exitsVal != null ? new Intl.NumberFormat("pt-BR").format(exitsVal) : "N/A"}
        </p>
        <div className={styles.kpiSub}>
          {exitDelta.pill ? (
            <>
              <span className={`${styles.kpiDelta} ${exitDelta.pillClass}`}>
                {exitDelta.pill}
              </span>
              {exitDelta.tail}
            </>
          ) : (
            <span className={`${styles.kpiDelta} ${exitDelta.pillClass}`}>
              {exitDelta.tail}
            </span>
          )}
        </div>
        <div className={styles.kpiBar} style={{ background: "#a32d2d" }} />
      </article>
    </>
  );
}

export default async function KpisPage() {
  const data = await getKpiPageData();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon} aria-hidden>
              P
            </div>
            <div>
              <h1 className={styles.title}>Dashboard estratégico</h1>
              <p className={styles.subtitle}>{data.gymName}</p>
            </div>
          </div>
          <div className={styles.periodStrip}>
            <span>Período:</span>
            <strong>{data.currentPeriodLabel}</strong>
          </div>
        </div>
        <p className={styles.subtitle}>
          Atual: {data.currentPeriodLabel}
          {data.previousPeriodLabel ? ` · Comparativo: ${data.previousPeriodLabel}` : ""}
        </p>
      </header>

      {sections.map((section) => {
        const insightsList = data.insights[section.id] ?? [];
        const insightsBlock =
          insightsList.length > 0 ? (
            <div className={styles.insightsWrap}>
              <div
                className={`${styles.insightCard}${
                  section.id === "retention" ? ` ${styles.insightCardRetention}` : ""
                }${section.id === "roi" ? ` ${styles.insightCardRoi}` : ""}`}
              >
                <div
                  className={`${styles.insightCardHeader} ${section.theme.insightHeader} ${
                    section.id === "sales_marketing" ||
                    section.id === "retention" ||
                    section.id === "finance" ||
                    section.id === "roi"
                      ? styles.insightHeaderCaps
                      : ""
                  }`}
                >
                  <InsightHeaderIcon />
                  {section.id === "retention"
                    ? `! ${INSIGHT_HEADER_LABEL.retention}`
                    : section.id === "finance"
                      ? `! ${INSIGHT_HEADER_LABEL.finance}`
                      : section.id === "roi"
                        ? "! ANÁLISE DE RETORNO — BRUNO E GUILHERME"
                        : (INSIGHT_HEADER_LABEL[section.id] ?? "Insights")}
                </div>
                <div className={styles.insightCardBody}>
                  {insightsList.map((insight, idx) => {
                    const overviewSingle =
                      section.id === "overview" && !insight.title?.trim();
                    const financeSingle =
                      section.id === "finance" && !insight.title?.trim();
                    const roiSingle =
                      section.id === "roi" && !insight.title?.trim();
                    const salesNarrative =
                      section.id === "sales_marketing" && insight.title?.trim();
                    const retentionTitled =
                      section.id === "retention" && Boolean(insight.title?.trim());
                    return (
                      <div
                        key={`${section.id}-${idx}`}
                        className={styles.insightItem}
                      >
                        <div
                          className={`${styles.insightIcon} ${insightIconClass(insight.type)}`}
                          aria-hidden
                        >
                          {insightGlyph(insight.type)}
                        </div>
                        <div
                          className={
                            overviewSingle ||
                            financeSingle ||
                            roiSingle ||
                            salesNarrative ||
                            retentionTitled
                              ? styles.insightBodySingle
                              : undefined
                          }
                        >
                          {overviewSingle || financeSingle ? (
                            insight.body
                          ) : roiSingle ? (
                            highlightPayback19Meses(insight.body)
                          ) : salesNarrative ? (
                            <>
                              <strong>{insight.title}</strong> {insight.body}
                            </>
                          ) : retentionTitled ? (
                            <>
                              <strong>{insight.title}</strong>{" "}
                              {highlight50PercentInBody(insight.body)}
                            </>
                          ) : (
                            <>
                              <strong>{insight.title}</strong>
                              {insight.body ? (
                                <>
                                  {" "}
                                  {insight.body}
                                </>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null;
        return (
          <section
            key={section.id}
            className={`${styles.themeSection} ${section.theme.themeSection}`}
          >
            <div className={styles.themeHeader}>
              <div
                className={`${styles.themeIcon} ${section.theme.iconVariant}`}
                aria-hidden
              >
                {section.theme.iconShort}
              </div>
              <h2>{section.title}</h2>
              <span className={`${styles.themeBadge} ${section.theme.badgeVariant}`}>
                {section.id === "roi" ? "Desde Jul/24" : data.currentPeriodLabel}
              </span>
            </div>

            {section.id === "retention" ? (
              <div className={styles.kpiGrid}>
                <RetentionKpiCards data={data} />
              </div>
            ) : section.id === "finance" ? (
              <FinanceKpiCards data={data} />
            ) : section.id === "roi" ? (
              <div className={styles.kpiGrid}>
                <RoiKpiCards data={data} />
              </div>
            ) : (
              <div className={styles.kpiGrid}>
              {section.cards.map((card) => {
                const current = data.current[card.key];
                const previous = data.previous[card.key];
                const meta = data.currentMeta[card.key];
                const vsLabel = data.previousPeriodLabel;

                if (section.id === "sales_marketing") {
                  const metaObj = meta ?? {};
                  const deltaOpts =
                    card.key === "sales_total" &&
                    typeof metaObj.delta_pct_display === "number"
                      ? { deltaPctDisplay: metaObj.delta_pct_display as number }
                      : undefined;
                  const delta = renderDelta(current, previous, vsLabel, deltaOpts);
                  const metaLines = salesMarketingMetaLines(card.key, metaObj);

                  let mainStr = formatValue(current, card.unit);
                  if (
                    card.key === "no_show_rate" ||
                    card.key === "present_conversion_rate"
                  ) {
                    mainStr = current != null ? `${current.toFixed(0)}%` : "N/A";
                  }
                  if (card.key === "instagram_total_reach" && current != null) {
                    mainStr = new Intl.NumberFormat("pt-BR").format(current);
                  }

                  const prevRate =
                    typeof metaObj.previous_rate === "number"
                      ? metaObj.previous_rate
                      : null;

                  return (
                    <article key={card.key} className={styles.kpiCard}>
                      <span className={styles.kpiLabel}>{card.label}</span>
                      <p className={styles.kpiValue}>{mainStr}</p>
                      {metaLines.map((line) => (
                        <p key={`${card.key}-${line}`} className={styles.kpiMetaLine}>
                          {line}
                        </p>
                      ))}
                      {card.key === "no_show_rate" && prevRate != null ? (
                        <div className={styles.kpiSub}>
                          <span className={`${styles.kpiDelta} ${styles.deltaDown}`}>
                            era {prevRate}%
                          </span>
                        </div>
                      ) : null}
                      {card.key === "present_conversion_rate" && prevRate != null ? (
                        <div className={styles.kpiSub}>
                          <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
                            era {prevRate}%
                          </span>
                        </div>
                      ) : null}
                      {card.key === "sales_total" || card.key === "leads_generated" ? (
                        <div className={styles.kpiSub}>
                          {delta.pill ? (
                            <>
                              <span
                                className={`${styles.kpiDelta} ${delta.pillClass}`}
                              >
                                {delta.pill}
                              </span>
                              {delta.tail}
                            </>
                          ) : (
                            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>
                              {delta.tail}
                            </span>
                          )}
                        </div>
                      ) : null}
                      <div
                        className={styles.kpiBar}
                        style={{
                          background: salesMarketingBarColor(card.key),
                        }}
                      />
                    </article>
                  );
                }

                const delta = renderDelta(current, previous, vsLabel);

                if (section.id === "overview") {
                  const metaLine = overviewMetaLine(card.key, meta);
                  const hideDeltaRow =
                    card.key === "base_students_end" &&
                    typeof meta?.pending_note === "string" &&
                    typeof meta?.goal === "number";

                  return (
                    <article key={card.key} className={styles.kpiCard}>
                      <span className={styles.kpiLabel}>{card.label}</span>
                      <p className={styles.kpiValue}>
                        {overviewMainValue(card, current, meta)}
                      </p>
                      {metaLine ? (
                        <p className={styles.kpiMetaLine}>{metaLine}</p>
                      ) : null}
                      {!hideDeltaRow ? (
                        <div className={styles.kpiSub}>
                          {delta.pill ? (
                            <>
                              <span className={`${styles.kpiDelta} ${delta.pillClass}`}>
                                {delta.pill}
                              </span>
                              {delta.tail}
                            </>
                          ) : (
                            <span className={`${styles.kpiDelta} ${delta.pillClass}`}>
                              {delta.tail}
                            </span>
                          )}
                        </div>
                      ) : null}
                      <div
                        className={styles.kpiBar}
                        style={{
                          background: overviewBarColor(card.key, current, previous),
                        }}
                      />
                    </article>
                  );
                }

                return (
                  <article key={card.key} className={styles.kpiCard}>
                    <span className={styles.kpiLabel}>{card.label}</span>
                    <p className={styles.kpiValue}>{formatValue(current, card.unit)}</p>
                    <div className={styles.kpiSub}>
                      {delta.pill ? (
                        <>
                          <span className={`${styles.kpiDelta} ${delta.pillClass}`}>
                            {delta.pill}
                          </span>
                          {delta.tail}
                        </>
                      ) : (
                        <span className={`${styles.kpiDelta} ${delta.pillClass}`}>
                          {delta.tail}
                        </span>
                      )}
                    </div>
                    <div
                      className={styles.kpiBar}
                      style={{ background: barColor(card.key) }}
                    />
                  </article>
                );
              })}
              </div>
            )}

            {section.id === "sales_marketing" ? (
              <>
                {insightsBlock}
                {data.salesMarketingDashboard.payload ? (
                  <SalesMarketingDeepDive dashboard={data.salesMarketingDashboard} />
                ) : null}
              </>
            ) : section.id === "retention" ? (
              <>
                {insightsBlock}
                <RetentionDeepDive charts={data.retentionCharts} />
              </>
            ) : section.id === "finance" ? (
              <>
                {insightsBlock}
                <FinanceDeepDive charts={data.financeCharts} />
              </>
            ) : section.id === "roi" ? (
              <>
                {insightsBlock}
                <RoiDeepDive charts={data.roiCharts} />
              </>
            ) : (
              insightsBlock
            )}
          </section>
        );
      })}

      <section className={styles.sectionPlain}>
        <h2>Análises mensais</h2>
        <div className={styles.analysis}>
          {data.analysis.map((item) => (
            <article key={`${item.category}-${item.section}`} className={styles.chartCard}>
              <div className={styles.analysisItem}>
                <strong>{item.section}</strong>
                <p>{item.analysis}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {data.featureOfMonth && (
        <section className={styles.sectionPlain}>
          <div className={styles.feature}>
            <h2>{data.featureOfMonth.title}</h2>
            <p>{data.featureOfMonth.description}</p>
            {data.featureOfMonth.status ? (
              <p className={styles.featureMeta}>Status: {data.featureOfMonth.status}</p>
            ) : null}
            <div className={styles.impactList}>
              {Object.entries(data.featureOfMonth.impact).map(([key, value]) => (
                <span key={key}>
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
