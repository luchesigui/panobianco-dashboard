"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { GymOption } from "@/lib/data/entrada-load";
import { formatMonthPtBr } from "../lib/parsers";
import { MonthPickerControl } from "./MonthPickerControl";
import brand from "../../kpi-brand.module.css";

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
					<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#cc3300] mb-1">
						Panobianco · Gestão Operacional
					</p>
					<h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[color:var(--text-primary)]">
						Entrada de dados
					</h1>
					<p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] mt-1">
						Academia:{" "}
						<span className="font-semibold text-[color:var(--text-secondary)]">{gymName}</span>
						<span className="mx-2 text-[color:var(--border-strong)]">·</span>
						Período:{" "}
						<span className="font-bold text-[#ff6100]">
							{formatMonthPtBr(monthValue)}
						</span>
					</p>
				</div>
				<div className="selo-chanfrado h-10 w-2.5 bg-[#ff6100] shrink-0" aria-hidden />
			</div>

			<Card className="mb-8 border border-[color:var(--border-subtle)] bg-white shadow-sm rounded-xl">
				<CardContent className="py-5 px-6">
					<div className="flex flex-wrap gap-5 items-end">
						<MonthPickerControl monthValue={monthValue} />
					</div>
				</CardContent>
			</Card>
		</>
	);
}
