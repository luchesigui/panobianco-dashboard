"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FileUploadArea } from "@/app/kpis/entrada-dados/_components/FileUploadArea";
import { SaveButton } from "@/app/kpis/entrada-dados/_components/SaveButton";
import type { UseSalesMarketingWeeklyFormSection } from "../hooks/useSalesMarketingWeeklyFormSection";
import { WeeklyDataGrid } from "./WeeklyDataGrid";

type Props = {
	sm: UseSalesMarketingWeeklyFormSection;
	onUploadFile?: (file: File) => void;
	uploading?: boolean;
};

export function SalesMarketingTab({ sm, onUploadFile, uploading }: Props) {
	return (
		<div className="space-y-5">
			<Card className="shadow-sm border-slate-200">
				<CardHeader className="pb-4 border-b border-slate-100">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
								Grade semanal
							</CardTitle>
							<CardDescription className="text-xs text-slate-400 mt-0.5">
								S1–S5 = dom–sáb por semana.
							</CardDescription>
						</div>
						{onUploadFile && (
							<div className="w-full sm:w-auto sm:min-w-[280px]">
								<FileUploadArea
									label="Subir planilha de conversão"
									onFile={onUploadFile}
									loading={!!uploading}
								/>
							</div>
						)}
					</div>
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
