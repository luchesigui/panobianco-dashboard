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
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
					Academia
				</CardTitle>
				<CardDescription className="text-xs text-slate-400 mt-0.5">
					Informações exibidas no dashboard.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="flex flex-col gap-1.5">
					<Label
						htmlFor="gym-name"
						className="text-xs font-medium text-slate-600"
					>
						Nome de exibição
					</Label>
					<Input
						id="gym-name"
						value={gymInfo.gymName}
						onChange={(e) => gymInfo.setGymName(e.target.value)}
						className="h-10 bg-white border-slate-200"
						placeholder="ex: Panobianco Jd. Satélite"
					/>
					<p className="text-xs text-slate-400">
						Substitui o slug no cabeçalho do dashboard.
					</p>
				</div>
				<Button
					onClick={() => void gymInfo.handleSaveGymName()}
					disabled={gymInfo.savingName}
					variant="outline"
					className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
				>
					{gymInfo.savingName ? "Salvando…" : "Salvar nome"}
				</Button>

				<div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
					<Label
						htmlFor="total-invested"
						className="text-xs font-medium text-slate-600"
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
						className="h-10 bg-white border-slate-200"
						placeholder="R$ 1.020.300"
					/>
					<p className="text-xs text-slate-400">
						Substitui o número do card &quot;Total investido&quot; na seção ROI
						do dashboard.
					</p>
				</div>
				<Button
					onClick={() => void gymInfo.handleSaveTotalInvested()}
					disabled={gymInfo.savingTotalInvested}
					variant="outline"
					className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
				>
					{gymInfo.savingTotalInvested
						? "Salvando…"
						: "Salvar investimento total"}
				</Button>
			</CardContent>
		</Card>
	);
}
