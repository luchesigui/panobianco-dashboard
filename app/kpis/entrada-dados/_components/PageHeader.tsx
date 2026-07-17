"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { GymOption } from "@/lib/data/entrada-load";
import { formatMonthPtBr } from "../lib/parsers";
import { MonthPickerControl } from "./MonthPickerControl";

type Props = {
	gyms: GymOption[];
	gymSlug: string;
	periodId: string;
};

export function PageHeader({ gyms, gymSlug, periodId }: Props) {
	const monthValue = periodId.slice(0, 7);
	const gymName = gyms.find((g) => g.slug === gymSlug)?.name ?? gymSlug;

	return (
		<>
			<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
				<h1 className="mb-1 font-[var(--font-kpi-display)] text-[clamp(42px,7vw,72px)] font-black italic uppercase leading-[0.95] tracking-tight text-slate-950">
					Entrada de dados
				</h1>
				<p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
					Academia:{" "}
					<span className="font-medium text-slate-700">{gymName}</span>
					<span className="mx-2 text-slate-300">·</span>
					Período:{" "}
					<span className="font-extrabold text-[#ff6100]">
						{formatMonthPtBr(monthValue)}
					</span>
				</p>
				</div>
				<div className="h-12 w-12 shrink-0 bg-[#ff6100] text-center font-[var(--font-kpi-display)] text-2xl font-black leading-[48px] text-white [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%,0_22%)]" aria-hidden>
					P
				</div>
			</div>

			<Card className="mb-8 border-black/10 bg-white/90 shadow-sm">
				<CardContent className="py-5 px-6">
					<div className="flex flex-wrap gap-5 items-end">
						<MonthPickerControl monthValue={monthValue} />
					</div>
				</CardContent>
			</Card>
		</>
	);
}
