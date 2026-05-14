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

type Props = {
	funnel: FunnelState;
	onFunnelChange: (key: keyof FunnelState, value: string) => void;
	recepMonth: RecepMonthRow[];
	onRecepMonthChange: (
		id: string,
		field: "leads" | "sales" | "goal",
		value: string,
	) => void;
};

export function FunnelAndReceptionistsCard({
	funnel,
	onFunnelChange,
	recepMonth,
	onRecepMonthChange,
}: Props) {
	return (
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
					Funil e recepcionistas (mensal)
				</CardTitle>
				<CardDescription className="text-xs text-slate-400 mt-0.5">
					Funil mensal e recepcionistas. Salvo junto com os dados semanais.
				</CardDescription>
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
