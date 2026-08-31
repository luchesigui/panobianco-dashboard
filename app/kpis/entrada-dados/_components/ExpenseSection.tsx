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
import { Lock, LockOpen } from "lucide-react";
import { formatCurrency, formatThousands, cleanPastedValue, parsePtBrNumber } from "../lib/parsers";
import { FileUploadArea } from "./FileUploadArea";

export type ExpenseEntry = {
	code: string;
	label: string;
	value: number;
};

type Props = {
	entries: ExpenseEntry[];
	locked: boolean;
	uploading: boolean;
	onToggleLock: () => void;
	onUploadFile: (file: File) => void;
	onChange: (code: string, value: number) => void;
};

export function ExpenseSection({
	entries,
	locked,
	uploading,
	onToggleLock,
	onUploadFile,
	onChange,
}: Props) {
	const total = entries.reduce((acc, item) => acc + item.value, 0);
	return (
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
							Financeiro — Despesas
						</CardTitle>
						<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
							Despesas totais calculadas automaticamente.
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-8 w-8 border-[color:var(--border-subtle)]"
						onClick={onToggleLock}
						title="Bloquear/desbloquear edição manual"
					>
						{locked ? (
							<Lock className="h-4 w-4 text-[color:var(--text-secondary)]" />
						) : (
							<LockOpen className="h-4 w-4 text-[color:var(--text-secondary)]" />
						)}
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<FileUploadArea
					label="Importe o arquivo de relatório de centro de despesas."
					onFile={onUploadFile}
					loading={uploading}
				/>
				{entries.length > 0 ? (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-5">
						{entries.map((item) => {
							const displayValue = locked
								? formatCurrency(String(item.value))
								: formatThousands(String(item.value));

							const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
								const pastedText = e.clipboardData.getData("text");
								const cleanedValue = cleanPastedValue(pastedText, false);
								if (cleanedValue !== pastedText) {
									e.preventDefault();
									const parsed = parsePtBrNumber(cleanedValue) ?? 0;
									onChange(item.code, parsed);
								}
							};

							return (
								<div key={item.code} className="flex flex-col gap-2">
									<Label className="text-xs font-medium text-[color:var(--text-secondary)]">
										{item.label}
									</Label>
									<Input
										disabled={locked}
										value={displayValue}
										onPaste={handlePaste}
										onChange={(e) => {
											const clean = e.target.value.replace(/\D/g, "");
											const parsed = Number(clean) || 0;
											onChange(item.code, parsed);
										}}
										className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]"
									/>
								</div>
							);
						})}
						<div className="flex flex-col gap-2">
							<Label className="text-xs font-medium text-[color:var(--text-secondary)]">
								Despesas totais
							</Label>
							<Input
								disabled
								value={formatCurrency(String(total))}
								className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)] disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--text-muted)]"
							/>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
