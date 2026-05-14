"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FunnelState } from "../lib/types";

type Props = {
	funnel: FunnelState;
	onChange: (key: keyof FunnelState, value: string) => void;
};

const FUNNEL_FIELDS = [
	["scheduled", "Agendadas"],
	["present", "Presentes"],
	["closings", "Fechamentos"],
] as const;

export function FunnelSection({ funnel, onChange }: Props) {
	return (
		<div>
			<p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
				Funil (valores do mês)
			</p>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
				{FUNNEL_FIELDS.map(([key, label]) => (
					<div key={key} className="flex flex-col gap-1.5">
						<Label
							htmlFor={`funnel-${key}`}
							className="text-xs font-medium text-slate-600"
						>
							{label}
						</Label>
						<Input
							id={`funnel-${key}`}
							type="text"
							inputMode="numeric"
							value={funnel[key].value}
							onChange={(e) => onChange(key, e.target.value)}
							className="h-10 bg-white border-slate-200"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
