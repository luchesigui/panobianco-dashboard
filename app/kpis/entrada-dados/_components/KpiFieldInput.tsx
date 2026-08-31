"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KpiFormField } from "@/lib/data/dashboard-input-requirements";
import { formatCurrency, formatThousands, cleanPastedValue } from "../lib/parsers";

type Props = {
	field: KpiFormField;
	value: string;
	disabled?: boolean;
	focused: boolean;
	onFocus: () => void;
	onBlur: () => void;
	onChange: (value: string) => void;
};

export function KpiFieldInput({
	field,
	value,
	disabled,
	focused,
	onFocus,
	onBlur,
	onChange,
}: Props) {
	const isFrequency = field.code === "marketing_frequency";
	
	let displayVal = value;
	if (field.unit === "currency" && !focused) {
		displayVal = formatCurrency(value);
	} else if (!isFrequency && (field.unit === "currency" || field.unit === "count")) {
		displayVal = formatThousands(value);
	}

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pastedText = e.clipboardData.getData("text");
		const cleanedValue = cleanPastedValue(pastedText, isFrequency);
		if (cleanedValue !== pastedText) {
			e.preventDefault();
			onChange(cleanedValue);
		}
	};

	const handleChange = (val: string) => {
		if (!isFrequency && (field.unit === "currency" || field.unit === "count")) {
			onChange(val.replace(/\D/g, ""));
		} else {
			onChange(val);
		}
	};

	const placeholder =
		field.unit === "currency"
			? "R$ 0"
			: field.unit === "percent"
				? "ex: 77"
				: "";
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-1">
				<Label
					htmlFor={field.code}
					className="text-xs font-medium text-[color:var(--text-secondary)]"
				>
					{field.label}
				</Label>
				{field.hint ? (
					<Tooltip>
						<TooltipTrigger>
							<span className="text-[color:var(--text-muted)] cursor-help text-xs leading-none hover:text-[color:var(--text-primary)] transition-colors">
								ⓘ
							</span>
						</TooltipTrigger>
						<TooltipContent side="top">{field.hint}</TooltipContent>
					</Tooltip>
				) : null}
			</div>
			<Input
				id={field.code}
				inputMode="decimal"
				value={displayVal}
				disabled={disabled}
				onFocus={onFocus}
				onBlur={onBlur}
				onPaste={handlePaste}
				onChange={(e) => handleChange(e.target.value)}
				className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]"
				placeholder={placeholder}
			/>
		</div>
	);
}
