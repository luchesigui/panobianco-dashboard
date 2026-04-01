"use client";

import type { FinanceChartPayload } from "@/lib/data/kpis";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import styles from "./FinanceDeepDive.module.css";

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.06)";

const COL = {
  matriculated: "#378add",
  wellhub: "#0d5c47",
  totalpass: "#e8891a",
  products: "#c43a3a",
  uncategorized: "#c8c6c0",
  pos: "#0f6e56",
  neg: "#8b1f1f",
};

function fmtK(value: number): string {
  const k = value / 1000;
  const s =
    Math.abs(k) >= 100
      ? Math.round(k).toString()
      : k.toFixed(0);
  return `R$ ${s}k`;
}

function stackedTooltipLabel(item: TooltipItem<"bar">): string {
  const v = item.parsed.y;
  if (v == null || typeof v !== "number") return "";
  return `${item.dataset.label ?? ""}: ${fmtK(v)}`;
}

function opTooltipLabel(item: TooltipItem<"bar">): string {
  const v = item.parsed.y;
  if (v == null || typeof v !== "number") return "";
  return fmtK(v);
}

type Props = {
  charts: FinanceChartPayload;
};

export function FinanceDeepDive({ charts }: Props) {
  const { labels, stacked, operationalResult } = charts;

  const stackedData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Matriculados",
          data: stacked.matriculated,
          backgroundColor: COL.matriculated,
          borderWidth: 0,
          borderRadius: 0,
        },
        {
          label: "Wellhub",
          data: stacked.wellhub,
          backgroundColor: COL.wellhub,
          borderWidth: 0,
        },
        {
          label: "Totalpass",
          data: stacked.totalpass,
          backgroundColor: COL.totalpass,
          borderWidth: 0,
        },
        {
          label: "Produtos",
          data: stacked.products,
          backgroundColor: COL.products,
          borderWidth: 0,
        },
        {
          label: "Não categorizado",
          data: stacked.uncategorized,
          backgroundColor: COL.uncategorized,
          borderWidth: 0,
        },
      ],
    }),
    [labels, stacked],
  );

  const opColors = useMemo(
    () => operationalResult.map((v) => (v >= 0 ? COL.pos : COL.neg)),
    [operationalResult],
  );

  const opData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Resultado",
          data: operationalResult,
          backgroundColor: opColors,
          borderWidth: 0,
          borderRadius: 2,
        },
      ],
    }),
    [labels, operationalResult, opColors],
  );

  const opScale = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const v of operationalResult) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const pad = Math.max(20000, Math.round((max - min) * 0.12));
    const yMin = Math.floor((min - pad) / 20000) * 20000;
    const yMax = Math.ceil((max + pad) / 20000) * 20000;
    return { min: yMin, max: yMax };
  }, [operationalResult]);

  const stackedMax = useMemo(() => {
    let max = 0;
    for (let i = 0; i < labels.length; i++) {
      const t =
        (stacked.matriculated[i] ?? 0) +
        (stacked.wellhub[i] ?? 0) +
        (stacked.totalpass[i] ?? 0) +
        (stacked.products[i] ?? 0) +
        (stacked.uncategorized[i] ?? 0);
      if (t > max) max = t;
    }
    const step = 50000;
    return Math.max(step, Math.ceil(max / step) * step);
  }, [labels.length, stacked]);

  const commonX = {
    ticks: {
      color: TICK,
      maxRotation: 45,
      minRotation: 45,
      font: { size: 10 },
    },
    grid: { color: GRID },
  };

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

  const opPlugins = useMemo(
    () => ({
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: opTooltipLabel,
        },
      },
    }),
    [],
  );

  if (!labels.length) return null;

  return (
    <div className={styles.root}>
      <div className={styles.chartRow}>
        <article className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Receita operacional mensal</h3>
          <p className={styles.chartSub}>Composição por fonte</p>
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
          <h3 className={styles.chartTitle}>Resultado operacional mensal</h3>
          <p className={styles.chartSub}>
            Receita − despesas (sem impostos, sem aportes)
          </p>
          <div className={styles.chartCanvas}>
            <Bar
              data={opData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: opPlugins,
                scales: {
                  x: { ...commonX, stacked: false },
                  y: {
                    min: opScale.min,
                    max: opScale.max,
                    ticks: {
                      color: TICK,
                      font: { size: 10 },
                      callback: (v) => fmtK(Number(v)),
                    },
                    grid: {
                      color: (ctx) =>
                        ctx.tick.value === 0 ? "rgba(0,0,0,0.18)" : GRID,
                    },
                  },
                },
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
