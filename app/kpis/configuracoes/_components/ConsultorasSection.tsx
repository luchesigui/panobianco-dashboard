"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2, UserMinus, UserX } from "lucide-react";
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	consultoras: UseSettingsForm["consultoras"];
	nameInputRefs: RefObject<(HTMLInputElement | null)[]>;
};

function formatDate(isoString?: string | null): string {
	if (!isoString) return "";
	try {
		const date = new Date(isoString);
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	} catch {
		return "";
	}
}

export function ConsultorasSection({ consultoras, nameInputRefs }: Props) {
	const [showInactive, setShowInactive] = useState(false);
	const inactiveCount = consultoras.inactiveRows?.length ?? 0;

	return (
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-sm font-bold text-[color:var(--text-primary)]">
							Equipe de recepcionistas / consultoras
						</CardTitle>
						<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
							Cadastre as recepcionistas ativas na recepção e gerencie desligamentos por demissão (soft delete).
						</CardDescription>
					</div>
					{inactiveCount > 0 ? (
						<Badge variant="secondary" className="text-[11px] font-medium text-[color:var(--text-secondary)]">
							{inactiveCount} {inactiveCount === 1 ? "desativada" : "desativadas"}
						</Badge>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs font-semibold text-[color:var(--text-secondary)] mb-1">
						<span>Recepcionistas ativas</span>
						<span className="text-[color:var(--text-muted)] font-normal text-[11px]">
							{consultoras.rows.length} {consultoras.rows.length === 1 ? "ativa" : "ativas"}
						</span>
					</div>

					{consultoras.rows.length === 0 ? (
						<p className="text-xs text-[color:var(--text-muted)] py-2">
							Nenhuma recepcionista ativa cadastrada. Clique abaixo para adicionar.
						</p>
					) : (
						consultoras.rows.map((c, i) => (
							<div key={c.id ?? `draft-${i}`} className="flex items-center gap-2">
								<Input
									ref={(el) => {
										nameInputRefs.current[i] = el;
									}}
									value={c.name}
									onChange={(e) =>
										consultoras.updateConsultora(i, "name", e.target.value)
									}
									className="h-9 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] text-sm"
									placeholder="Nome da recepcionista"
								/>
								<button
									type="button"
									onClick={() => nameInputRefs.current[i]?.focus()}
									className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors shrink-0"
									tabIndex={-1}
									aria-label="Editar"
									title="Editar nome"
								>
									<Pencil size={14} />
								</button>
								{c.id ? (
									<button
										type="button"
										onClick={() => {
											if (
												window.confirm(
													`Deseja desativar a recepcionista "${c.name || "Sem nome"}" por demissão/desligamento? O histórico de vendas continuará preservado (soft delete).`,
												)
											) {
												void consultoras.deactivateConsultora(i);
											}
										}}
										disabled={consultoras.saving}
										className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[color:var(--feedback-negative)] hover:bg-[color:var(--feedback-negative)]/10 rounded border border-[color:var(--feedback-negative)]/30 transition-colors shrink-0"
										aria-label="Desativar (Demissão)"
										title="Desativar / Desligar recepcionista (soft delete)"
									>
										<UserMinus size={13} />
										<span>Desativar</span>
									</button>
								) : (
									<button
										type="button"
										onClick={() => consultoras.removeConsultora(i)}
										className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--feedback-negative)] transition-colors shrink-0"
										aria-label="Remover rascunho"
										title="Remover rascunho"
									>
										<Trash2 size={14} />
									</button>
								)}
							</div>
						))
					)}
				</div>

				<div className="flex items-center gap-3 pt-1">
					<button
						type="button"
						onClick={consultoras.addConsultora}
						className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
					>
						<Plus size={14} />
						Adicionar recepcionista
					</button>
				</div>

				<div className="pt-2">
					<Button
						onClick={() => void consultoras.handleSaveConsultoras("consultoras")}
						disabled={consultoras.saving}
						variant="outline"
						className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
					>
						{consultoras.saving ? "Salvando…" : "Salvar recepcionistas"}
					</Button>
				</div>

				{inactiveCount > 0 ? (
					<div className="mt-6 pt-4 border-t border-[color:var(--border-subtle)]">
						<button
							type="button"
							onClick={() => setShowInactive((prev) => !prev)}
							className="flex items-center justify-between w-full text-xs font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
						>
							<div className="flex items-center gap-2">
								<UserX size={14} className="text-[color:var(--text-muted)]" />
								<span>Recepcionistas desativadas / Histórico ({inactiveCount})</span>
							</div>
							{showInactive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
						</button>

						{showInactive ? (
							<div className="mt-3 space-y-2">
								<p className="text-[11px] text-[color:var(--text-muted)]">
									Estas recepcionistas foram desativadas por demissão. Seus dados históricos permanecem seguros e podem ser reativadas a qualquer momento.
								</p>
								<div className="space-y-1.5">
									{consultoras.inactiveRows.map((inactive) => (
										<div
											key={inactive.id}
											className="flex items-center justify-between px-3 py-2 rounded border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]"
										>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-[color:var(--text-secondary)] line-through decoration-[color:var(--text-muted)]">
													{inactive.name}
												</span>
												{inactive.deleted_at ? (
													<span className="text-[11px] text-[color:var(--text-muted)]">
														· Desativada em {formatDate(inactive.deleted_at)}
													</span>
												) : null}
											</div>
											<Button
												size="sm"
												variant="ghost"
												disabled={consultoras.saving}
												onClick={() => void consultoras.reactivateConsultora(inactive.id)}
												className="h-7 px-2.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-card)]"
											>
												<RotateCcw size={12} className="mr-1" />
												Reativar
											</Button>
										</div>
									))}
								</div>
							</div>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

