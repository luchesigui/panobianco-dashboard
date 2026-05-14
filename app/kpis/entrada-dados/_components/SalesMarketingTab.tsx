"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { UseSmDashboard } from "../hooks/useSmDashboard";
import { SaveButton } from "./SaveButton";
import { WeeklyDataGrid } from "./WeeklyDataGrid";

type Props = {
	sm: UseSmDashboard;
};

export function SalesMarketingTab({ sm }: Props) {
	return (
		<div className="space-y-5">
			<Card className="shadow-sm border-slate-200">
				<CardHeader className="pb-4 border-b border-slate-100">
					<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
						Grade semanal
					</CardTitle>
					<CardDescription className="text-xs text-slate-400 mt-0.5">
						S1–S4 = dom–sáb por semana.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-3">
					<WeeklyDataGrid
						weekHeaders={sm.weekHeaders}
						weeklyStr={sm.weeklyStr}
						recepWeekRows={sm.recepWeekRows}
						gridTotalRows={sm.smGridTotalRows}
						onMatrixChange={sm.updateMatrix}
						onRecepCellChange={sm.updateRecepWeekCell}
					/>

					{sm.recepWeekRows.length === 0 && (
						<p className="text-xs text-slate-400 mt-4">
							Nenhuma consultora cadastrada.{" "}
							<a href="/kpis/configuracoes" className="underline">
								Configure em Configurações.
							</a>
						</p>
					)}
				</CardContent>
			</Card>

			<SaveButton onClick={() => void sm.handleSaveSm()} loading={sm.saving}>
				Salvar payload vendas/marketing
			</SaveButton>
		</div>
	);
}
