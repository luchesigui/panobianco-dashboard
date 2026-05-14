"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "../lib/parsers";

type Props = {
	breakdown: Record<string, number>;
	total: number;
};

export function RevenueBreakdownTable({ breakdown, total }: Props) {
	const hasBreakdown = Object.keys(breakdown).length > 0;
	return (
		<>
			{hasBreakdown ? (
				<div className="col-span-full">
					<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
						{Object.entries(breakdown)
							.sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
							.map(([name, value]) => (
								<div key={name} className="flex flex-col gap-1">
									<Label className="text-xs font-medium text-slate-600">
										{name}
									</Label>
									<Input
										disabled
										value={formatCurrency(String(value))}
										className="h-10 bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
									/>
								</div>
							))}
					</div>
				</div>
			) : null}
			<div className="flex flex-col gap-2">
				<Label className="text-xs font-medium text-slate-600">
					Receita total
				</Label>
				<Input
					disabled
					value={total > 0 ? formatCurrency(String(total)) : "—"}
					className="h-10 bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
				/>
			</div>
		</>
	);
}
