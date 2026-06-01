"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { FunnelState, RecepMonthRow } from "../lib/types";
import { FunnelSection } from "./FunnelSection";
import { ReceptionistMonthTable } from "./ReceptionistMonthTable";
import { FileUploadArea } from "./FileUploadArea";

type Props = {
	funnel: FunnelState;
	onFunnelChange: (key: keyof FunnelState, value: string) => void;
	recepMonth: RecepMonthRow[];
	onRecepMonthChange: (
		id: string,
		field: "leads" | "sales" | "goal",
		value: string,
	) => void;
	onUploadFile?: (file: File) => void;
	uploading?: boolean;
};

export function FunnelAndReceptionistsCard({
	funnel,
	onFunnelChange,
	recepMonth,
	onRecepMonthChange,
	onUploadFile,
	uploading,
}: Props) {
	return (
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
							Funil e recepcionistas (mensal)
						</CardTitle>
						<CardDescription className="text-xs text-slate-400 mt-0.5">
							Funil mensal e recepcionistas. Salvo junto com os dados semanais.
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
			<CardContent className="space-y-6">
				<FunnelSection funnel={funnel} onChange={onFunnelChange} />
				<ReceptionistMonthTable
					rows={recepMonth}
					onChange={onRecepMonthChange}
				/>
			</CardContent>
		</Card>
	);
}
