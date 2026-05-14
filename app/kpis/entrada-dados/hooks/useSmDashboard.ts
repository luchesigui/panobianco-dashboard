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
	};
}

export type UseSmDashboard = ReturnType<typeof useSmDashboard>;
