"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type Chart,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { MonthlySalesBar } from "@/lib/data/sales-marketing-dashboard";
import { CHART_COLOR, CHART_PAINT, MONTHLY_SALES_THRESHOLD } from "@/lib/kpis/card-bar-colors";
import styles from "./MonthlySalesBarChart.module.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function salesThresholdForValue(v: number) {
  if (v >= MONTHLY_SALES_THRESHOLD.exceedingPace.minimum) return MONTHLY_SALES_THRESHOLD.exceedingPace;
  if (v >= MONTHLY_SALES_THRESHOLD.onPace.minimum) return MONTHLY_SALES_THRESHOLD.onPace;
  return MONTHLY_SALES_THRESHOLD.belowPace;
}

function targetLinePlugin(target: number) {
  return {
    id: "salesTargetLine",
    afterDraw(chart: Chart) {
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;
      if (!yScale || !xScale) return;
      const py = yScale.getPixelForValue(target);
      const left = xScale.left;
      const right = xScale.right;
      const ctx = chart.ctx;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = CHART_COLOR.secondary;
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
      ctx.fillStyle = CHART_COLOR.secondary;
      ctx.font = "500 10px DM Sans, system-ui, sans-serif";
      const label = String(target);
      ctx.fillText(label, right - 22, py - 5);
      ctx.restore();
    },
  };
}

type Props = {
  chart: MonthlySalesBar[];
  target: number;
};

export function MonthlySalesBarChart({ chart, target }: Props) {
  const labels = chart.map((b) => b.label);
  const values = chart.map((b) => b.value);
  const colors = values.map((value) => salesThresholdForValue(value).color);

  const yMaxRounded = useMemo(() => {
    const yMax = Math.max(180, target, ...chart.map((b) => b.value));
    return Math.ceil(yMax / 20) * 20;
  }, [chart, target]);

  const data = {
    labels,
    datasets: [
      {
        label: "Novos alunos",
        data: values,
        backgroundColor: colors,
        borderRadius: 3,
        borderSkipped: false as const,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 4, right: 4, bottom: 0, left: 0 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: () => "",
          label: (ctx) => {
            const y = ctx.parsed.y;
            if (y == null) return "";
            return `${y} novos alunos — ${salesThresholdForValue(y).label}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: CHART_PAINT.axisText,
          font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
          maxRotation: 45,
          autoSkip: false,
        },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: 0,
        max: yMaxRounded,
        ticks: {
          color: CHART_PAINT.axisText,
          font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
          stepSize: 20,
          padding: 6,
        },
        grid: { color: CHART_PAINT.grid },
        border: { display: false },
      },
    },
  };

  const plugins = useMemo(() => [targetLinePlugin(target)], [target]);

  return (
    <div className={styles.chartCanvasWrap} aria-label={`Vendas mensais. Meta do mês: ${target} novos alunos.`}>
      <Bar data={data} options={options} plugins={plugins} />
      <p className="sr-only">Faixas: {MONTHLY_SALES_THRESHOLD.belowPace.label}; {MONTHLY_SALES_THRESHOLD.onPace.label}; {MONTHLY_SALES_THRESHOLD.exceedingPace.label}.</p>
    </div>
  );
}
