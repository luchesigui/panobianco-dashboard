import { computeDeltaPct } from "@/lib/kpis/format";
import type { OverviewKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getOverviewKpis({ current, previous, currentMeta }: Input): OverviewKpis {
	const baseStudentsMeta = currentMeta["base_students_end"];
	const salesMeta = currentMeta["sales_total"];
	const opResultMeta = currentMeta["operational_result"];

	const baseStudentsValue = (current["base_students_end"] as number | undefined) ?? null;
	const baseStudentsPrev = (previous["base_students_end"] as number | undefined) ?? null;

	const salesValue = (current["sales_total"] as number | undefined) ?? null;
	const salesPrev = (previous["sales_total"] as number | undefined) ?? null;

	const revenue = (current["revenue_total"] as number | undefined) ?? null;
	const revenuePrev = (previous["revenue_total"] as number | undefined) ?? null;

	const expenses = (current["expenses_total"] as number | undefined) ?? null;
	const expensesPrev = (previous["expenses_total"] as number | undefined) ?? null;
	const opResult = revenue != null && expenses != null ? revenue - expenses : null;
	const opResultPrev =
		revenuePrev != null && expensesPrev != null ? revenuePrev - expensesPrev : null;

	const marginPercent =
		revenue != null && revenue > 0 && opResult != null
			? Math.round((opResult / revenue) * 1000) / 10
			: null;

	const baseStudentsGoal = (current["base_students_goal"] as number | undefined) ?? null;

	return {
		baseStudents: {
			value: baseStudentsValue,
			previous: baseStudentsPrev,
			deltaPct: computeDeltaPct(baseStudentsValue ?? undefined, baseStudentsPrev ?? undefined),
			goal: baseStudentsGoal,
			isPartial: baseStudentsMeta?.partial === true,
		},
		salesTotal: {
			value: salesValue,
			previous: salesPrev,
			deltaPct: computeDeltaPct(salesValue ?? undefined, salesPrev ?? undefined),
			goal: typeof salesMeta?.goal === "number" ? salesMeta.goal : null,
		},
		revenueTotal: {
			value: revenue,
			previous: revenuePrev,
			deltaPct: computeDeltaPct(revenue ?? undefined, revenuePrev ?? undefined),
		},
		operationalResult: {
			value: opResult,
			previous: opResultPrev,
			deltaPct: computeDeltaPct(opResult ?? undefined, opResultPrev ?? undefined),
			marginPercent,
			isRecord: opResultMeta?.record === true,
		},
	};
}
