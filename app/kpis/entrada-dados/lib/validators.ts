import { parsePtBrNumber } from "./parsers";
import type { RecepWeekRow, WeeklyStrings } from "./types";

export function weekMismatchMessages(
	ws: WeeklyStrings,
	recepRows: RecepWeekRow[],
	n: number,
): string[] {
	const msgs: string[] = [];
	for (let i = 0; i < n; i++) {
		let sumR = 0;
		let any = false;
		for (const row of recepRows) {
			if (!row.name.trim()) continue;
			const v = parsePtBrNumber(row.weeks[i] ?? "");
			if (v !== undefined) {
				sumR += v;
				any = true;
			}
		}
		const agg = parsePtBrNumber(ws.salesTot[i] ?? "");
		if (any && agg !== undefined && sumR !== agg) {
			msgs.push(
				`Semana ${i + 1}: soma recepcionistas (${sumR}) ≠ vendas todos canais (${agg}).`,
			);
		}
	}
	return msgs;
}
