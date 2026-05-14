"use client";

import type { KpiFormField } from "@/lib/data/dashboard-input-requirements";
import { KpiFieldInput } from "./KpiFieldInput";

type Props = {
	title: string;
	description?: string;
	fields: readonly KpiFormField[];
	values: Record<string, string>;
	focusedKey: string | null;
	groupLocked: boolean;
	isAlwaysEditable: (code: string) => boolean;
	onFocus: (key: string) => void;
	onBlur: () => void;
	onChange: (key: string, value: string) => void;
};

export function RetentionFields({
	title,
	description,
	fields,
	values,
	focusedKey,
	groupLocked,
	isAlwaysEditable,
	onFocus,
	onBlur,
	onChange,
}: Props) {
	return (
		<>
			<div className="col-span-full mt-1 border-t border-slate-100 pt-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
					{title}
				</p>
				{description ? (
					<p className="text-xs text-slate-400 mt-1">{description}</p>
				) : null}
			</div>
			{fields.map((field) => {
				const k = field.code;
				return (
					<KpiFieldInput
						key={`retention-${k}`}
						field={field}
						value={values[k] ?? ""}
						disabled={groupLocked && !isAlwaysEditable(field.code)}
						focused={focusedKey === k}
						onFocus={() => onFocus(k)}
						onBlur={onBlur}
						onChange={(v) => onChange(k, v)}
					/>
				);
			})}
		</>
	);
}
