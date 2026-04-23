type KpiMap = Record<string, number>;
type KpiMetaMap = Record<string, Record<string, unknown>>;
type RoiInsight = { type: string; title: string; body: string };

export type RoiChartPayload = {
  composition: Array<{ label: string; value: number; color: string }>;
  recoveryEvolution: { labels: string[]; values: number[] };
};

/** When DB has no ROI meta/charts yet. */
export const DEFAULT_ROI_CHARTS: RoiChartPayload = {
  composition: [
    { label: "Materiais", value: 497_000, color: "#e8891a" },
    { label: "Serviços", value: 351_000, color: "#534ab7" },
    { label: "Franquia", value: 80_000, color: "#378add" },
    { label: "Outros", value: 65_000, color: "#0f6e56" },
  ],
  recoveryEvolution: {
    labels: [
      "Abr/25",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
      "Jan",
      "Fev",
      "Mar",
    ],
    values: [
      965_000, 1_045_000, 1_002_000, 988_000, 972_000, 985_000, 968_000, 961_000,
      963_000, 955_000, 951_000, 958_933,
    ],
  },
};

const ROI_VALUE_FALLBACK: Record<string, number> = {
  total_invested: 1_020_300,
  cash_balance: 61_367,
  recovery_balance: 958_933,
  // roi_payback_months is computed in kpis.ts — no fallback here
};

const ROI_META_FALLBACK: KpiMetaMap = {
  total_invested: {
    card_title: "Total investido (Bruno+Guilherme)",
    subline: "R$ 765k pré + R$ 255k pós inauguração",
    detail_line:
      "Pré: materiais R$ 497k, serviços R$ 351k, franquia R$ 80k, outros R$ 65k",
    roi_charts: DEFAULT_ROI_CHARTS,
  },
  cash_balance: {
    card_title: "Saldo em caixa (fluxo real)",
    subline: "aportes pós (R$ 255k) + resultado acum. (-R$ 194k)",
    pct_of_investment_pill: "6% do investimento",
    pct_of_investment: 6,
  },
  recovery_balance: {
    card_title: "A recuperar",
    subline: "investido - saldo em caixa",
  },
  roi_payback_months: {
    subline: "no ritmo atual (R$ 19.462/mês)",
    detail_line: "Com Wellhub (Ago/26): ~19 meses (-R$ 50.133/mês)",
  },
};

const DEFAULT_ROI_INSIGHTS: RoiInsight[] = [
  {
    type: "info",
    title: "",
    body:
      "Investimento total: R$ 1.020.300 (Bruno + Guilherme) — R$ 765,2k antes da inauguração + R$ 255,1k de aportes operacionais (Abr a Ago/25). Sem aportes desde Set/25.",
  },
  {
    type: "info",
    title: "",
    body:
      "Saldo em caixa: R$ 61.367 — fluxo real considerando que meses negativos consomem caixa e meses positivos geram. Representa 6% do investimento total.",
  },
  {
    type: "neutral",
    title: "",
    body:
      "Faltam R$ 958.933 para recuperar. No ritmo atual (média R$ 19.462/mês), o payback levaria ~49 meses (4 anos e 1 meses).",
  },
  {
    type: "good",
    title: "",
    body:
      "Com o acordo Wellhub (+R$ 30,7k/mês a partir de Ago/26), a média projetada sobe para ~R$ 50.133/mês e o payback cai para ~19 meses.",
  },
  {
    type: "good",
    title: "",
    body:
      "Aceleração nos últimos 3 meses: Jan +R$ 4k, Fev +R$ 22k, Mar +R$ 33k = R$ 58k gerados. A operação está ganhando tração.",
  },
  {
    type: "info",
    title: "",
    body:
      "Distribuição de lucro (Gabriel): R$ 11.500 acumulados. Gabriel entrou com trabalho, não com capital — não entra na conta do retorno.",
  },
];

export function applyRoiPageFallbacks(
  current: KpiMap,
  currentMeta: KpiMetaMap,
  insights: Record<string, RoiInsight[]>,
): RoiChartPayload {
  for (const [code, val] of Object.entries(ROI_VALUE_FALLBACK)) {
    if (current[code] == null) current[code] = val;
  }
  for (const [code, defMeta] of Object.entries(ROI_META_FALLBACK)) {
    if (current[code] == null) continue;
    currentMeta[code] = { ...defMeta, ...(currentMeta[code] ?? {}) };
  }

  const list = insights.roi ?? [];
  if (list.length < 4) {
    insights.roi = [...DEFAULT_ROI_INSIGHTS];
  }

  const ti = currentMeta.total_invested ?? {};
  const fromMeta = ti.roi_charts as RoiChartPayload | undefined;
  if (
    fromMeta?.composition?.length &&
    fromMeta.recoveryEvolution?.labels?.length &&
    fromMeta.recoveryEvolution.values?.length
  ) {
    return fromMeta;
  }
  return DEFAULT_ROI_CHARTS;
}
