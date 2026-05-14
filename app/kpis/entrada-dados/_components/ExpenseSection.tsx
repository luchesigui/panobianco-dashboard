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
import { formatCurrency, parsePtBrNumber } from "../lib/parsers";
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
		<Card className="shadow-sm border-slate-200">
			<CardHeader className="pb-4 border-b border-slate-100">
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
							Financeiro — Despesas
						</CardTitle>
						<CardDescription className="text-xs text-slate-400 mt-0.5">
							Despesas totais calculadas automaticamente.
						</CardDescription>
					</div>
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
						{entries.map((item) => (
							<div key={item.code} className="flex flex-col gap-2">
								<Label className="text-xs font-medium text-slate-600">
									{item.label}
								</Label>
								<Input
									disabled={locked}
									value={
										locked
											? formatCurrency(String(item.value))
											: String(item.value)
									}
									onChange={(e) => {
										const parsed = parsePtBrNumber(e.target.value) ?? 0;
										onChange(item.code, parsed);
									}}
									className="h-10 bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
								/>
							</div>
						))}
						<div className="flex flex-col gap-2">
							<Label className="text-xs font-medium text-slate-600">
								Despesas totais
							</Label>
							<Input
								disabled
								value={formatCurrency(String(total))}
								className="h-10 bg-white border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
							/>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
