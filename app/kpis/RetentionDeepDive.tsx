"use client";

import type { RetentionChartPayload } from "@/lib/data/kpis";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type Chart,
} from "chart.js";
import { useMemo } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import styles from "./RetentionDeepDive.module.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.05)";

function baseGoalLinePlugin(goal: number) {
  return {
    id: "retentionBaseGoalLine",
    afterDraw(chart: Chart) {
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;
      if (!yScale || !xScale) return;
      const py = yScale.getPixelForValue(goal);
      if (!Number.isFinite(py)) return;
      const left = xScale.left;
      const right = xScale.right;
      const ctx = chart.ctx;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#d85a30";
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
      ctx.fillStyle = "#d85a30";
      ctx.font = "500 10px DM Sans, system-ui, sans-serif";
      ctx.fillText(String(goal), right - 28, py - 4);
      ctx.restore();
    },
  };
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);
}

type Props = {
  charts: RetentionChartPayload;
};

export function RetentionDeepDive({ charts }: Props) {
  const { inadimplencia: inad } = charts;

  const lineData = useMemo(
    () => ({
      labels: charts.chartLabels,
      datasets: [
        {
          label: "Histórico",
          data: charts.baseHistoric,
          borderColor: "#b4b2a9",
          backgroundColor: "rgba(180, 178, 169, 0.08)",
          borderWidth: 2,
          tension: 0.3,
          spanGaps: false,
          fill: true,
          pointRadius: 2,
          pointBackgroundColor: "#b4b2a9",
        },
        {
          label: "Projeção",
          data: charts.baseProjection,
          borderColor: "#0f6e56",
          backgroundColor: "rgba(15, 110, 86, 0.12)",
          borderWidth: 2.5,
          borderDash: [4, 3],
          tension: 0.3,
          spanGaps: false,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0f6e56",
          pointBorderWidth: 2,
        },
      ],
    }),
    [charts.baseHistoric, charts.baseProjection, charts.chartLabels],
  );

  const lineOptions = useMemo(() => {
    const maxY = Math.max(
      charts.baseGoalLine * 1.08,
      ...charts.baseHistoric.filter((v): v is number => v != null),
      ...charts.baseProjection.filter((v): v is number => v != null),
    );
    const yMax = Math.ceil(maxY / 50) * 50;
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 4, right: 6, bottom: 0, left: 0 } },
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item: { parsed: { y: number | null } }) =>
            item.parsed.y != null && !Number.isNaN(item.parsed.y),
        },
      },
      scales: {
        x: {
          ticks: {
            color: TICK,
            font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
            maxRotation: 45,
            autoSkip: false,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          min: 0,
          max: yMax,
          ticks: {
            color: TICK,
            font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
            callback: (v: string | number) => fmtInt(Number(v)),
          },
          grid: { color: GRID },
          border: { display: false },
        },
      },
    };
  }, [charts.baseGoalLine, charts.baseHistoric, charts.baseProjection]);

  const linePlugins = useMemo(
    () => [baseGoalLinePlugin(charts.baseGoalLine)],
    [charts.baseGoalLine],
  );

  const doughnutData = useMemo(
    () => ({
      labels: ["Recuperados", "Em aberto", "Canceladas"],
      datasets: [
        {
          data: [inad.recovered, inad.open, inad.cancelled],
          backgroundColor: ["#0f6e56", "#d85a30", "#b4b2a9"],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    }),
    [inad.cancelled, inad.open, inad.recovered],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: number; label: string }) => {
              const v = ctx.parsed;
              return `${ctx.label}: ${fmtInt(v)}`;
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <div className={styles.chartRow}>
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Evolução da base de alunos</h3>
        <p className={styles.chartSub}>Histórico + projeção com ações</p>
        <div className={styles.legendRow}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#b4b2a9" }} />
            Histórico
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#0f6e56" }} />
            Projeção
          </span>
        </div>
        <div className={styles.chartCanvas}>
          <Line data={lineData} options={lineOptions} plugins={linePlugins} />
        </div>
      </div>

      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>
          Inadimplência — {inad.titleSuffix.toLowerCase()}
        </h3>
        <p className={styles.chartSub}>
          {fmtInt(inad.recordCount)} registros no mês
        </p>
        <div className={styles.chartCanvasDonut}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
        <div className={styles.donutLegend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#0f6e56" }} />
            Recuperados {fmtInt(inad.recovered)} (R$ {fmtInt(inad.valueRecovered)})
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#d85a30" }} />
            Em aberto {fmtInt(inad.open)} (R$ {fmtInt(inad.valueOpen)})
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#b4b2a9" }} />
            Canceladas {fmtInt(inad.cancelled)}
          </span>
        </div>
      </div>
    </div>
  );
}
