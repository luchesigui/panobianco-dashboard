"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Consultora } from "@/app/kpis/configuracoes/actions";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { saveSmDashboardAction } from "../actions/save-sm-dashboard";
import {
	assembleSmPayload,
	buildWeeklyStrings,
	compFromPayload,
	funnelToState,
	recepMonthFromConsultoras,
	recepRowsFromConsultoras,
} from "../payloads";
import type {
	FunnelState,
	RecepMonthRow,
	RecepWeekRow,
	WeeklyStrings,
} from "../types";

type Args = {
	initialSmPayload: SalesMarketingDashboardPayload;
	initialConsultoras: Consultora[];
	gymSlug: string;
	periodId: string;
	getMonthlyMarketing: () => {
		reach?: number;
		frequency?: number;
		views?: number;
		followers?: number;
	};
	onOk: (text: string) => void;
	onErr: (text: string) => void;
};

export function useSalesMarketingWeeklyFormSection({
	initialSmPayload,
	initialConsultoras,
	gymSlug,
	periodId,
	getMonthlyMarketing,
	onOk,
	onErr,
}: Args) {
	const router = useRouter();
	const [saving, setSaving] = useState(false);

	const [smPayload] = useState<SalesMarketingDashboardPayload>(() =>
		structuredClone(initialSmPayload),
	);
	const [funnel, setFunnel] = useState<FunnelState>(() =>
		funnelToState(initialSmPayload),
	);
	const [salesComposition] = useState(() => compFromPayload(initialSmPayload));
	const [recepMonth, setRecepMonth] = useState<RecepMonthRow[]>(() =>
		recepMonthFromConsultoras(initialConsultoras, initialSmPayload),
	);
	const [receptionistsPeriodLabel] = useState(
		() => initialSmPayload.receptionistsPeriodLabel ?? "",
	);
	const [weeklyStr, setWeeklyStr] = useState<WeeklyStrings>(() =>
		buildWeeklyStrings(initialSmPayload),
	);
	const [recepWeekRows, setRecepWeekRows] = useState<RecepWeekRow[]>(() =>
		recepRowsFromConsultoras(initialConsultoras, initialSmPayload),
	);

	const weekHeaders = smPayload.weekly.weekHeaders;
	const weekCount = weekHeaders.length;
	const smGridTotalRows = 9 + recepWeekRows.length * 2;

	const setFunnelField = useCallback(
		(key: keyof FunnelState, value: string) => {
			setFunnel((prev) => ({ ...prev, [key]: { value } }));
		},
		[],
	);

	const updateRecepMonthField = useCallback(
		(id: string, field: "leads" | "sales" | "goal", value: string) => {
			setRecepMonth((prev) =>
				prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
			);
		},
		[],
	);

	const updateMatrix = useCallback(
		(key: keyof WeeklyStrings, weekIdx: number, value: string) => {
			setWeeklyStr((prev) => {
				const row = [...prev[key]];
				row[weekIdx] = value;
				return { ...prev, [key]: row };
			});
		},
		[],
	);

	const updateRecepWeekCell = useCallback(
		(
			rowId: string,
			type: "leads" | "sales",
			weekIdx: number,
			value: string,
		) => {
			setRecepWeekRows((prev) =>
				prev.map((row) => {
					if (row.id !== rowId) return row;
					const week = [...row[type]];
					week[weekIdx] = value;
					return { ...row, [type]: week };
				}),
			);
		},
		[],
	);

	const applyConversion = useCallback((json: Record<string, unknown>) => {
		const byReceptionist = Array.isArray(json.byReceptionist)
			? (json.byReceptionist as { name: string; leads: number; sales: number }[])
			: [];

		setRecepMonth((prev) =>
			prev.map((row) => {
				const rowFirstName =
					row.name
						.trim()
						.split(/\s+/)[0]
						?.toLowerCase()
						.normalize("NFD")
						.replace(/[̀-ͯ]/g, "") ?? "";
				const matched = byReceptionist.find((receptionist) => {
					const receptionistFirstName =
						receptionist.name
							.trim()
							.split(/\s+/)[0]
							?.toLowerCase()
							.normalize("NFD")
							.replace(/[̀-ͯ]/g, "") ?? "";
					return receptionistFirstName === rowFirstName;
				});
				if (matched) {
					return {
						...row,
						leads: String(matched.leads),
						sales: String(matched.sales),
					};
				}
				return row;
			}),
		);

		if (typeof json.totalSales === "number") {
			setFunnel((prev) => ({
				...prev,
				closings: { value: String(json.totalSales) },
			}));
		}
	}, []);

	const applyWeeklyConversion = useCallback(
		(json: Record<string, unknown>) => {
			const byReceptionist = Array.isArray(json.byReceptionist)
				? (json.byReceptionist as {
						name: string;
						leads: number;
						sales: number;
					}[])
				: [];

			let targetWeekIndex = 0;
			for (let weekIdx = 0; weekIdx < weekCount; weekIdx++) {
				const hasData = recepWeekRows.some((row) => {
					const leads = row.leads[weekIdx];
					const sales = row.sales[weekIdx];
					return (
						(leads && leads !== "0" && leads.trim() !== "") ||
						(sales && sales !== "0" && sales.trim() !== "")
					);
				});
				if (!hasData) {
					targetWeekIndex = weekIdx;
					break;
				}
			}

			setRecepWeekRows((prev) =>
				prev.map((row) => {
					const rowFirstName =
						row.name
							.trim()
							.split(/\s+/)[0]
							?.toLowerCase()
							.normalize("NFD")
							.replace(/[̀-ͯ]/g, "") ?? "";
					const matched = byReceptionist.find((receptionist) => {
						const receptionistFirstName =
							receptionist.name
								.trim()
								.split(/\s+/)[0]
								?.toLowerCase()
								.normalize("NFD")
								.replace(/[̀-ͯ]/g, "") ?? "";
						return receptionistFirstName === rowFirstName;
					});
					if (matched) {
						const newLeads = [...row.leads];
						newLeads[targetWeekIndex] = String(matched.leads);
						const newSales = [...row.sales];
						newSales[targetWeekIndex] = String(matched.sales);
						return { ...row, leads: newLeads, sales: newSales };
					}
					return row;
				}),
			);

			setWeeklyStr((prev) => {
				const newTotalLeadsWeekly = [...prev.totalLeadsWeekly];
				if (typeof json.totalLeads === "number") {
					newTotalLeadsWeekly[targetWeekIndex] = String(json.totalLeads);
				}
				const newTotalSalesWeekly = [...prev.totalSalesWeekly];
				if (typeof json.totalSales === "number") {
					newTotalSalesWeekly[targetWeekIndex] = String(json.totalSales);
				}
				const newClosingsWeekly = [...prev.closingsWeekly];
				if (
					!newClosingsWeekly[targetWeekIndex] ||
					newClosingsWeekly[targetWeekIndex] === "0" ||
					newClosingsWeekly[targetWeekIndex].trim() === ""
				) {
					if (typeof json.totalSales === "number") {
						newClosingsWeekly[targetWeekIndex] = String(json.totalSales);
					}
				}
				return {
					...prev,
					totalLeadsWeekly: newTotalLeadsWeekly,
					totalSalesWeekly: newTotalSalesWeekly,
					closingsWeekly: newClosingsWeekly,
				};
			});

			return targetWeekIndex;
		},
		[weekCount, recepWeekRows],
	);

	const handleSaveSm = useCallback(async () => {
		setSaving(true);
		try {
			const monthlyMarketing = getMonthlyMarketing();
			const assembled = assembleSmPayload(
				smPayload,
				funnel,
				weeklyStr,
				recepWeekRows,
				recepMonth,
				receptionistsPeriodLabel,
				salesComposition,
				monthlyMarketing,
			);
			const result = await saveSmDashboardAction({
				gymSlug,
				periodId,
				payload: assembled,
			});
			if (result.ok) {
				onOk("Payload vendas/marketing gravado.");
				router.refresh();
				return true;
			}
			onErr(result.error);
			return false;
		} finally {
			setSaving(false);
		}
	}, [
		getMonthlyMarketing,
		smPayload,
		funnel,
		weeklyStr,
		recepWeekRows,
		recepMonth,
		receptionistsPeriodLabel,
		salesComposition,
		gymSlug,
		periodId,
		onOk,
		onErr,
		router,
	]);

	return {
		funnel,
		setFunnelField,
		recepMonth,
		updateRecepMonthField,
		weeklyStr,
		updateMatrix,
		recepWeekRows,
		updateRecepWeekCell,
		weekHeaders,
		weekCount,
		smGridTotalRows,
		saving,
		handleSaveSm,
		applyConversion,
		applyWeeklyConversion,
	};
}

export type UseSalesMarketingWeeklyFormSection = ReturnType<
	typeof useSalesMarketingWeeklyFormSection
>;
