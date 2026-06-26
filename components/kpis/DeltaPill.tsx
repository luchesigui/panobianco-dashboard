import { clsx } from "clsx";
import { formatDeltaPill } from "@/lib/kpis/format";
import styles from "@/app/kpis/page.module.css";

type Props = {
	deltaPct: number | null;
	overrideDeltaPct?: number | null;
	vsLabel?: string;
	invert?: boolean;
	integerPct?: boolean;
};

export function DeltaPill({
	deltaPct,
	overrideDeltaPct,
	vsLabel,
	invert = false,
	integerPct = false,
}: Props) {
	const pct = overrideDeltaPct ?? deltaPct;
	if (pct == null) return null;

	const label = formatDeltaPill(pct, integerPct);
	const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
	const isGood = invert ? pct < 0 : pct > 0;

	const cls = clsx(styles.kpiDelta, {
		[styles.deltaUp]: pct !== 0 && isGood,
		[styles.deltaDown]: pct !== 0 && !isGood,
		[styles.deltaNeutral]: pct === 0,
	});

	return (
		<div className={styles.kpiSub}>
			<span className={cls}>
				{label}
				{tail}
			</span>
		</div>
	);
}
