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
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
					Consultoras
				</CardTitle>
				<CardDescription className="text-xs text-slate-400 mt-0.5">
					Equipe de vendas. Usada para atribuição de metas e recepções.
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
								className="h-9 bg-white border-slate-200 text-sm"
								placeholder="Nome da consultora"
							/>
							<button
								type="button"
								onClick={() => nameInputRefs.current[i]?.focus()}
								className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
								tabIndex={-1}
								aria-label="Editar"
							>
								<Pencil size={14} />
							</button>
							<button
								type="button"
								onClick={() => consultoras.removeConsultora(i)}
								className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
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
					className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
				>
					<Plus size={13} />
					Adicionar consultora
				</button>
				<Button
					onClick={() => void consultoras.handleSaveConsultoras("consultoras")}
					disabled={consultoras.saving}
					variant="outline"
					className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
				>
					{consultoras.saving ? "Salvando…" : "Salvar consultoras"}
				</Button>
			</CardContent>
		</Card>
	);
}
