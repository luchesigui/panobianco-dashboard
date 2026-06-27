"use client";

import { Input } from "@/components/ui/input";
import type { RecepMonthRow } from "../types";
import {
	cleanPastedValue,
	formatThousands,
} from "@/app/kpis/entrada-dados/lib/parsers";

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
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
				Recepcionistas (mês)
			</p>
			{rows.length === 0 ? (
				<p className="text-xs text-slate-400 mt-2">
					Nenhuma consultora cadastrada.{" "}
					<a href="/kpis/configuracoes" className="underline">
						Configure em Configurações.
					</a>
				</p>
			) : (
				<>
					<p className="text-xs text-slate-400 mb-3">
						Nome · Leads · Vendas · Meta
					</p>
					<div className="space-y-2">
						<div className="grid grid-cols-5 gap-2 mb-1">
							{HEADERS.map((header, index) => (
								<p
									key={header}
									className={`text-xs text-slate-400 font-medium ${index === 0 ? "col-span-2" : ""}`}
								>
									{header}
								</p>
							))}
						</div>
						{rows.map((row) => {
							const handlePaste = (
								field: "leads" | "sales" | "goal",
								event: React.ClipboardEvent<HTMLInputElement>,
							) => {
								const pastedText = event.clipboardData.getData("text");
								const cleanedValue = cleanPastedValue(pastedText, false);
								if (cleanedValue !== pastedText) {
									event.preventDefault();
									onChange(row.id, field, cleanedValue);
								}
							};

							return (
								<div key={row.id} className="grid grid-cols-5 gap-2">
									<div className="col-span-2 h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700 select-none truncate">
										{row.name}
									</div>
									<Input
										value={formatThousands(row.leads)}
										onPaste={(e) => handlePaste("leads", e)}
										onChange={(e) => onChange(row.id, "leads", e.target.value)}
										placeholder="0"
										className="h-10 bg-white border-slate-200 text-center"
									/>
									<Input
										value={formatThousands(row.sales)}
										onPaste={(e) => handlePaste("sales", e)}
										onChange={(e) => onChange(row.id, "sales", e.target.value)}
										placeholder="0"
										className="h-10 bg-white border-slate-200 text-center"
									/>
									<Input
										value={formatThousands(row.goal)}
										onPaste={(e) => handlePaste("goal", e)}
										onChange={(e) => onChange(row.id, "goal", e.target.value)}
										placeholder="0"
										className="h-10 bg-white border-slate-200 text-center"
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
