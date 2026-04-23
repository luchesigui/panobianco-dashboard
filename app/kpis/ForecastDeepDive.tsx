"use client";

import type { ForecastAnalysisItem, NextMonthForecastPayload } from "@/lib/data/kpis";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import styles from "./ForecastDeepDive.module.css";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.06)";

const COL = {
  matriculated: "#2b6cb0",
  wellhub: "#065f46",
  totalpass: "#ed8936",
  products: "#c05621",
  uncategorized: "#cbd5e0",
};

const BAR_ACCENTS = {
  revenue: "#2b6cb0",
  expense: "#ed8936",
  result: "#065f46",
  matriculated: "#63b3ed",
};

function fmtK(value: number): string {
  const k = value / 1000;
  const s = Math.abs(k) >= 100 ? Math.round(k).toString() : Math.round(k).toString();
  return `R$ ${s}k`;
}

function formatCompactBrl(value: number): string {
  const k = Math.round(value / 1000);
  return `R$ ${k}k`;
}

function formatCurrencySignedK(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const k = Math.round(Math.abs(value) / 1000);
  return `${sign}R$ ${k}k`;
}

function stackedTooltipLabel(item: TooltipItem<"bar">): string {
  const v = item.parsed.y;
  if (v == null || typeof v !== "number") return "";
  return `${item.dataset.label ?? ""}: ${fmtK(v)}`;
}

function analysisIconClass(t: ForecastAnalysisItem["type"]): string {
  if (t === "good") return styles.iconGood;
  if (t === "bad") return styles.iconBad;
  if (t === "warn") return styles.iconWarn;
  return styles.iconInfo;
}

function analysisGlyph(t: ForecastAnalysisItem["type"]): string {
  if (t === "good") return "▲";
  if (t === "bad") return "▼";
  if (t === "warn") return "●";
  return "i";
}

type Props = {
  forecast: NextMonthForecastPayload;
};

export function ForecastDeepDive({ forecast }: Props) {
  const {
    nextPeriodLabel,
    basisPeriodLabel,
    revenueForecast,
    expenseForecast,
    resultForecast,
    marginPct,
    matriculatedForecast,
    revenueVsBasisPct,
    matriculatedVsBasisPct,
    expenseSubline,
    matriculatedSubline,
    analysis,
    revenueChart,
    expenseDonut,
  } = forecast;

  const periodCaps = (() => {
    const i = nextPeriodLabel.indexOf("/");
    if (i === -1) return nextPeriodLabel.toUpperCase();
    return `${nextPeriodLabel.slice(0, i).toUpperCase()}/${nextPeriodLabel.slice(i + 1)}`;
  })();
  const headerCaps = `PREVISÃO ${periodCaps} — ANÁLISE`;

  const revPill = `${revenueVsBasisPct >= 0 ? "+" : ""}${Math.round(revenueVsBasisPct)}%`;
  const matPill = `${matriculatedVsBasisPct >= 0 ? "+" : ""}${Math.round(matriculatedVsBasisPct)}%`;

  const stackedData = useMemo(
    () => ({
      labels: [...revenueChart.labels],
      datasets: [
        {
          label: "Matriculados",
          data: [...revenueChart.stacked.matriculated],
          backgroundColor: COL.matriculated,
          borderWidth: 0,
        },
        {
          label: "Wellhub",
          data: [...revenueChart.stacked.wellhub],
          backgroundColor: COL.wellhub,
          borderWidth: 0,
        },
        {
          label: "Totalpass",
          data: [...revenueChart.stacked.totalpass],
          backgroundColor: COL.totalpass,
          borderWidth: 0,
        },
        {
          label: "Produtos",
          data: [...revenueChart.stacked.products],
          backgroundColor: COL.products,
          borderWidth: 0,
        },
        {
          label: "Não categorizado",
          data: [...revenueChart.stacked.uncategorized],
          backgroundColor: COL.uncategorized,
          borderWidth: 0,
        },
      ],
    }),
    [revenueChart],
  );

  const stackedMax = useMemo(() => {
    let max = 0;
    for (let i = 0; i < 2; i++) {
      const t =
        (revenueChart.stacked.matriculated[i] ?? 0) +
        (revenueChart.stacked.wellhub[i] ?? 0) +
        (revenueChart.stacked.totalpass[i] ?? 0) +
        (revenueChart.stacked.products[i] ?? 0) +
        (revenueChart.stacked.uncategorized[i] ?? 0);
      if (t > max) max = t;
    }
    const step = 50000;
    return Math.max(step, Math.ceil(max / step) * step);
  }, [revenueChart.stacked]);

  const plugins = useMemo(
    () => ({
      legend: {
        position: "top" as const,
        align: "start" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          font: { size: 10 },
          color: TICK,
        },
      },
      tooltip: {
        callbacks: {
          label: stackedTooltipLabel,
        },
      },
    }),
    [],
  );

  const commonX = {
    ticks: {
      color: TICK,
      maxRotation: 0,
      minRotation: 0,
      font: { size: 10 },
    },
    grid: { color: GRID },
  };

  const doughnutData = useMemo(
    () => ({
      labels: expenseDonut.map((c) => c.label),
      datasets: [
        {
          data: expenseDonut.map((c) => c.value),
          backgroundColor: expenseDonut.map((c) => c.color),
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    }),
    [expenseDonut],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: number; label: string }) => {
              const v = ctx.parsed;
              return `${ctx.label}: ${new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(v)}`;
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <div className={styles.root}>
      <h3 className={styles.pageTitle}>Previsão de resultado — {nextPeriodLabel}</h3>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Receita prevista</span>
          <p className={styles.kpiValue}>{formatCompactBrl(revenueForecast)}</p>
          <div className={styles.kpiSub}>
            <span
              className={`${styles.kpiDelta} ${
                revenueVsBasisPct >= 0 ? styles.deltaUp : styles.deltaDown
              }`}
            >
              {revPill}
            </span>
            <span>vs {basisPeriodLabel}</span>
          </div>
          <div className={styles.kpiBar} style={{ background: BAR_ACCENTS.revenue }} />
        </article>

        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Despesa prevista</span>
          <p className={styles.kpiValue}>{formatCompactBrl(expenseForecast)}</p>
          <p className={styles.kpiMetaLine}>{expenseSubline}</p>
          <div className={styles.kpiBar} style={{ background: BAR_ACCENTS.expense }} />
        </article>

        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Resultado previsto</span>
          <p className={styles.kpiValue}>{formatCurrencySignedK(resultForecast)}</p>
          <p className={styles.kpiMetaLine}>
            margem {marginPct.toFixed(1).replace(".", ",")}%
          </p>
          <div className={styles.kpiBar} style={{ background: BAR_ACCENTS.result }} />
        </article>

        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Matriculados previsto</span>
          <p className={styles.kpiValue}>{formatCompactBrl(matriculatedForecast)}</p>
          {matriculatedSubline ? (
            <p className={styles.kpiMetaLine}>{matriculatedSubline}</p>
          ) : null}
          <div className={styles.kpiSub}>
            <span
              className={`${styles.kpiDelta} ${
                matriculatedVsBasisPct >= 0 ? styles.deltaUp : styles.deltaDown
              }`}
            >
              {matPill}
            </span>
            <span>vs {basisPeriodLabel}</span>
          </div>
          <div className={styles.kpiBar} style={{ background: BAR_ACCENTS.matriculated }} />
        </article>
      </div>

      <div className={styles.analysisWrap}>
        <div className={styles.analysisCard}>
          <div className={styles.analysisHeader}>{headerCaps}</div>
          <div className={styles.analysisBody}>
            {analysis.map((item) => (
              <div key={`${item.type}-${item.body.slice(0, 48)}`} className={styles.analysisItem}>
                <span
                  className={`${styles.analysisIcon} ${analysisIconClass(item.type)}`}
                  aria-hidden
                >
                  {analysisGlyph(item.type)}
                </span>
                <p className={styles.analysisText}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartRow}>
        <article className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Receita prevista — composição</h4>
          <p className={styles.chartSub}>Último mês real vs mês seguinte (projeção)</p>
          <div className={styles.chartCanvas}>
            <Bar
              data={stackedData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins,
                scales: {
                  x: { ...commonX, stacked: true },
                  y: {
                    stacked: true,
                    min: 0,
                    max: stackedMax,
                    ticks: {
                      color: TICK,
                      font: { size: 10 },
                      callback: (v) => fmtK(Number(v)),
                    },
                    grid: { color: GRID },
                  },
                },
              }}
            />
          </div>
        </article>

        <article className={styles.chartCard}>
          <h4 className={styles.chartTitle}>Despesa prevista — método</h4>
          <p className={styles.chartSub}>
            Distribuição ilustrativa proporcional ao total projetado
          </p>
          <div className={styles.chartCanvas}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className={styles.donutLegend}>
            {expenseDonut.map((row) => (
              <div key={row.label} className={styles.legendRow}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: row.color }}
                  aria-hidden
                />
                <span>
                  {row.label} ·{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "percent",
                    maximumFractionDigits: 0,
                  }).format(row.value / expenseForecast)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
