type KpiMap = Record<string, number>;
type KpiMetaMap = Record<string, Record<string, unknown>>;
type FinanceInsight = { type: string; title: string; body: string };

/** Values when DB has no row yet (migration/seed not applied). */
const FINANCE_VALUE_FALLBACK: Record<string, number> = {
  invoice_tax_nf: 25,
  accumulated_operational_no_contributions: -194000,
  accumulated_with_contributions: 61367,
  royalties_validation: 18497,
};

const FINANCE_META_FALLBACK: KpiMetaMap = {
  invoice_tax_nf: {
    partial: true,
    approximate_main: true,
    pct_revenue_line: "0,01% da receita",
    ref_line: "ref: 13,4%",
    footnote: "Emissão de NF mínima hoje — passivo fiscal acumulando",
  },
  operational_result_100pct_nf: {
    partial: true,
    margin_line: "margem 3% (simulação 13,4%)",
    tax_theory_line: "Imposto teórico: R$ 26.661/mês sobre receita total",
  },
  accumulated_operational_no_contributions: {
    partial: true,
    subline: "resultado operacional puro",
    footnote: "Só receita − despesas, sem aportes dos sócios",
    delta_vs_prev_pill: "+R$ 32.661 vs Fev",
  },
  accumulated_with_contributions: {
    partial: true,
    compact_currency: true,
    subline: "inclui R$ 255k aportes pós-inauguração",
    aportes_line: "Aportes: Abr R$ 158k · Jun R$ 51k · Jul R$ 18,5k · Ago R$ 27,6k",
    delta_vs_prev_pill: "+R$ 32.661 vs Fev",
  },
  royalties_validation: {
    partial: true,
    pct_line: "9,3% da receita (deveria ser 12%)",
    shortfall_pill: "−R$ 5.385",
  },
  expenses_total: {
    delta_abs_line: "+R$ 5,2k",
  },
};

const DEFAULT_FINANCE_INSIGHTS: FinanceInsight[] = [
  {
    type: "good",
    title: "",
    body: "Terceiro mês positivo consecutivo e novo recorde: +R$ 32,7k (margem 16,4%). Tendência: Jan +R$ 4,1k → Fev +R$ 21,6k → Mar +R$ 32,7k.",
  },
  {
    type: "bad",
    title: "",
    body: "Passivo fiscal (NF): emissão de NF hoje é mínima (~0% da receita). Se emitisse 100% (13,4%), o imposto seria R$ 26.661/mês. O resultado cairia de +R$ 33k para +R$ 6.000 (margem 3%). A operação se sustenta, mas com margem apertada. Esse passivo acumula mês a mês.",
  },
  {
    type: "bad",
    title: "",
    body: "Royalties divergentes pelo 2º mês: pagou R$ 18,5k (9,3%) vs R$ 23,9k devidos (12%). Faltam R$ 5.385 em março. Acumulado: R$ 9.902 a menos. Investigar com a franqueadora.",
  },
  {
    type: "good",
    title: "",
    body: "Matriculados ultrapassaram Wellhub: R$ 102,9k (51,6%). 77% vem do recorrente (R$ 79,3k) — receita previsível e saudável.",
  },
  {
    type: "bad",
    title: "",
    body: "Insumos disparou +79%: de R$ 2,9k para R$ 5,2k — maior variação proporcional do mês.",
  },
  {
    type: "warn",
    title: "",
    body: "Água subiu 39%: de R$ 3,4k para R$ 4,8k. Monitorar.",
  },
  {
    type: "info",
    title: "",
    body: "Despesas pontuais: IPTU R$ 1,9k + Rescisões R$ 1,6k = R$ 3,5k não recorrente.",
  },
  {
    type: "warn",
    title: "",
    body: "Wellhub recuou R$ 6,6k (R$ 74,7k vs R$ 81,3k). Acordo de R$ 112k/mês em Ago/26 elimina volatilidade.",
  },
];

/**
 * Fills finance KPIs / meta / insights when the DB is missing newer rows (e.g. migration not applied).
 * Real DB values and meta always win when present.
 */
export function applyFinancePageFallbacks(
  current: KpiMap,
  currentMeta: KpiMetaMap,
  insights: Record<string, FinanceInsight[]>,
): void {
  for (const [code, val] of Object.entries(FINANCE_VALUE_FALLBACK)) {
    if (current[code] == null) current[code] = val;
  }
  for (const [code, defMeta] of Object.entries(FINANCE_META_FALLBACK)) {
    if (current[code] == null) continue;
    currentMeta[code] = { ...defMeta, ...(currentMeta[code] ?? {}) };
  }

  const fin = insights.finance ?? [];
  if (fin.length <= 2) {
    insights.finance = [...DEFAULT_FINANCE_INSIGHTS];
  }
}
