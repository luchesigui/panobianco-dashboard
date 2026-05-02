"use client";

import { create } from "zustand";

type KpiPeriodState = {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeMonth(value: string): string {
  return /^\d{4}-\d{2}$/.test(value) ? value : currentMonth();
}

export const useKpiPeriodStore = create<KpiPeriodState>((set) => ({
  selectedMonth: currentMonth(),
  setSelectedMonth: (month) => set({ selectedMonth: normalizeMonth(month) }),
}));
