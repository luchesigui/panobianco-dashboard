import { computeDeltaPct } from "@/lib/kpis/format";
import type { RetentionKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getRetentionKpis({ current, previous, currentMeta }: Input): RetentionKpis {
	const get = (map: Record<string, number>, key: string) =>
		(map[key] as number | undefined) ?? null;

	const baseM = currentMeta["base_students_end"] ?? {};
	const openM = currentMeta["open_default_count"] ?? {};

	const openC = get(current, "open_default_count");
	const openV = get(current, "open_default_value");
	const recC = get(current, "recovered_default_count") ?? 0;

	const cancelled = typeof openM.cancelled_count === "number" ? openM.cancelled_count : 0;
	const recordCount =
		typeof openM.month_total_records === "number"
			? openM.month_total_records
			: Math.round((openC ?? 0) + recC + cancelled);

	const recoveryPct =
		typeof openM.recovery_rate_pct === "number"
			? openM.recovery_rate_pct
			: recordCount > 0
				? Math.round((recC / recordCount) * 100)
				: null;

	const pill3d = typeof openM.recovery_3d_pill === "string" ? openM.recovery_3d_pill : null;

	const cancellations = get(current, "monthly_cancellations");
	const nonRenewed = get(current, "monthly_non_renewed");
	const renewed = get(current, "monthly_renewed");

	const prevCancellations = get(previous, "monthly_cancellations");
	const prevNonRenewed = get(previous, "monthly_non_renewed");
	const prevExits = get(previous, "monthly_exits");

	const exitsCurrentSum =
		cancellations != null || nonRenewed != null
			? (cancellations ?? 0) + (nonRenewed ?? 0)
			: get(current, "monthly_exits");

	const exitsPrevSum =
		prevCancellations != null || prevNonRenewed != null
			? (prevCancellations ?? 0) + (prevNonRenewed ?? 0)
			: prevExits;

	const renewalRatePct =
		renewed != null && nonRenewed != null
			? (() => {
					const total = renewed + nonRenewed;
					return total === 0 ? 0 : Math.round((renewed / total) * 1000) / 10;
				})()
			: null;

	return {
		baseStudents: {
			value: get(current, "base_students_end"),
			isPartial: baseM.partial === true,
			pendingNote: typeof baseM.pending_note === "string" ? baseM.pending_note : null,
		},
		openDefault: {
			count: openC,
			value: openV,
		},
		recoveryRate: {
			pct: recoveryPct,
			recovered: recC,
			total: recordCount,
			pill3d,
		},
		renewals:
			renewed != null
				? {
						value: renewed,
						nonRenewed,
						renewalRatePct,
					}
				: null,
		exits: {
			current: exitsCurrentSum,
			previous: exitsPrevSum,
			deltaPct: computeDeltaPct(exitsCurrentSum ?? undefined, exitsPrevSum ?? undefined),
		},
	};
}
