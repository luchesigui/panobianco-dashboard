import type { Consultora } from "@/app/kpis/configuracoes/actions";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";
import { numRowToStrings, parsePtBrNumber, stringsToNumRow } from "./parsers";
import type {
	FunnelState,
	RecepMonthRow,
	RecepWeekRow,
	SalesComposition,
	WeeklyStrings,
} from "./types";
import { newRowId } from "./uuid";

export function buildWeeklyStrings(
	p: SalesMarketingDashboardPayload,
): WeeklyStrings {
	const n = p.weekly.weekHeaders.length;
	const w = p.weekly;
	return {
		reach: numRowToStrings(w.marketing.reach, n),
		frequency: numRowToStrings(w.marketing.frequency, n),
		views: numRowToStrings(w.marketing.views, n),
		followers: numRowToStrings(w.marketing.followers, n),
		sch: numRowToStrings(w.funnelWeekly.scheduled, n),
		att: numRowToStrings(w.funnelWeekly.attendance, n),
		clo: numRowToStrings(w.funnelWeekly.closings, n),
		salesTot: numRowToStrings(w.salesWeekly.totals, n),
	};
}

export function recepRowsFromConsultoras(
	consultoras: Consultora[],
	p: SalesMarketingDashboardPayload,
): RecepWeekRow[] {
	const n = p.weekly.weekHeaders.length;
	const saved = p.weekly.salesWeekly.byReceptionist ?? [];
	const savedByName = new Map(saved.map((r) => [r.name, r]));
	return consultoras.map((c) => {
		const match = savedByName.get(c.name);
		return {
			id: newRowId(),
			name: c.name,
			weeks: match
				? numRowToStrings(match.salesByWeek, n)
				: Array.from({ length: n }, () => ""),
		};
	});
}

export function funnelToState(p: SalesMarketingDashboardPayload): FunnelState {
	const f = p.funnel;
	return {
		scheduled: { value: String(f.scheduled.value) },
		present: { value: String(f.present.value) },
		closings: { value: String(f.closings.value) },
	};
}

export function recepMonthFromConsultoras(
	consultoras: Consultora[],
	p: SalesMarketingDashboardPayload,
): RecepMonthRow[] {
	const savedByName = new Map(p.receptionists.map((r) => [r.name, r]));
	return consultoras.map((c) => {
		const match = savedByName.get(c.name);
		return {
			id: newRowId(),
			name: c.name,
			leads: match ? String(match.leads) : "",
			sales: match ? String(match.sales) : "",
			goal: match
				? String(match.goal)
				: c.monthly_goal != null
					? String(c.monthly_goal)
					: "",
			badge: match?.badge ?? "",
		};
	});
}

export function compFromPayload(
	p: SalesMarketingDashboardPayload,
): SalesComposition {
	const c = p.salesComposition;
	return {
		expV: c ? String(c.experimental.value) : "",
		expS: c?.experimental.subtext ?? "",
		othV: c ? String(c.otherChannels.value) : "",
		othS: c?.otherChannels.subtext ?? "",
	};
}

export function assembleSmPayload(
	base: SalesMarketingDashboardPayload,
	funnel: FunnelState,
	weeklyStr: WeeklyStrings,
	recepRows: RecepWeekRow[],
	recepMonth: RecepMonthRow[],
	recLabel: string,
	comp: SalesComposition,
	monthlyMarketing?: {
		reach?: number;
		frequency?: number;
		views?: number;
		followers?: number;
	},
): SalesMarketingDashboardPayload {
	const out: SalesMarketingDashboardPayload = structuredClone(base);
	const sch = parsePtBrNumber(funnel.scheduled.value) ?? 0;
	const pres = parsePtBrNumber(funnel.present.value) ?? 0;
	const clo = parsePtBrNumber(funnel.closings.value) ?? 0;
	const conv = sch > 0 ? Math.round((clo / sch) * 100 * 10) / 10 : 0;
	out.funnel.scheduled = { value: sch, subtext: "—" };
	out.funnel.present = { value: pres, subtext: "—" };
	out.funnel.closings = { value: clo, subtext: "—" };
	out.funnel.conversion = { value: conv, subtext: "—", isPercent: true };

	const ev = parsePtBrNumber(comp.expV) ?? 0;
	const ov = parsePtBrNumber(comp.othV) ?? 0;
	if (ev > 0 || ov > 0) {
		out.salesComposition = {
			sectionTitle: "Composição das vendas",
			experimental: {
				title: "Via aula experimental",
				value: ev,
				subtext: comp.expS || "—",
			},
			otherChannels: {
				title: "Outros canais",
				value: ov,
				subtext: comp.othS || "—",
			},
		};
	} else {
		delete out.salesComposition;
	}

	out.receptionists = recepMonth
		.filter((r) => r.name.trim() !== "")
		.map((r) => {
			const leads = parsePtBrNumber(r.leads) ?? 0;
			const sales = parsePtBrNumber(r.sales) ?? 0;
			const conversion_pct =
				leads > 0 ? Math.round((sales / leads) * 100 * 10) / 10 : 0;
			return {
				name: r.name.trim(),
				leads,
				sales,
				goal: parsePtBrNumber(r.goal) ?? 0,
				conversion_pct,
				badge: r.badge.trim() || undefined,
			};
		});
	out.receptionistsPeriodLabel = recLabel.trim() || undefined;

	const n = out.weekly.weekHeaders.length;
	out.weekly.marketing.reach = stringsToNumRow(weeklyStr.reach);
	out.weekly.marketing.frequency = stringsToNumRow(weeklyStr.frequency);
	out.weekly.marketing.views = stringsToNumRow(weeklyStr.views);
	out.weekly.marketing.followers = stringsToNumRow(weeklyStr.followers);
	out.weekly.funnelWeekly.scheduled = stringsToNumRow(weeklyStr.sch);
	out.weekly.funnelWeekly.attendance = stringsToNumRow(weeklyStr.att);
	out.weekly.funnelWeekly.closings = stringsToNumRow(weeklyStr.clo);
	out.weekly.salesWeekly.totals = stringsToNumRow(weeklyStr.salesTot);
	out.weekly.salesWeekly.byReceptionist = recepRows
		.filter((r) => r.name.trim() !== "")
		.map((r) => {
			const salesByWeek = stringsToNumRow(r.weeks.slice(0, n));
			while (salesByWeek.length < n) salesByWeek.push(null);
			return {
				name: r.name.trim(),
				salesByWeek,
				rowTotal: 0,
			};
		});
	recomputeWeeklyTotals(out.weekly);
	if (monthlyMarketing) {
		const t = out.weekly.marketing.totals;
		if (monthlyMarketing.reach != null) t.reach = monthlyMarketing.reach;
		if (monthlyMarketing.frequency != null)
			t.frequency = monthlyMarketing.frequency;
		if (monthlyMarketing.views != null) t.views = monthlyMarketing.views;
		if (monthlyMarketing.followers != null)
			t.followers = monthlyMarketing.followers;
	}
	return out;
}
