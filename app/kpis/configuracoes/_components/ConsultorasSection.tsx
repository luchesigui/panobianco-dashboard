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
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	consultoras: UseSettingsForm["consultoras"];
	nameInputRefs: RefObject<(HTMLInputElement | null)[]>;
};

export function ConsultorasSection({ consultoras, nameInputRefs }: Props) {
	return (
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-bold text-[color:var(--text-primary)]">
					Equipe de consultoras
				</CardTitle>
				<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
					Cadastre as consultoras ativas na recepção.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="space-y-2">
					{consultoras.rows.map((c, i) => (
						<div key={i} className="flex items-center gap-2">
							<Input
								ref={(el) => {
									nameInputRefs.current[i] = el;
								}}
								value={c.name}
								onChange={(e) =>
									consultoras.updateConsultora(i, "name", e.target.value)
								}
								className="h-9 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-sm"
								placeholder="Nome da consultora"
							/>
							<button
								type="button"
								onClick={() => nameInputRefs.current[i]?.focus()}
								className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors shrink-0"
								tabIndex={-1}
								aria-label="Editar"
							>
								<Pencil size={14} />
							</button>
							<button
								type="button"
								onClick={() => consultoras.removeConsultora(i)}
								className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--feedback-negative)] transition-colors shrink-0"
								aria-label="Remover"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
				<button
					type="button"
					onClick={consultoras.addConsultora}
					className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
				>
					<Plus size={13} />
					Adicionar consultora
				</button>
				<Button
					onClick={() => void consultoras.handleSaveConsultoras("consultoras")}
					disabled={consultoras.saving}
					variant="outline"
					className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
				>
					{consultoras.saving ? "Salvando…" : "Salvar consultoras"}
				</Button>
			</CardContent>
		</Card>
	);
}
