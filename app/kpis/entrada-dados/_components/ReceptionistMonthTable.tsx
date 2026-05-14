"use client";

import { Input } from "@/components/ui/input";
import type { RecepMonthRow } from "../lib/types";

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
							{HEADERS.map((h, i) => (
								<p
									key={h}
									className={`text-xs text-slate-400 font-medium ${i === 0 ? "col-span-2" : ""}`}
								>
									{h}
								</p>
							))}
						</div>
						{rows.map((r) => (
							<div key={r.id} className="grid grid-cols-5 gap-2">
								<div className="col-span-2 h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700 select-none truncate">
									{r.name}
								</div>
								<Input
									value={r.leads}
									onChange={(e) => onChange(r.id, "leads", e.target.value)}
									placeholder="0"
									className="h-10 bg-white border-slate-200 text-center"
								/>
								<Input
									value={r.sales}
									onChange={(e) => onChange(r.id, "sales", e.target.value)}
									placeholder="0"
									className="h-10 bg-white border-slate-200 text-center"
								/>
								<Input
									value={r.goal}
									onChange={(e) => onChange(r.id, "goal", e.target.value)}
									placeholder="0"
									className="h-10 bg-white border-slate-200 text-center"
								/>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
