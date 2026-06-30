import { getKpiPageData } from "@/lib/data/kpis";
import { FinanceiroCardGrid } from "./_components/cards/FinanceiroCardGrid";
import { RetencaoCardGrid } from "./_components/cards/RetencaoCardGrid";
import { RoiCardGrid } from "./_components/cards/RoiCardGrid";
import { VendasMarketingCardGrid } from "./_components/cards/VendasMarketingCardGrid";
import { VisaoGeralCardGrid } from "./_components/cards/VisaoGeralCardGrid";
import { DashboardHeader } from "./_components/DashboardHeader";
import { MonthSelector } from "./_components/MonthSelector";
import { SectionCard } from "./_components/SectionCard";
import { SectionInsights } from "./_components/SectionInsights";
import { FinanceiroCharts } from "./_components/financeiro/FinanceiroCharts";
import { Projecao } from "./_components/projecao/Projecao";
import { RetencaoCharts } from "./_components/retencao/RetencaoCharts";
import { RoiCharts } from "./_components/roi/RoiCharts";
import { VendasMarketingCharts } from "./_components/vendas-marketing/VendasMarketingCharts";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function getWeekIndexAndMonth(date: Date) {
	const startOfWeek = new Date(date);
	startOfWeek.setDate(date.getDate() - date.getDay());

	const wednesday = new Date(startOfWeek);
	wednesday.setDate(startOfWeek.getDate() + 3);

	const ownerYear = wednesday.getFullYear();
	const ownerMonthNum = wednesday.getMonth(); // 0-based

	const ownerMonthPeriod = `${ownerYear}-${String(ownerMonthNum + 1).padStart(2, "0")}-01`;

	const firstDayOfMonth = new Date(ownerYear, ownerMonthNum, 1);
	const firstWednesday = new Date(firstDayOfMonth);
	const dayOfWeek = firstDayOfMonth.getDay();
	const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
	firstWednesday.setDate(firstDayOfMonth.getDate() + daysUntilWednesday);

	const firstWeekSunday = new Date(firstWednesday);
	firstWeekSunday.setDate(firstWednesday.getDate() - 3);

	const diffMs = startOfWeek.getTime() - firstWeekSunday.getTime();
	const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));

	return {
		monthPeriod: ownerMonthPeriod,
		weekIdx: diffWeeks,
	};
}

function getDefaultActiveWeekIdx(p: any, dashboard: any): number {
	if (!p || !p.weekly) return 0;
	const weeks = p.weekly.weekHeaders;
	const n = weeks.length;
	let activeWeekIdx = -1;

	const today = new Date();
	const { monthPeriod, weekIdx } = getWeekIndexAndMonth(today);
	const mShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
	const parts = monthPeriod.split("-").map(Number);
	const formattedPeriodLabel = `${mShort[parts[1] - 1]}/${String(parts[0]).slice(-2)}`; // e.g. "Jun/26"

	if (dashboard.calendarCurrentMonthLabel === formattedPeriodLabel) {
		activeWeekIdx = weekIdx;
	} else if (dashboard.primaryPayload?.weekly) {
		const pw = dashboard.primaryPayload.weekly;
		for (let i = n - 1; i >= 0; i--) {
			const hasData =
				pw.marketing.reach[i] != null ||
				pw.marketing.frequency[i] != null ||
				pw.marketing.views[i] != null ||
				pw.marketing.followers[i] != null ||
				pw.funnelWeekly.scheduled[i] != null ||
				pw.funnelWeekly.attendance[i] != null ||
				pw.funnelWeekly.closings[i] != null ||
				pw.salesWeekly.totals[i] != null;
			if (hasData) {
				activeWeekIdx = i;
				break;
			}
		}
	}

	if (activeWeekIdx === -1) {
		for (let i = n - 1; i >= 0; i--) {
			const hasData =
				p.weekly.marketing.reach[i] != null ||
				p.weekly.marketing.frequency[i] != null ||
				p.weekly.marketing.views[i] != null ||
				p.weekly.followers[i] != null ||
				p.funnelWeekly.scheduled[i] != null ||
				p.funnelWeekly.attendance[i] != null ||
				p.funnelWeekly.closings[i] != null ||
				p.salesWeekly.totals[i] != null;
			if (hasData) {
				activeWeekIdx = i;
				break;
			}
		}
	}

	if (activeWeekIdx === -1 || activeWeekIdx >= n) {
		activeWeekIdx = 0;
	}
	return activeWeekIdx;
}

type Props = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KpisPage({ searchParams }: Props) {
	const sp = searchParams ? await searchParams : {};
	const data = await getKpiPageData();
	const smPrimaryShort = data.salesMarketingDashboard.primaryPeriodLabel;

	// Determine active week header
	const smPayload = data.salesMarketingDashboard.payload;
	let activeWeekHeader = "S1";
	if (smPayload && smPayload.weekly) {
		const defaultIdx = getDefaultActiveWeekIdx(smPayload, data.salesMarketingDashboard);
		const defaultWeek = smPayload.weekly.weekHeaders[defaultIdx] || "S1";
		
		const spWeek = typeof sp.week === "string" ? sp.week : undefined;
		activeWeekHeader = spWeek && smPayload.weekly.weekHeaders.includes(spWeek)
			? spWeek
			: defaultWeek;
	}

	// Filter weekly insights for the selected week
	const rawWeeklyInsights = data.insights.sales_marketing_weekly ?? [];
	const weeklyInsights = rawWeeklyInsights.filter(
		(item) => item.meta_json?.week_header === activeWeekHeader
	);

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<div className={styles.headerTop}>
					<DashboardHeader gymName={data.gymName} />
					<MonthSelector monthLabel={data.currentMonthLabel} />
				</div>
			</header>

			<SectionCard
				title="Visão geral"
				color="green"
				iconShort="VG"
				badge={data.currentPeriodLabel}
			>
				<VisaoGeralCardGrid data={data} />
				<SectionInsights
					variant="overview"
					items={data.insights.overview ?? []}
					periodId={data.kpiDataPeriod}
				/>
			</SectionCard>

			<SectionCard
				title="Vendas e marketing"
				color="blue"
				iconShort="VM"
				badge={smPrimaryShort}
			>
				<VendasMarketingCardGrid data={data} />
				<SectionInsights
					variant="sales_marketing"
					items={data.insights.sales_marketing ?? []}
					periodId={data.kpiDataPeriod}
				/>
				{data.salesMarketingDashboard.payload ? (
					<VendasMarketingCharts
						dashboard={data.salesMarketingDashboard}
						leadsGenerated={data.current["leads_generated"] ?? null}
						salesTotal={data.current["sales_total"] ?? null}
						monthlyMarketing={{
							reach: data.current["marketing_reach"] ?? null,
							frequency: data.current["marketing_frequency"] ?? null,
							views: data.current["marketing_views"] ?? null,
							followers: data.current["marketing_followers"] ?? null,
						}}
						previousMonthlyMarketing={{
							reach: data.previous["marketing_reach"] ?? null,
							frequency: data.previous["marketing_frequency"] ?? null,
							views: data.previous["marketing_views"] ?? null,
							followers: data.previous["marketing_followers"] ?? null,
						}}
						weeklyInsights={weeklyInsights}
						weeklyPeriodId={data.smPrimaryPeriod}
						activeWeekHeader={activeWeekHeader}
					/>
				) : null}
			</SectionCard>

			<SectionCard
				title="Retenção"
				color="orange"
				iconShort="R"
				badge={data.currentPeriodLabel}
			>
				<RetencaoCardGrid data={data} />
				<SectionInsights
					variant="retention"
					items={data.insights.retention ?? []}
					periodId={data.kpiDataPeriod}
				/>
				<RetencaoCharts charts={data.retentionCharts} />
			</SectionCard>

			<SectionCard
				title="Financeiro"
				color="purple"
				iconShort="F"
				badge={data.currentPeriodLabel}
			>
				<FinanceiroCardGrid data={data} />
				<SectionInsights
					variant="finance"
					items={data.insights.finance ?? []}
					periodId={data.kpiDataPeriod}
				/>
				<FinanceiroCharts charts={data.financeCharts} />
			</SectionCard>

			<SectionCard
				title="Previsão de resultado"
				color="pink"
				iconShort="P"
				badge={
					data.nextMonthForecast.hasData
						? `Próximo: ${data.nextMonthForecast.nextPeriodLabel}`
						: data.currentPeriodLabel
				}
			>
				<SectionInsights
					variant="forecast"
					items={data.insights.forecast ?? []}
					periodId={data.kpiDataPeriod}
				/>
				{data.nextMonthForecast.hasData ? (
					<Projecao forecast={data.nextMonthForecast} />
				) : (
					<p className={styles.subtitle}>
						Dados insuficientes para montar a projeção do mês seguinte.
					</p>
				)}
			</SectionCard>

			<SectionCard
				title="Retorno do investimento"
				color="brown"
				iconShort="RI"
				badge="Desde Jul/24"
			>
				<RoiCardGrid data={data} />
				<SectionInsights
					variant="roi"
					items={data.insights.roi ?? []}
					periodId={data.kpiDataPeriod}
				/>
				<RoiCharts charts={data.roiCharts} />
			</SectionCard>

			{data.featureOfMonth && (
				<section className={styles.sectionPlain}>
					<div className={styles.feature}>
						<h2>{data.featureOfMonth.title}</h2>
						<p>{data.featureOfMonth.description}</p>
						{data.featureOfMonth.status ? (
							<p className={styles.featureMeta}>
								Status: {data.featureOfMonth.status}
							</p>
						) : null}
						<div className={styles.impactList}>
							{Object.entries(data.featureOfMonth.impact).map(([key, value]) => (
								<span key={key}>
									{key}: {value}
								</span>
							))}
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
