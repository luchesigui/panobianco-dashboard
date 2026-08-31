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
				<h1 className="mb-1 font-[var(--font-kpi-display)] text-[clamp(32px,5vw,52px)] font-medium uppercase leading-[1] tracking-tight text-[color:var(--text-primary)]">
					Entrada de dados
				</h1>
				<p className="text-xs font-semibold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">
					Academia:{" "}
					<span className="font-medium text-[color:var(--text-secondary)]">{gymName}</span>
					<span className="mx-2 text-[color:var(--border-strong)]">·</span>
					Período:{" "}
					<span className="font-bold text-[color:var(--action-primary)]">
						{formatMonthPtBr(monthValue)}
					</span>
				</p>
				</div>
				<div className={`${brand.brandMarker} h-12 w-3`} aria-hidden />
			</div>

			<Card className="mb-8 border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
				<CardContent className="py-5 px-6">
					<div className="flex flex-wrap gap-5 items-end">
						<MonthPickerControl monthValue={monthValue} />
					</div>
				</CardContent>
			</Card>
		</>
	);
}
