import { computeDeltaPct } from "@/lib/kpis/format";
import type { RetentionKpis } from "../types";

type Input = {
	current: Record<string, number>;
	previous: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

export function getRetentionKpis({ current, previous, currentMeta }: Input): RetentionKpis {
	const getValue = (map: Record<string, number>, key: string) =>
		(map[key] as number | undefined) ?? null;

	const baseStudentsMeta = currentMeta["base_students_end"] ?? {};
	const openDefaultMeta = currentMeta["open_default_count"] ?? {};

	const openDefaultCount = getValue(current, "open_default_count");
	const openDefaultValue = getValue(current, "open_default_value");
	const recoveredDefaultCount = getValue(current, "recovered_default_count") ?? 0;

	const cancelledCount =
		typeof openDefaultMeta.cancelled_count === "number" ? openDefaultMeta.cancelled_count : 0;
	const totalMonthRecords =
		typeof openDefaultMeta.month_total_records === "number"
			? openDefaultMeta.month_total_records
			: Math.round((openDefaultCount ?? 0) + recoveredDefaultCount + cancelledCount);

	const recoveryRatePct =
		typeof openDefaultMeta.recovery_rate_pct === "number"
			? openDefaultMeta.recovery_rate_pct
			: totalMonthRecords > 0
				? Math.round((recoveredDefaultCount / totalMonthRecords) * 100)
				: null;

	const recovery3dPill =
		typeof openDefaultMeta.recovery_3d_pill === "string" ? openDefaultMeta.recovery_3d_pill : null;

	const cancellationsCount = getValue(current, "monthly_cancellations");
	const nonRenewedCount = getValue(current, "monthly_non_renewed");
	const renewedCount = getValue(current, "monthly_renewed");

	const previousCancellationsCount = getValue(previous, "monthly_cancellations");
	const previousNonRenewedCount = getValue(previous, "monthly_non_renewed");
	const previousExitsCount = getValue(previous, "monthly_exits");

	const currentExitsCount =
		cancellationsCount != null || nonRenewedCount != null
			? (cancellationsCount ?? 0) + (nonRenewedCount ?? 0)
			: getValue(current, "monthly_exits");

	const previousExitsTotalCount =
		previousCancellationsCount != null || previousNonRenewedCount != null
			? (previousCancellationsCount ?? 0) + (previousNonRenewedCount ?? 0)
			: previousExitsCount;

	const renewalRatePct =
		renewedCount != null && nonRenewedCount != null
			? (() => {
					const total = renewedCount + nonRenewedCount;
					return total === 0 ? 0 : Math.round((renewedCount / total) * 1000) / 10;
				})()
			: null;

	return {
		baseStudents: {
			value: getValue(current, "base_students_end"),
			isPartial: baseStudentsMeta.partial === true,
			pendingNote:
				typeof baseStudentsMeta.pending_note === "string" ? baseStudentsMeta.pending_note : null,
		},
		openDefault: {
			count: openDefaultCount,
			value: openDefaultValue,
		},
		recoveryRate: {
			pct: recoveryRatePct,
			recovered: recoveredDefaultCount,
			total: totalMonthRecords,
			pill3d: recovery3dPill,
		},
		renewals:
			renewedCount != null
				? {
						value: renewedCount,
						nonRenewed: nonRenewedCount,
						renewalRatePct,
					}
				: null,
		exits: {
			current: currentExitsCount,
			previous: previousExitsTotalCount,
			deltaPct: computeDeltaPct(currentExitsCount ?? undefined, previousExitsTotalCount ?? undefined),
		},
	};
}
