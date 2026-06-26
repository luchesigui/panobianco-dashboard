import { computeDeltaPct } from "@/lib/kpis/format";
import type { OverviewKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getOverviewKpis({ current, previous, currentMeta }: Input): OverviewKpis {
	const baseStudentsMeta = currentMeta["base_students_end"];
	const salesTotalMeta = currentMeta["sales_total"];
	const operationalResultMeta = currentMeta["operational_result"];

	const baseStudentsValue = (current["base_students_end"] as number | undefined) ?? null;
	const baseStudentsPreviousValue = (previous["base_students_end"] as number | undefined) ?? null;

	const salesTotalValue = (current["sales_total"] as number | undefined) ?? null;
	const salesTotalPreviousValue = (previous["sales_total"] as number | undefined) ?? null;

	const revenueTotalValue = (current["revenue_total"] as number | undefined) ?? null;
	const revenueTotalPreviousValue = (previous["revenue_total"] as number | undefined) ?? null;

	const expensesTotalValue = (current["expenses_total"] as number | undefined) ?? null;
	const expensesTotalPreviousValue = (previous["expenses_total"] as number | undefined) ?? null;

	const operationalResultValue =
		revenueTotalValue != null && expensesTotalValue != null
			? revenueTotalValue - expensesTotalValue
			: null;
	const operationalResultPreviousValue =
		revenueTotalPreviousValue != null && expensesTotalPreviousValue != null
			? revenueTotalPreviousValue - expensesTotalPreviousValue
			: null;

	const marginPercent =
		revenueTotalValue != null && revenueTotalValue > 0 && operationalResultValue != null
			? Math.round((operationalResultValue / revenueTotalValue) * 1000) / 10
			: null;

	const baseStudentsGoal = (current["base_students_goal"] as number | undefined) ?? null;

	return {
		baseStudents: {
			value: baseStudentsValue,
			previous: baseStudentsPreviousValue,
			deltaPct: computeDeltaPct(baseStudentsValue ?? undefined, baseStudentsPreviousValue ?? undefined),
			goal: baseStudentsGoal,
			isPartial: baseStudentsMeta?.partial === true,
		},
		salesTotal: {
			value: salesTotalValue,
			previous: salesTotalPreviousValue,
			deltaPct: computeDeltaPct(salesTotalValue ?? undefined, salesTotalPreviousValue ?? undefined),
			goal: typeof salesTotalMeta?.goal === "number" ? salesTotalMeta.goal : null,
		},
		revenueTotal: {
			value: revenueTotalValue,
			previous: revenueTotalPreviousValue,
			deltaPct: computeDeltaPct(revenueTotalValue ?? undefined, revenueTotalPreviousValue ?? undefined),
		},
		operationalResult: {
			value: operationalResultValue,
			previous: operationalResultPreviousValue,
			deltaPct: computeDeltaPct(operationalResultValue ?? undefined, operationalResultPreviousValue ?? undefined),
			marginPercent,
			isRecord: operationalResultMeta?.record === true,
		},
	};
}
