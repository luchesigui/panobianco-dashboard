"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	KPI_FORM_GROUPS,
	type KpiFormField,
} from "@/lib/data/dashboard-input-requirements";
import { mapRevenueGroupsToCodes } from "@/lib/data/revenue-mapping";
import { slugifyExpenseCode } from "@/lib/data/expense-mapping";
import { saveMonthlyKpisAction } from "../actions";
import { titleFromExpenseCode } from "../lib/expense";
import { parsePtBrNumber } from "../lib/parsers";

type Args = {
	initialKpiValues: Record<string, number>;
	initialMetaByCode: Record<string, Record<string, unknown>>;
	gymSlug: string;
	periodId: string;
	onOk: (text: string) => void;
	onErr: (text: string) => void;
};

function fieldToInputKey(f: KpiFormField): string {
	return f.code;
}

export function useKpiForm({
	initialKpiValues,
	initialMetaByCode,
	gymSlug,
	periodId,
	onOk,
	onErr,
}: Args) {
	const router = useRouter();
	const [saving, setSaving] = useState(false);

	const [kpiInputs, setKpiInputs] = useState<Record<string, string>>(() => {
		const o: Record<string, string> = {};
		for (const g of KPI_FORM_GROUPS) {
			for (const f of g.fields) {
				const k = fieldToInputKey(f);
				const v = initialKpiValues[f.code];
				o[k] = v === undefined ? "" : String(v);
			}
		}
		return o;
	});

	const metaJson = useMemo(
		() =>
			Object.keys(initialMetaByCode).length
				? JSON.stringify(initialMetaByCode, null, 2)
				: "",
		[initialMetaByCode],
	);

	const [recebimentosBreakdown, setRecebimentosBreakdown] = useState<
		Record<string, number>
	>(() => {
		const raw = initialMetaByCode["revenue_total"]?.breakdown;
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
		return Object.fromEntries(
			Object.entries(raw).map(([k, v]) => [k, typeof v === "number" ? v : 0]),
		);
	});

	const [custosBreakdown, setCustosBreakdown] = useState<
		Record<string, number>
	>(() =>
		Object.fromEntries(
			Object.entries(initialKpiValues)
				.filter(([code]) => code.startsWith("expense_"))
				.map(([code, value]) => [code, value]),
		),
	);

	const retentionGroup =
		KPI_FORM_GROUPS.find((group) => group.id === "retention") ?? null;
	const hasSavedRetentionValues = retentionGroup
		? retentionGroup.fields.some((field) => {
				const value = kpiInputs[fieldToInputKey(field)] ?? "";
				return value.trim() !== "";
			})
		: false;
	const [hasUploadedCrescimento, setHasUploadedCrescimento] = useState(
		hasSavedRetentionValues,
	);

	const hasRecebimentosBreakdown =
		Object.keys(recebimentosBreakdown).length > 0;

	const expenseEntries = useMemo(
		() =>
			Object.entries(custosBreakdown)
				.map(([code, value]) => ({
					code,
					label: titleFromExpenseCode(code),
					value,
				}))
				.sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
		[custosBreakdown],
	);

	const setKpiInput = useCallback((key: string, value: string) => {
		setKpiInputs((prev) => ({ ...prev, [key]: value }));
	}, []);

	const updateExpense = useCallback((code: string, value: number) => {
		setCustosBreakdown((prev) => ({ ...prev, [code]: value }));
	}, []);

	const applyCrescimento = useCallback((json: Record<string, unknown>) => {
		const updates: Record<string, string> = {
			base_students_end: String(Number(json.base_students_end ?? 0)),
			sales_total: String(Number(json.sales_total ?? 0)),
			monthly_cancellations: String(Number(json.monthly_cancellations ?? 0)),
			monthly_non_renewed: String(Number(json.monthly_non_renewed ?? 0)),
		};
		setKpiInputs((prev) => ({ ...prev, ...updates }));
		setHasUploadedCrescimento(true);
	}, []);

	const applyRecebimentos = useCallback((json: Record<string, unknown>) => {
		const groups =
			json.groups &&
			typeof json.groups === "object" &&
			!Array.isArray(json.groups)
				? (json.groups as Record<string, number>)
				: {};
		setRecebimentosBreakdown(groups);
		const mapped = mapRevenueGroupsToCodes(groups);
		setKpiInputs((prev) => ({
			...prev,
			matriculated_revenue: String(mapped.matriculated_revenue),
			wellhub_revenue: String(mapped.wellhub_revenue),
			totalpass_revenue: String(mapped.totalpass_revenue),
			products_revenue: String(mapped.products_revenue),
		}));
	}, []);

	const applyCustos = useCallback((json: Record<string, unknown>) => {
		const items =
			json.items &&
			typeof json.items === "object" &&
			!Array.isArray(json.items)
				? (json.items as Record<string, number>)
				: {};
		const parsed = Object.fromEntries(
			Object.entries(items).map(([label, value]) => [
				slugifyExpenseCode(label),
				Number(value ?? 0),
			]),
		);
		setCustosBreakdown(parsed);
	}, []);

	const handleSaveKpis = useCallback(async () => {
		setSaving(true);
		try {
			const values: Record<string, number> = {};
			for (const g of KPI_FORM_GROUPS) {
				for (const f of g.fields) {
					const k = fieldToInputKey(f);
					const num = parsePtBrNumber(kpiInputs[k] ?? "");
					values[f.code] = num ?? 0;
				}
			}
			const expenseItems = structuredClone(custosBreakdown);
			const expensesTotal =
				Object.keys(expenseItems).length > 0
					? Object.values(expenseItems).reduce(
							(acc, v) => acc + (Number.isFinite(v) ? v : 0),
							0,
						)
					: (values["expenses_total"] ?? 0);
			values["expenses_total"] = expensesTotal;

			if (Object.keys(recebimentosBreakdown).length > 0) {
				const revenueFromGroups = mapRevenueGroupsToCodes(recebimentosBreakdown);
				values["matriculated_revenue"] = revenueFromGroups.matriculated_revenue;
				values["products_revenue"] = revenueFromGroups.products_revenue;
			}
			const revenueTotal =
				(values["matriculated_revenue"] ?? 0) +
				(values["wellhub_revenue"] ?? 0) +
				(values["totalpass_revenue"] ?? 0) +
				(values["products_revenue"] ?? 0);
			values["revenue_total"] = revenueTotal;

			let metaByCode: Record<string, Record<string, unknown>> | undefined;
			if (metaJson.trim()) {
				try {
					const parsed = JSON.parse(metaJson) as unknown;
					if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
						metaByCode = parsed as Record<string, Record<string, unknown>>;
					} else throw new Error("JSON deve ser um objeto.");
				} catch {
					onErr("Metadados JSON inválido.");
					return false;
				}
			}
			metaByCode = metaByCode ?? {};
			if (Object.keys(recebimentosBreakdown).length > 0) {
				metaByCode["revenue_total"] = { breakdown: recebimentosBreakdown };
			}
			const res = await saveMonthlyKpisAction({
				gymSlug,
				periodId,
				values,
				expenseItems:
					Object.keys(expenseItems).length > 0 ? expenseItems : undefined,
				metaByCode,
			});
			if (res.ok) {
				onOk("KPIs mensais gravados.");
				router.refresh();
				return true;
			}
			onErr(res.error);
			return false;
		} finally {
			setSaving(false);
		}
	}, [
		kpiInputs,
		custosBreakdown,
		recebimentosBreakdown,
		metaJson,
		gymSlug,
		periodId,
		onOk,
		onErr,
		router,
	]);

	return {
		kpiInputs,
		setKpiInput,
		recebimentosBreakdown,
		custosBreakdown,
		updateExpense,
		hasRecebimentosBreakdown,
		hasUploadedCrescimento,
		expenseEntries,
		retentionGroup,
		saving,
		applyCrescimento,
		applyRecebimentos,
		applyCustos,
		handleSaveKpis,
	};
}

export type UseKpiForm = ReturnType<typeof useKpiForm>;
