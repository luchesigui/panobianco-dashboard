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
import styles from "./MonthlySalesBarChart.module.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const TICK = "#9c9b96";
const GRID = "rgba(0, 0, 0, 0.05)";

/** Same thresholds as reference dashboard (NV12 bar colors). */
function barColorForValue(v: number): string {
  if (v >= 150) return "#0f6e56";
  if (v >= 120) return "#378add";
  return "#d85a30";
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
      ctx.strokeStyle = "#d85a30";
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
      ctx.fillStyle = "#d85a30";
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
  const colors = values.map(barColorForValue);

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
            return `${y} novos alunos`;
          },
        },
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
        max: yMaxRounded,
        ticks: {
          color: TICK,
          font: { size: 10, family: "DM Sans, system-ui, sans-serif" },
          stepSize: 20,
          padding: 6,
        },
        grid: { color: GRID },
        border: { display: false },
      },
    },
  };

  const plugins = useMemo(() => [targetLinePlugin(target)], [target]);

  return (
    <div className={styles.chartCanvasWrap}>
      <Bar data={data} options={options} plugins={plugins} />
    </div>
  );
}
