import type { Consultora } from "@/app/kpis/configuracoes/actions";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";
import {
	numRowToStrings,
	parsePtBrNumber,
	stringsToNumRow,
} from "@/app/kpis/entrada-dados/lib/parsers";
import { newRowId } from "@/app/kpis/entrada-dados/lib/uuid";
import type {
	FunnelState,
	RecepMonthRow,
	RecepWeekRow,
	SalesComposition,
	WeeklyStrings,
} from "./types";

export function buildWeeklyStrings(
	payload: SalesMarketingDashboardPayload,
): WeeklyStrings {
	const weekCount = payload.weekly.weekHeaders.length;
	const weekly = payload.weekly;
	return {
		reach: numRowToStrings(weekly.marketing.reach, weekCount),
		frequency: numRowToStrings(weekly.marketing.frequency, weekCount),
		views: numRowToStrings(weekly.marketing.views, weekCount),
		followers: numRowToStrings(weekly.marketing.followers, weekCount),
		scheduledWeekly: numRowToStrings(weekly.funnelWeekly.scheduled, weekCount),
		attendanceWeekly: numRowToStrings(weekly.funnelWeekly.attendance, weekCount),
		closingsWeekly: numRowToStrings(weekly.funnelWeekly.closings, weekCount),
		totalLeadsWeekly: numRowToStrings(weekly.salesWeekly.leadsByWeek, weekCount),
		totalSalesWeekly: numRowToStrings(weekly.salesWeekly.totals, weekCount),
	};
}

export function recepRowsFromConsultoras(
	consultoras: Consultora[],
	payload: SalesMarketingDashboardPayload,
): RecepWeekRow[] {
	const weekCount = payload.weekly.weekHeaders.length;
	const savedByName = new Map(
		(payload.weekly.salesWeekly.byReceptionist ?? []).map((receptionist) => [
			receptionist.name,
			receptionist,
		]),
	);
	return consultoras.map((consultora) => {
		const match = savedByName.get(consultora.name);
		return {
			id: newRowId(),
			name: consultora.name,
			leads: match
				? numRowToStrings(match.leadsByWeek, weekCount)
				: Array.from({ length: weekCount }, () => ""),
			sales: match
				? numRowToStrings(match.salesByWeek, weekCount)
				: Array.from({ length: weekCount }, () => ""),
		};
	});
}

export function funnelToState(
	payload: SalesMarketingDashboardPayload,
): FunnelState {
	const funnel = payload.funnel;
	return {
		scheduled: { value: String(funnel.scheduled.value) },
		present: { value: String(funnel.present.value) },
		closings: { value: String(funnel.closings.value) },
	};
}

export function recepMonthFromConsultoras(
	consultoras: Consultora[],
	payload: SalesMarketingDashboardPayload,
): RecepMonthRow[] {
	const savedByName = new Map(
		payload.receptionists.map((receptionist) => [receptionist.name, receptionist]),
	);
	return consultoras.map((consultora) => {
		const match = savedByName.get(consultora.name);
		return {
			id: newRowId(),
			name: consultora.name,
			leads: match ? String(match.leads) : "",
			sales: match ? String(match.sales) : "",
			goal: match
				? String(match.goal)
				: consultora.monthly_goal != null
					? String(consultora.monthly_goal)
					: "",
			badge: match?.badge ?? "",
		};
	});
}

export function compFromPayload(
	payload: SalesMarketingDashboardPayload,
): SalesComposition {
	const salesComposition = payload.salesComposition;
	return {
		experimentalClassValue: salesComposition
			? String(salesComposition.experimental.value)
			: "",
		experimentalClassSubtext: salesComposition?.experimental.subtext ?? "",
		otherChannelsValue: salesComposition
			? String(salesComposition.otherChannels.value)
			: "",
		otherChannelsSubtext: salesComposition?.otherChannels.subtext ?? "",
	};
}

export function assembleSmPayload(
	base: SalesMarketingDashboardPayload,
	funnel: FunnelState,
	weeklyStr: WeeklyStrings,
	recepRows: RecepWeekRow[],
	recepMonth: RecepMonthRow[],
	receptionistsPeriodLabel: string,
	salesComposition: SalesComposition,
	monthlyMarketing?: {
		reach?: number;
		frequency?: number;
		views?: number;
		followers?: number;
	},
): SalesMarketingDashboardPayload {
	const output: SalesMarketingDashboardPayload = structuredClone(base);

	const scheduled = parsePtBrNumber(funnel.scheduled.value) ?? 0;
	const present = parsePtBrNumber(funnel.present.value) ?? 0;
	const closings = parsePtBrNumber(funnel.closings.value) ?? 0;
	const conversionRate =
		scheduled > 0 ? Math.round((closings / scheduled) * 100 * 10) / 10 : 0;
	output.funnel.scheduled = { value: scheduled, subtext: "—" };
	output.funnel.present = { value: present, subtext: "—" };
	output.funnel.closings = { value: closings, subtext: "—" };
	output.funnel.conversion = {
		value: conversionRate,
		subtext: "—",
		isPercent: true,
	};

	const experimentalValue =
		parsePtBrNumber(salesComposition.experimentalClassValue) ?? 0;
	const otherChannelsValue =
		parsePtBrNumber(salesComposition.otherChannelsValue) ?? 0;
	if (experimentalValue > 0 || otherChannelsValue > 0) {
		output.salesComposition = {
			sectionTitle: "Composição das vendas",
			experimental: {
				title: "Via aula experimental",
				value: experimentalValue,
				subtext: salesComposition.experimentalClassSubtext || "—",
			},
			otherChannels: {
				title: "Outros canais",
				value: otherChannelsValue,
				subtext: salesComposition.otherChannelsSubtext || "—",
			},
		};
	} else {
		delete output.salesComposition;
	}

	output.receptionists = recepMonth
		.filter((receptionist) => receptionist.name.trim() !== "")
		.map((receptionist) => {
			const leads = parsePtBrNumber(receptionist.leads) ?? null;
			const sales = parsePtBrNumber(receptionist.sales) ?? null;
			const conversionPct =
				leads && leads > 0 && sales != null
					? Math.round((sales / leads) * 100 * 10) / 10
					: 0;
			return {
				name: receptionist.name.trim(),
				leads,
				sales,
				goal: parsePtBrNumber(receptionist.goal) ?? 0,
				conversion_pct: conversionPct,
				badge: receptionist.badge.trim() || undefined,
			};
		});
	output.receptionistsPeriodLabel = receptionistsPeriodLabel.trim() || undefined;

	const weekCount = output.weekly.weekHeaders.length;
	output.weekly.marketing.reach = stringsToNumRow(weeklyStr.reach);
	output.weekly.marketing.frequency = stringsToNumRow(weeklyStr.frequency);
	output.weekly.marketing.views = stringsToNumRow(weeklyStr.views);
	output.weekly.marketing.followers = stringsToNumRow(weeklyStr.followers);
	output.weekly.funnelWeekly.scheduled = stringsToNumRow(
		weeklyStr.scheduledWeekly,
	);
	output.weekly.funnelWeekly.attendance = stringsToNumRow(
		weeklyStr.attendanceWeekly,
	);
	output.weekly.funnelWeekly.closings = stringsToNumRow(weeklyStr.closingsWeekly);
	output.weekly.salesWeekly.leadsByWeek = stringsToNumRow(
		weeklyStr.totalLeadsWeekly,
	);
	output.weekly.salesWeekly.totals = stringsToNumRow(weeklyStr.totalSalesWeekly);
	output.weekly.salesWeekly.byReceptionist = recepRows
		.filter((row) => row.name.trim() !== "")
		.map((row) => {
			const leadsByWeek = stringsToNumRow(row.leads.slice(0, weekCount));
			while (leadsByWeek.length < weekCount) leadsByWeek.push(null);
			const salesByWeek = stringsToNumRow(row.sales.slice(0, weekCount));
			while (salesByWeek.length < weekCount) salesByWeek.push(null);
			return {
				name: row.name.trim(),
				leadsByWeek,
				leadsTotal: 0,
				salesByWeek,
				salesTotal: 0,
			};
		});
	recomputeWeeklyTotals(output.weekly);

	const byReceptionistMap = new Map(
		(output.weekly.salesWeekly.byReceptionist ?? []).map((row) => [
			row.name,
			row,
		]),
	);
	for (const receptionist of output.receptionists) {
		const weeklyRow = byReceptionistMap.get(receptionist.name);
		if (weeklyRow) {
			if (weeklyRow.salesTotal != null) receptionist.sales = weeklyRow.salesTotal;
			if (weeklyRow.leadsTotal != null) receptionist.leads = weeklyRow.leadsTotal;
			receptionist.conversion_pct =
				receptionist.leads && receptionist.leads > 0 && receptionist.sales != null
					? Math.round((receptionist.sales / receptionist.leads) * 100 * 10) / 10
					: 0;
		}
	}

	if (monthlyMarketing) {
		const totals = output.weekly.marketing.totals;
		if (monthlyMarketing.reach != null) totals.reach = monthlyMarketing.reach;
		if (monthlyMarketing.frequency != null)
			totals.frequency = monthlyMarketing.frequency;
		if (monthlyMarketing.views != null) totals.views = monthlyMarketing.views;
		if (monthlyMarketing.followers != null)
			totals.followers = monthlyMarketing.followers;
	}
	return output;
}
