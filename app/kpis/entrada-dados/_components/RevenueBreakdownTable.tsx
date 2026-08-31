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
									<Label className="text-xs font-medium text-[color:var(--text-secondary)]">
										{name}
									</Label>
									<Input
										disabled
										value={formatCurrency(String(value))}
										className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]"
									/>
								</div>
							))}
					</div>
				</div>
			) : null}
			<div className="flex flex-col gap-2">
				<Label className="text-xs font-medium text-[color:var(--text-secondary)]">
					Receita total
				</Label>
				<Input
					disabled
					value={total > 0 ? formatCurrency(String(total)) : "—"}
					className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]"
				/>
			</div>
		</>
	);
}
