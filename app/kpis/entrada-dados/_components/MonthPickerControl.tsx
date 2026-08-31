"use client";

import { Label } from "@/components/ui/label";
import { useKpiPeriodStore } from "@/lib/stores/kpi-period-store";
import { formatMonthPtBr } from "../lib/parsers";

type Props = {
	monthValue: string;
};

export function MonthPickerControl({ monthValue }: Props) {
	const setSelectedMonth = useKpiPeriodStore((s) => s.setSelectedMonth);
	const now = new Date();
	const maxMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
	const atMax = monthValue >= maxMonth;

	const navigateTo = (month: string) => {
		const p = month.length === 7 ? `${month}-01` : month;
		setSelectedMonth(p.slice(0, 7));
	};

	const goPrev = () => {
		const [y, m] = monthValue.split("-").map(Number);
		navigateTo(
			m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`,
		);
	};

	const goNext = () => {
		if (atMax) return;
		const [y, m] = monthValue.split("-").map(Number);
		navigateTo(
			m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`,
		);
	};

	return (
		<div className="flex flex-col gap-1.5">
			<Label className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
				Mês
			</Label>
			<div className="flex items-center h-10 border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] overflow-hidden">
				<button
					type="button"
					aria-label="Mês anterior"
					onClick={goPrev}
					className="flex items-center justify-center w-9 h-full text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-black/5 transition-colors border-r border-[color:var(--border-subtle)] shrink-0 text-lg leading-none"
				>
					‹
				</button>
				<span className="flex-1 text-center text-sm text-[color:var(--text-primary)] select-none px-2 whitespace-nowrap min-w-44 font-medium">
					{formatMonthPtBr(monthValue)}
				</span>
				<button
					type="button"
					aria-label="Próximo mês"
					onClick={goNext}
					disabled={atMax}
					className="flex items-center justify-center w-9 h-full text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-black/5 transition-colors border-l border-[color:var(--border-subtle)] shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
				>
					›
				</button>
			</div>
		</div>
	);
}
