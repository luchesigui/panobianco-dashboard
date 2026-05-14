import { formatDeltaPill } from "@/lib/kpis/format";
import styles from "../../page.module.css";

export type DeltaParts = {
	pill: string | null;
	tail: string;
	pillClass: string;
};

export type DeltaOptions = {
	deltaPctDisplay?: number;
	invertColors?: boolean;
	/** Reference-style whole % (+9% vs +8,9%). */
	pctAsInteger?: boolean;
};

export function renderDelta(
	current?: number,
	previous?: number,
	vsLabel?: string,
	options?: DeltaOptions,
): DeltaParts {
	const up = options?.invertColors ? styles.deltaDown : styles.deltaUp;
	const down = options?.invertColors ? styles.deltaUp : styles.deltaDown;
	const intPct = options?.pctAsInteger === true;
	if (options?.deltaPctDisplay != null) {
		const pct = options.deltaPctDisplay;
		const pill = formatDeltaPill(pct, intPct);
		const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
		if (pct > 0) return { pill, tail, pillClass: up };
		if (pct < 0) return { pill, tail, pillClass: down };
		return { pill: "0%", tail, pillClass: styles.deltaNeutral };
	}
	if (current == null || previous == null || previous === 0) {
		return {
			pill: null,
			tail: "Sem comparativo",
			pillClass: styles.deltaNeutral,
		};
	}
	const pct = ((current - previous) / Math.abs(previous)) * 100;
	const pill = formatDeltaPill(pct, intPct);
	const tail = vsLabel ? ` vs ${vsLabel}` : " vs período anterior";
	if (pct > 0) return { pill, tail, pillClass: up };
	if (pct < 0) return { pill, tail, pillClass: down };
	return { pill: "0%", tail, pillClass: styles.deltaNeutral };
}
