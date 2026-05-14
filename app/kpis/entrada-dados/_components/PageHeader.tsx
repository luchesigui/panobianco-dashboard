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
			<div className="mb-8">
				<h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
					Entrada de dados
				</h1>
				<p className="text-sm text-slate-500">
					Academia:{" "}
					<span className="font-medium text-slate-700">{gymName}</span>
					<span className="mx-2 text-slate-300">·</span>
					Período:{" "}
					<span className="font-medium text-slate-700">
						{formatMonthPtBr(monthValue)}
					</span>
				</p>
			</div>

			<Card className="mb-8 shadow-sm border-slate-200">
				<CardContent className="py-5 px-6">
					<div className="flex flex-wrap gap-5 items-end">
						<MonthPickerControl monthValue={monthValue} />
					</div>
				</CardContent>
			</Card>
		</>
	);
}
