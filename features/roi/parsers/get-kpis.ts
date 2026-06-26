import type { RoiKpis } from "../types";

type Input = {
	current: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

const cardTitle = (meta: Record<string, unknown>, fallback: string): string =>
	typeof meta.card_title === "string" ? meta.card_title : fallback;

export function getRoiKpis({ current, currentMeta }: Input): RoiKpis {
	const get = (key: string) => (current[key] as number | undefined) ?? null;
	const m = (key: string) => currentMeta[key] ?? {};

	const tiM = m("total_invested");
	const cashM = m("cash_balance");
	const recM = m("recovery_balance");
	const payM = m("roi_payback_months");

	return {
		totalInvested: {
			value: get("total_invested"),
			title: cardTitle(tiM, "Total investido (Bruno+Guilherme)"),
			subline: typeof tiM.subline === "string" ? tiM.subline : null,
			detailLine: typeof tiM.detail_line === "string" ? tiM.detail_line : null,
		},
		cashBalance: {
			value: get("cash_balance"),
			title: cardTitle(cashM, "Saldo em caixa (fluxo real)"),
			subline: typeof cashM.subline === "string" ? cashM.subline : null,
			pctPill:
				typeof cashM.pct_of_investment_pill === "string"
					? cashM.pct_of_investment_pill
					: null,
		},
		recoveryBalance: {
			value: get("recovery_balance"),
			title: cardTitle(recM, "A recuperar"),
			subline: typeof recM.subline === "string" ? recM.subline : null,
		},
		paybackMonths: {
			value: get("roi_payback_months"),
			subline: typeof payM.subline === "string" ? payM.subline : null,
			detailLine: typeof payM.detail_line === "string" ? payM.detail_line : null,
		},
	};
}
