import type { KpiPageData } from "@/lib/data/kpis";
import { MonthlySalesBarChart } from "./MonthlySalesBarChart";
import styles from "./SalesMarketingDeepDive.module.css";

type Props = {
  dashboard: KpiPageData["salesMarketingDashboard"];
};

function padWeeks<T>(arr: Array<T | null | undefined>, n: number): Array<T | null> {
  const out: Array<T | null> = [];
  for (let i = 0; i < n; i++) {
    const v = arr[i];
    out.push(v === undefined ? null : v ?? null);
  }
  return out;
}

function fmtCell(
  v: number | null | undefined,
  mode: "int" | "decimal1" | "intCompact",
): string {
  if (v == null) return "—";
  if (mode === "decimal1") {
    return v.toFixed(1).replace(".", ",");
  }
  if (mode === "intCompact") {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
  }
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);
}

export function SalesMarketingDeepDive({ dashboard }: Props) {
  const p = dashboard.payload;
  if (!p) return null;

  const w = p.weekly;
  const weeks = w.weekHeaders;
  const n = weeks.length;

  const mk = w.marketing;
  const reachW = padWeeks(mk.reach, n);
  const freqW = padWeeks(mk.frequency, n);
  const viewsW = padWeeks(mk.views, n);
  const folW = padWeeks(mk.followers, n);

  const fw = w.funnelWeekly;
  const schW = padWeeks(fw.scheduled, n);
  const attW = padWeeks(fw.attendance, n);
  const cloW = padWeeks(fw.closings, n);
  const salesW = padWeeks(w.salesWeekly.totals, n);

  const chart = dashboard.monthlySalesChart;
  const target = dashboard.salesTarget;

  const recepMaxConv = Math.max(
    0.001,
    ...p.receptionists.map((r) => r.conversion_pct),
  );

  const comp = p.salesComposition;

  const funnelSteps = [
    {
      label: "Agendadas",
      value: String(p.funnel.scheduled.value),
      sub: p.funnel.scheduled.subtext,
      bg: "#EEEDFE",
      fg: "#534AB7",
    },
    {
      label: "Presentes",
      value: String(p.funnel.present.value),
      sub: p.funnel.present.subtext,
      bg: "#FAECE7",
      fg: "#D85A30",
    },
    {
      label: "Fechamentos",
      value: String(p.funnel.closings.value),
      sub: p.funnel.closings.subtext,
      bg: "#E1F5EE",
      fg: "#0F6E56",
    },
    {
      label: "Conversão",
      value: p.funnel.conversion.isPercent
        ? `${p.funnel.conversion.value}%`
        : String(p.funnel.conversion.value),
      sub: p.funnel.conversion.subtext,
      bg: "#EAF3DE",
      fg: "#639922",
    },
  ] as const;

  return (
    <div className={styles.deepRoot}>
      {comp ? (
        <>
          <h3 className={styles.sectionLabel}>
            {comp.sectionTitle ?? "Composição das vendas"}
          </h3>
          <div className={styles.salesComp}>
            <article className={styles.salesCompCard}>
              <div
                className={styles.salesCompStripe}
                style={{ background: "var(--blue, #185fa5)" }}
                aria-hidden
              />
              <div>
                <div className={styles.salesCompLabel}>
                  {comp.experimental.title}
                </div>
                <div
                  className={styles.salesCompVal}
                  style={{ color: "var(--blue, #185fa5)" }}
                >
                  {new Intl.NumberFormat("pt-BR").format(comp.experimental.value)}
                </div>
                <div className={styles.salesCompDetail}>
                  {comp.experimental.subtext}
                </div>
              </div>
            </article>
            <article className={styles.salesCompCard}>
              <div
                className={styles.salesCompStripe}
                style={{ background: "var(--accent, #0f6e56)" }}
                aria-hidden
              />
              <div>
                <div className={styles.salesCompLabel}>
                  {comp.otherChannels.title}
                </div>
                <div
                  className={styles.salesCompVal}
                  style={{ color: "var(--accent, #0f6e56)" }}
                >
                  {new Intl.NumberFormat("pt-BR").format(comp.otherChannels.value)}
                </div>
                <div className={styles.salesCompDetail}>
                  {comp.otherChannels.subtext}
                </div>
              </div>
            </article>
          </div>
        </>
      ) : null}

      <h3 className={styles.sectionLabel}>Funil de aula experimental</h3>
      <div className={styles.funnelRow}>
        {funnelSteps.map((step, i) => (
          <div
            key={step.label}
            className={styles.funnelStep}
            style={{ background: step.bg, color: step.fg }}
          >
            <span className={styles.funnelLabel}>{step.label}</span>
            <span className={styles.funnelVal} style={{ color: step.fg }}>
              {step.value}
            </span>
            <span className={styles.funnelRate}>{step.sub}</span>
            {i < funnelSteps.length - 1 ? (
              <span className={styles.funnelArrow} aria-hidden>
                &#9654;
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <h3 className={styles.sectionLabel}>
        Visão semanal — vendas e marketing (dom a sáb)
      </h3>
      <div className={`${styles.chartCard} ${styles.chartCardTable}`}>
        <table className={styles.weekTable}>
          <thead>
            <tr>
              <th className={styles.thLabel} />
              {weeks.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.wkGroup} colSpan={n + 2}>
                {w.marketingTitle}
              </td>
            </tr>
            <WeeklyRow
              label="Alcance"
              cells={reachW}
              total={mk.totals.reach}
              mode="intCompact"
              weekKeys={weeks}
            />
            <WeeklyRow
              label="Frequência"
              cells={freqW}
              total={mk.totals.frequency}
              mode="decimal1"
              weekKeys={weeks}
            />
            <WeeklyRow
              label="Visualizações"
              cells={viewsW}
              total={mk.totals.views}
              mode="intCompact"
              weekKeys={weeks}
            />
            <WeeklyRow
              label="Novos seguidores"
              cells={folW}
              total={mk.totals.followers}
              mode="int"
              weekKeys={weeks}
            />
            <tr>
              <td className={styles.wkGroup} colSpan={n + 2}>
                {w.funnelTitle}
                {w.funnelNote ? (
                  <span className={styles.wkGroupNote}> — {w.funnelNote}</span>
                ) : null}
              </td>
            </tr>
            <WeeklyRow
              label="Agendadas"
              cells={schW}
              total={fw.totals.scheduled}
              mode="int"
              weekKeys={weeks}
            />
            <WeeklyRow
              label="Presenças"
              cells={attW}
              total={fw.totals.attendance}
              mode="int"
              weekKeys={weeks}
            />
            <WeeklyRow
              label="Fechamentos"
              cells={cloW}
              total={fw.totals.closings}
              mode="int"
              weekKeys={weeks}
            />
            <tr>
              <td className={styles.wkGroup} colSpan={n + 2}>
                {w.salesTitle}
                {w.salesNote ? (
                  <span className={styles.wkGroupNote}> — {w.salesNote}</span>
                ) : null}
              </td>
            </tr>
            <WeeklyRow
              label="Vendas (todos canais)"
              cells={salesW}
              total={w.salesWeekly.grandTotal}
              mode="int"
              weekKeys={weeks}
            />
          </tbody>
        </table>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Performance por recepcionista</h3>
          {p.receptionistsPeriodLabel ? (
            <p className={styles.chartSub}>
              Conversão leads → vendas — {p.receptionistsPeriodLabel}
            </p>
          ) : (
            <p className={styles.chartSub}>Conversão leads → vendas</p>
          )}
          <div className={styles.teamTableWrap}>
            <table className={styles.teamTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Leads</th>
                  <th>Vendas</th>
                  <th className={styles.teamThConv}>Conversão</th>
                </tr>
              </thead>
              <tbody>
                {p.receptionists.map((r) => {
                  const barW = Math.round((r.conversion_pct / recepMaxConv) * 100);
                  const isAccent = r.bar_variant === "accent";
                  return (
                    <tr key={r.name}>
                      <td className={styles.teamTdName}>
                        {r.name}
                        {r.badge ? (
                          <span className={styles.teamBadge}> ({r.badge})</span>
                        ) : null}
                      </td>
                      <td className={styles.teamTdNum}>{r.leads}</td>
                      <td className={styles.teamTdNum}>
                        {r.sales}{" "}
                        <span className={styles.teamVendasSplit}>/ {r.goal}</span>
                      </td>
                      <td className={styles.teamTdConv}>
                        <div className={styles.barCell}>
                          <div className={styles.miniBarTrack}>
                            <div
                              className={
                                isAccent ? styles.miniBarFillAccent : styles.miniBarFill
                              }
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                          <span className={styles.teamPct}>
                            {r.conversion_pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartCardTitle}>Vendas mensais</h3>
          <p className={styles.chartSub}>Novos alunos por mês</p>
          {chart.length === 0 ? (
            <p className={styles.chartEmpty}>Sem histórico de vendas no período.</p>
          ) : (
            <div className={styles.monthlySalesChartBlock}>
              <MonthlySalesBarChart chart={chart} target={target} />
              <p className={styles.chartLegend}>
                Linha tracejada: meta {target} vendas/mês
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeeklyRow({
  label,
  cells,
  total,
  mode,
  weekKeys,
}: {
  label: string;
  cells: Array<number | null>;
  total: number;
  mode: "int" | "decimal1" | "intCompact";
  weekKeys: string[];
}) {
  return (
    <tr>
      <td className={styles.tdLabel}>{label}</td>
      {cells.map((c, i) => (
        <td key={`${label}-${weekKeys[i]}`} className={styles.tdNum}>
          {fmtCell(c, mode)}
        </td>
      ))}
      <td className={styles.tdTotal}>{fmtCell(total, mode)}</td>
    </tr>
  );
}
