"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	consultoras: UseSettingsForm["consultoras"];
};

export function GoalsSection({ consultoras }: Props) {
	const namedRows = consultoras.rows.filter((c) => c.name.trim());

	return (
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
					Metas
				</CardTitle>
				<CardDescription className="text-xs text-slate-400 mt-0.5">
					Meta de vendas mensais por consultora.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				{namedRows.length === 0 ? (
					<p className="text-xs text-slate-400">
						Cadastre consultoras acima para definir metas individuais.
					</p>
				) : (
					<div className="space-y-2">
						{namedRows.map((c, i) => {
							const globalIndex = consultoras.rows.indexOf(c);
							return (
								<div key={i} className="flex items-center gap-3">
									<span className="text-sm text-slate-600 w-48 truncate">
										{c.name}
									</span>
									<Input
										inputMode="numeric"
										value={c.monthly_goal}
										onChange={(e) =>
											consultoras.updateConsultora(
												globalIndex,
												"monthly_goal",
												e.target.value,
											)
										}
										className="h-9 bg-white border-slate-200 text-sm w-28"
										placeholder="0"
									/>
								</div>
							);
						})}
						<div className="flex items-center gap-3 pt-1 border-t border-slate-100">
							<span className="text-xs font-medium text-slate-500 w-48">
								Total
							</span>
							<span className="text-sm font-semibold text-slate-700 w-28 pl-3">
								{consultoras.total > 0 ? consultoras.total : "—"}
							</span>
						</div>
					</div>
				)}
				{namedRows.length > 0 ? (
					<Button
						onClick={() =>
							void consultoras.handleSaveConsultoras("consultorasGoals")
						}
						disabled={consultoras.savingGoals}
						variant="outline"
						className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
					>
						{consultoras.savingGoals ? "Salvando…" : "Salvar metas"}
					</Button>
				) : null}
			</CardContent>
		</Card>
	);
}
