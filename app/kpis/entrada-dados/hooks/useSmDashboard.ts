"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Consultora } from "@/app/kpis/configuracoes/actions";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { saveSmDashboardAction } from "../actions";
import {
	assembleSmPayload,
	buildWeeklyStrings,
	compFromPayload,
	funnelToState,
	recepMonthFromConsultoras,
	recepRowsFromConsultoras,
} from "../lib/payloads";
import type {
	FunnelState,
	RecepMonthRow,
	RecepWeekRow,
	WeeklyStrings,
} from "../lib/types";

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

export function useSmDashboard({
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
	const [comp] = useState(() => compFromPayload(initialSmPayload));
	const [recepMonth, setRecepMonth] = useState<RecepMonthRow[]>(() =>
		recepMonthFromConsultoras(initialConsultoras, initialSmPayload),
	);
	const [recLabel] = useState(
		() => initialSmPayload.receptionistsPeriodLabel ?? "",
	);
	const [weeklyStr, setWeeklyStr] = useState<WeeklyStrings>(() =>
		buildWeeklyStrings(initialSmPayload),
	);
	const [recepWeekRows, setRecepWeekRows] = useState<RecepWeekRow[]>(() =>
		recepRowsFromConsultoras(initialConsultoras, initialSmPayload),
	);

	const weekHeaders = smPayload.weekly.weekHeaders;
	const nWeeks = weekHeaders.length;
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
				prev.map((rw) => {
					if (rw.id !== rowId) return rw;
					const wk = [...rw[type]];
					wk[weekIdx] = value;
					return { ...rw, [type]: wk };
				}),
			);
		},
		[],
	);

	const applyConversion = useCallback((json: Record<string, unknown>) => {
		const byRecep = Array.isArray(json.byReceptionist)
			? (json.byReceptionist as { name: string; leads: number; sales: number }[])
			: [];

		setRecepMonth((prev) => {
			return prev.map((row) => {
				const rowFirstName = row.name.trim().split(/\s+/)[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
				const matched = byRecep.find((r) => {
					const rFirstName = r.name.trim().split(/\s+/)[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
					return rFirstName === rowFirstName;
				});
				if (matched) {
					return {
						...row,
						leads: String(matched.leads),
						sales: String(matched.sales),
					};
				}
				return row;
			});
		});

		if (typeof json.totalSales === "number") {
			setFunnel((prev) => ({
				...prev,
				closings: { value: String(json.totalSales) },
			}));
		}
	}, []);

	const applyWeeklyConversion = useCallback(
		(json: Record<string, unknown>) => {
			const byRecep = Array.isArray(json.byReceptionist)
				? (json.byReceptionist as { name: string; leads: number; sales: number }[])
				: [];

			let targetWeekIdx = 0;
			const n = weekHeaders.length;
			for (let w = 0; w < n; w++) {
				const hasData = recepWeekRows.some((r) => {
					const l = r.leads[w];
					const s = r.sales[w];
					return (
						(l && l !== "0" && l.trim() !== "") ||
						(s && s !== "0" && s.trim() !== "")
					);
				});
				if (!hasData) {
					targetWeekIdx = w;
					break;
				}
			}

			setRecepWeekRows((prev) => {
				return prev.map((row) => {
					const rowFirstName =
						row.name
							.trim()
							.split(/\s+/)[0]
							?.toLowerCase()
							.normalize("NFD")
							.replace(/[\u0300-\u036f]/g, "") || "";
					const matched = byRecep.find((r) => {
						const rFirstName =
							r.name
								.trim()
								.split(/\s+/)[0]
								?.toLowerCase()
								.normalize("NFD")
								.replace(/[\u0300-\u036f]/g, "") || "";
						return rFirstName === rowFirstName;
					});
					if (matched) {
						const newLeads = [...row.leads];
						newLeads[targetWeekIdx] = String(matched.leads);
						const newSales = [...row.sales];
						newSales[targetWeekIdx] = String(matched.sales);
						return {
							...row,
							leads: newLeads,
							sales: newSales,
						};
					}
					return row;
				});
			});

			setWeeklyStr((prev) => {
				const newLeadsTot = [...prev.leadsTot];
				if (typeof json.totalLeads === "number") {
					newLeadsTot[targetWeekIdx] = String(json.totalLeads);
				}
				const newSalesTot = [...prev.salesTot];
				if (typeof json.totalSales === "number") {
					newSalesTot[targetWeekIdx] = String(json.totalSales);
				}
				const newClo = [...prev.clo];
				if (
					!newClo[targetWeekIdx] ||
					newClo[targetWeekIdx] === "0" ||
					newClo[targetWeekIdx].trim() === ""
				) {
					if (typeof json.totalSales === "number") {
						newClo[targetWeekIdx] = String(json.totalSales);
					}
				}
				return {
					...prev,
					leadsTot: newLeadsTot,
					salesTot: newSalesTot,
					clo: newClo,
				};
			});

			return targetWeekIdx;
		},
		[weekHeaders, recepWeekRows],
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
				recLabel,
				comp,
				monthlyMarketing,
			);
			const res = await saveSmDashboardAction({
				gymSlug,
				periodId,
				payload: assembled,
			});
			if (res.ok) {
				onOk("Payload vendas/marketing gravado.");
				router.refresh();
				return true;
			}
			onErr(res.error);
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
		recLabel,
		comp,
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
		nWeeks,
		smGridTotalRows,
		saving,
		handleSaveSm,
		applyConversion,
		applyWeeklyConversion,
	};
}

export type UseSmDashboard = ReturnType<typeof useSmDashboard>;
