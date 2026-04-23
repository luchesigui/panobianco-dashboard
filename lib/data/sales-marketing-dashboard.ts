/**
 * JSON payload for the extended "Vendas e marketing" section (funnel, weekly grid, recepção, chart meta).
 * Weeks: weekHeaders length drives S1…Sn (typically 4–5).
 */
export type SalesMarketingDashboardPayload = {
  /** Opcional: cartões “Via aula experimental” / “Outros canais”. */
  salesComposition?: {
    sectionTitle?: string;
    experimental: {
      title: string;
      value: number;
      subtext: string;
    };
    otherChannels: {
      title: string;
      value: number;
      subtext: string;
    };
  };
  funnel: {
    scheduled: { value: number; subtext: string };
    present: { value: number; subtext: string };
    closings: { value: number; subtext: string };
    conversion: { value: number; subtext: string; isPercent?: boolean };
  };
  weekly: {
    weekHeaders: string[];
    marketingTitle: string;
    marketing: {
      reach: Array<number | null>;
      frequency: Array<number | null>;
      views: Array<number | null>;
      followers: Array<number | null>;
      totals: {
        reach: number;
        frequency: number;
        views: number;
        followers: number;
      };
    };
    funnelTitle: string;
    funnelNote?: string;
    funnelWeekly: {
      scheduled: Array<number | null>;
      attendance: Array<number | null>;
      closings: Array<number | null>;
      totals: { scheduled: number; attendance: number; closings: number };
    };
    salesTitle: string;
    salesNote?: string;
    salesWeekly: {
      totals: Array<number | null>;
      grandTotal: number;
      /** Optional breakdown: one row per receptionist × week (dom–sáb columns). */
      byReceptionist?: Array<{
        name: string;
        salesByWeek: Array<number | null>;
        rowTotal: number;
      }>;
    };
  };
  receptionistsPeriodLabel?: string;
  receptionists: Array<{
    name: string;
    badge?: string;
    leads: number;
    sales: number;
    goal: number;
    conversion_pct: number;
    bar_variant?: "accent" | "default";
  }>;
};

export type MonthlySalesBar = {
  periodId: string;
  label: string;
  value: number;
  color: string;
};
