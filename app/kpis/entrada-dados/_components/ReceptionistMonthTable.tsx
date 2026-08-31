"use client";

import { Input } from "@/components/ui/input";
import type { RecepMonthRow } from "../lib/types";

import { cleanPastedValue, formatThousands } from "../lib/parsers";

type Props = {
	rows: RecepMonthRow[];
	onChange: (
		id: string,
		field: "leads" | "sales" | "goal",
		value: string,
	) => void;
};

const HEADERS = ["Nome", "Leads", "Vendas", "Meta"];

export function ReceptionistMonthTable({ rows, onChange }: Props) {
	return (
		<div>
			<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)] mb-1">
				Recepcionistas (mês)
			</p>
			{rows.length === 0 ? (
				<p className="text-xs text-[color:var(--text-muted)] mt-2">
					Nenhuma consultora cadastrada.{" "}
					<a href="/kpis/configuracoes" className="underline">
						Configure em Configurações.
					</a>
				</p>
			) : (
				<>
					<p className="text-xs text-[color:var(--text-muted)] mb-3">
						Nome · Leads · Vendas · Meta
					</p>
					<div className="space-y-2">
						<div className="grid grid-cols-5 gap-2 mb-1">
							{HEADERS.map((h, i) => (
								<p
									key={h}
									className={`text-xs text-[color:var(--text-muted)] font-medium ${i === 0 ? "col-span-2" : ""}`}
								>
									{h}
								</p>
							))}
						</div>
						{rows.map((r) => {
							const handlePaste = (
								field: "leads" | "sales" | "goal",
								e: React.ClipboardEvent<HTMLInputElement>,
							) => {
								const pastedText = e.clipboardData.getData("text");
								const cleanedValue = cleanPastedValue(pastedText, false);
								if (cleanedValue !== pastedText) {
									e.preventDefault();
									onChange(r.id, field, cleanedValue);
								}
							};

							return (
								<div key={r.id} className="grid grid-cols-5 gap-2">
									<div className="col-span-2 h-10 flex items-center px-3 border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] text-sm text-[color:var(--text-primary)] select-none truncate">
										{r.name}
									</div>
									<Input
										value={formatThousands(r.leads)}
										onPaste={(e) => handlePaste("leads", e)}
										onChange={(e) => onChange(r.id, "leads", e.target.value)}
										placeholder="0"
										className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-center"
									/>
									<Input
										value={formatThousands(r.sales)}
										onPaste={(e) => handlePaste("sales", e)}
										onChange={(e) => onChange(r.id, "sales", e.target.value)}
										placeholder="0"
										className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-center"
									/>
									<Input
										value={formatThousands(r.goal)}
										onPaste={(e) => handlePaste("goal", e)}
										onChange={(e) => onChange(r.id, "goal", e.target.value)}
										placeholder="0"
										className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-center"
									/>
								</div>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
