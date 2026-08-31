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
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-bold text-[color:var(--text-primary)]">
					Metas individuais
				</CardTitle>
				<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
					Meta de vendas mensais por consultora.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				{namedRows.length === 0 ? (
					<p className="text-xs text-[color:var(--text-muted)]">
						Cadastre consultoras acima para definir metas individuais.
					</p>
				) : (
					<div className="space-y-2">
						{namedRows.map((c, i) => {
							const globalIndex = consultoras.rows.indexOf(c);
							return (
								<div key={i} className="flex items-center gap-3">
									<span className="text-sm text-[color:var(--text-secondary)] w-48 truncate">
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
										className="h-9 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-sm w-28"
										placeholder="0"
									/>
								</div>
							);
						})}
						<div className="flex items-center gap-3 pt-1 border-t border-[color:var(--border-subtle)]">
							<span className="text-xs font-medium text-[color:var(--text-secondary)] w-48">
								Total
							</span>
							<span className="text-sm font-semibold text-[color:var(--text-primary)] w-28 pl-3">
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
						className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
					>
						{consultoras.savingGoals ? "Salvando…" : "Salvar metas"}
					</Button>
				) : null}
			</CardContent>
		</Card>
	);
}
