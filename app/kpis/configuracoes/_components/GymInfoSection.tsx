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
import { Label } from "@/components/ui/label";
import { formatBrlIntegerMask } from "../lib/brl-mask";
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	gymInfo: UseSettingsForm["gymInfo"];
};

export function GymInfoSection({ gymInfo }: Props) {
	return (
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-bold text-[color:var(--text-primary)]">
					Identificação da academia
				</CardTitle>
				<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
					Nome e dados cadastrais da sua unidade.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="flex flex-col gap-1.5">
					<Label
						htmlFor="gym-name"
						className="text-xs font-medium text-[color:var(--text-secondary)]"
					>
						Nome de exibição
					</Label>
					<Input
						id="gym-name"
						value={gymInfo.gymName}
						onChange={(e) => gymInfo.setGymName(e.target.value)}
						className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
						placeholder="ex: Panobianco Jd. Satélite"
					/>
					<p className="text-xs text-[color:var(--text-muted)]">
						Substitui o slug no cabeçalho do dashboard.
					</p>
				</div>
				<Button
					onClick={() => void gymInfo.handleSaveGymName()}
					disabled={gymInfo.savingName}
					variant="outline"
					className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
				>
					{gymInfo.savingName ? "Salvando…" : "Salvar nome"}
				</Button>

				<div className="flex flex-col gap-1.5 pt-2 border-t border-[color:var(--border-subtle)]">
					<Label
						htmlFor="total-invested"
						className="text-xs font-medium text-[color:var(--text-secondary)]"
					>
						Investimento total
					</Label>
					<Input
						id="total-invested"
						inputMode="numeric"
						value={gymInfo.totalInvested}
						onChange={(e) =>
							gymInfo.setTotalInvested(formatBrlIntegerMask(e.target.value))
						}
						className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
						placeholder="R$ 1.020.300"
					/>
					<p className="text-xs text-[color:var(--text-muted)]">
						Substitui o número do card &quot;Total investido&quot; na seção ROI
						do dashboard.
					</p>
				</div>
				<Button
					onClick={() => void gymInfo.handleSaveTotalInvested()}
					disabled={gymInfo.savingTotalInvested}
					variant="outline"
					className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
				>
					{gymInfo.savingTotalInvested
						? "Salvando…"
						: "Salvar investimento total"}
				</Button>
			</CardContent>
		</Card>
	);
}
