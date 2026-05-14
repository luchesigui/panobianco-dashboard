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
			<Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
				Mês
			</Label>
			<div className="flex items-center h-10 rounded-lg border border-slate-200 bg-white overflow-hidden">
				<button
					type="button"
					aria-label="Mês anterior"
					onClick={goPrev}
					className="flex items-center justify-center w-9 h-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-200 shrink-0 text-lg leading-none"
				>
					‹
				</button>
				<span className="flex-1 text-center text-sm text-slate-900 select-none px-2 whitespace-nowrap min-w-44">
					{formatMonthPtBr(monthValue)}
				</span>
				<button
					type="button"
					aria-label="Próximo mês"
					onClick={goNext}
					disabled={atMax}
					className="flex items-center justify-center w-9 h-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-l border-slate-200 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
				>
					›
				</button>
			</div>
		</div>
	);
}
