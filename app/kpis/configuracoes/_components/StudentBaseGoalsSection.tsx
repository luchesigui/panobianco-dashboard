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
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	studentBaseGoals: UseSettingsForm["studentBaseGoals"];
};

const MONTHS_PT = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

export function StudentBaseGoalsSection({ studentBaseGoals }: Props) {
	return (
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
					Meta de Base de Alunos
				</CardTitle>
				<CardDescription className="text-xs text-slate-400 mt-0.5">
					Meta de alunos ativos ao final de cada mês.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="grid grid-cols-3 gap-x-4 gap-y-3">
					{MONTHS_PT.map((label, i) => {
						const month = i + 1;
						return (
							<div key={month} className="flex flex-col gap-1">
								<Label className="text-xs font-medium text-slate-500">
									{label}
								</Label>
								<Input
									inputMode="numeric"
									value={studentBaseGoals.values[month] ?? ""}
									onChange={(e) =>
										studentBaseGoals.update(month, e.target.value)
									}
									className="h-9 bg-white border-slate-200 text-sm"
									placeholder="0"
								/>
							</div>
						);
					})}
				</div>
				<Button
					onClick={() => void studentBaseGoals.handleSave()}
					disabled={studentBaseGoals.saving}
					variant="outline"
					className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
				>
					{studentBaseGoals.saving ? "Salvando…" : "Salvar metas de base"}
				</Button>
			</CardContent>
		</Card>
	);
}
