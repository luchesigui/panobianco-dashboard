"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { KpiFormField } from "@/lib/data/dashboard-input-requirements";
import { Lock, LockOpen } from "lucide-react";
import { KpiFieldInput } from "./KpiFieldInput";

type Props = {
	title: string;
	description?: string;
	fields: readonly KpiFormField[];
	values: Record<string, string>;
	focusedKey: string | null;
	showLockToggle?: boolean;
	locked?: boolean;
	onToggleLock?: () => void;
	headerSlot?: React.ReactNode;
	beforeFieldsSlot?: React.ReactNode;
	afterFieldsSlot?: React.ReactNode;
	getFieldDisabled?: (field: KpiFormField) => boolean;
	isFieldVisible?: (field: KpiFormField) => boolean;
	onFocus: (key: string) => void;
	onBlur: () => void;
	onChange: (key: string, value: string) => void;
};

export function KpiFormSection({
	title,
	description,
	fields,
	values,
	focusedKey,
	showLockToggle,
	locked,
	onToggleLock,
	headerSlot,
	beforeFieldsSlot,
	afterFieldsSlot,
	getFieldDisabled,
	isFieldVisible,
	onFocus,
	onBlur,
	onChange,
}: Props) {
	const visibleFields = isFieldVisible
		? fields.filter(isFieldVisible)
		: fields;
	return (
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
							{title}
						</CardTitle>
						{description ? (
							<CardDescription className="text-xs text-slate-400 mt-0.5">
								{description}
							</CardDescription>
						) : null}
					</div>
					{showLockToggle && onToggleLock ? (
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="h-8 w-8 border-slate-200"
							onClick={onToggleLock}
							title="Bloquear/desbloquear edição manual"
						>
							{locked ? (
								<Lock className="h-4 w-4 text-slate-500" />
							) : (
								<LockOpen className="h-4 w-4 text-slate-500" />
							)}
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="pt-3">
				{headerSlot}
				<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
					{beforeFieldsSlot}
					{visibleFields.map((field) => {
						const k = field.code;
						return (
							<KpiFieldInput
								key={`${title}-${k}`}
								field={field}
								value={values[k] ?? ""}
								disabled={
									getFieldDisabled ? getFieldDisabled(field) : false
								}
								focused={focusedKey === k}
								onFocus={() => onFocus(k)}
								onBlur={onBlur}
								onChange={(v) => onChange(k, v)}
							/>
						);
					})}
					{afterFieldsSlot}
				</div>
			</CardContent>
		</Card>
	);
}
