import type { RoiKpis } from "../types";

type Input = {
	current: Record<string, number>;
	currentMeta: Record<string, Record<string, unknown>>;
};

const cardTitle = (meta: Record<string, unknown>, fallback: string): string =>
	typeof meta.card_title === "string" ? meta.card_title : fallback;

export function getRoiKpis({ current, currentMeta }: Input): RoiKpis {
	const getValue = (key: string) => (current[key] as number | undefined) ?? null;
	const getMeta = (key: string) => currentMeta[key] ?? {};

	const totalInvestedMeta = getMeta("total_invested");
	const cashBalanceMeta = getMeta("cash_balance");
	const recoveryBalanceMeta = getMeta("recovery_balance");
	const paybackMonthsMeta = getMeta("roi_payback_months");

	return {
		totalInvested: {
			value: getValue("total_invested"),
			title: cardTitle(totalInvestedMeta, "Total investido (Bruno+Guilherme)"),
			subline: typeof totalInvestedMeta.subline === "string" ? totalInvestedMeta.subline : null,
			detailLine:
				typeof totalInvestedMeta.detail_line === "string" ? totalInvestedMeta.detail_line : null,
		},
		cashBalance: {
			value: getValue("cash_balance"),
			title: cardTitle(cashBalanceMeta, "Saldo em caixa (fluxo real)"),
			subline: typeof cashBalanceMeta.subline === "string" ? cashBalanceMeta.subline : null,
			pctPill:
				typeof cashBalanceMeta.pct_of_investment_pill === "string"
					? cashBalanceMeta.pct_of_investment_pill
					: null,
		},
		recoveryBalance: {
			value: getValue("recovery_balance"),
			title: cardTitle(recoveryBalanceMeta, "A recuperar"),
			subline:
				typeof recoveryBalanceMeta.subline === "string" ? recoveryBalanceMeta.subline : null,
		},
		paybackMonths: {
			value: getValue("roi_payback_months"),
			subline: typeof paybackMonthsMeta.subline === "string" ? paybackMonthsMeta.subline : null,
			detailLine:
				typeof paybackMonthsMeta.detail_line === "string" ? paybackMonthsMeta.detail_line : null,
		},
	};
}
