"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import type { RecepWeekRow, WeeklyStrings } from "../lib/types";
import { cleanPastedValue, formatThousands } from "../lib/parsers";

type Props = {
	weekHeaders: string[];
	weeklyStr: WeeklyStrings;
	recepWeekRows: RecepWeekRow[];
	gridTotalRows: number;
	onMatrixChange: (
		key: keyof WeeklyStrings,
		weekIdx: number,
		value: string,
	) => void;
	onRecepCellChange: (
		rowId: string,
		type: "leads" | "sales",
		weekIdx: number,
		value: string,
	) => void;
};

const MARKETING_ROWS = [
	["Alcance", "reach"],
	["Frequência", "frequency"],
	["Visualizações", "views"],
	["Novos seguidores", "followers"],
] as const;

const FUNNEL_ROWS = [
	["Agendadas", "sch"],
	["Presenças", "att"],
	["Fechamentos", "clo"],
] as const;

export function WeeklyDataGrid({
	weekHeaders,
	weeklyStr,
	recepWeekRows,
	gridTotalRows,
	onMatrixChange,
	onRecepCellChange,
}: Props) {
	const nWeeks = weekHeaders.length;

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr className="border-b border-[color:var(--border-strong)]">
						<th className="text-left text-xs font-semibold text-[color:var(--text-secondary)] px-3 py-3 min-w-36">
							Métrica
						</th>
						{weekHeaders.map((h) => (
							<th
								key={h}
								className="text-center text-xs font-semibold text-[color:var(--text-secondary)] px-3 py-3"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{MARKETING_ROWS.map(([label, key], ri) => {
						const isFreq = key === "frequency";
						return (
							<tr key={key} className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
								<td className="text-xs font-medium text-[color:var(--text-primary)] px-3 py-2">
									{label}
								</td>
								{weeklyStr[key].map((cell, wi) => (
									<td
										key={`${key}-${weekHeaders[wi] ?? wi}`}
										className="px-2 py-2 text-center"
									>
										<Input
											value={isFreq ? cell : formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(
													pastedText,
													isFreq,
												);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onMatrixChange(key, wi, cleanedValue);
												}
											}}
											onChange={(e) => onMatrixChange(key, wi, e.target.value)}
											tabIndex={wi * gridTotalRows + ri + 1}
											className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
										/>
									</td>
								))}
							</tr>
						);
					})}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-bold text-[#ff6100] pt-5 pb-2 px-3 border-b border-[color:var(--border-subtle)]"
						>
							Funil semanal
						</td>
					</tr>
					{FUNNEL_ROWS.map(([label, key], ri) => (
						<tr key={key} className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
							<td className="text-xs font-medium text-[color:var(--text-primary)] px-3 py-2">
								{label}
							</td>
							{weeklyStr[key].map((cell, wi) => (
								<td
									key={`${key}-${weekHeaders[wi] ?? wi}`}
									className="px-2 py-2 text-center"
								>
									<Input
										value={formatThousands(cell)}
										onPaste={(e) => {
											const pastedText = e.clipboardData.getData("text");
											const cleanedValue = cleanPastedValue(pastedText, false);
											if (cleanedValue !== pastedText) {
												e.preventDefault();
												onMatrixChange(key, wi, cleanedValue);
											}
										}}
										onChange={(e) => onMatrixChange(key, wi, e.target.value)}
										tabIndex={wi * gridTotalRows + (ri + 4) + 1}
										className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
									/>
								</td>
							))}
						</tr>
					))}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-bold text-[#ff6100] pt-5 pb-2 px-3 border-b border-[color:var(--border-subtle)]"
						>
							Vendas por recepcionista
						</td>
					</tr>
					{recepWeekRows.map((row, ri) => (
						<React.Fragment key={row.id}>
							<tr className="bg-[color:var(--surface-muted)]/50">
								<td
									colSpan={nWeeks + 1}
									className="text-xs font-semibold text-[color:var(--text-primary)] px-3 py-2 border-b border-[color:var(--border-subtle)]"
								>
									{row.name}
								</td>
							</tr>
							<tr className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
								<td className="px-3 py-2 text-xs font-medium text-[color:var(--text-secondary)] min-w-36">
									Cadastrados
								</td>
								{row.leads.map((cell, wi) => (
									<td
										key={`${row.id}-leads-w${wi}`}
										className="px-2 py-2 text-center"
									>
										<Input
											value={formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(
													pastedText,
													false,
												);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onRecepCellChange(
														row.id,
														"leads",
														wi,
														cleanedValue,
													);
												}
											}}
											onChange={(e) =>
												onRecepCellChange(row.id, "leads", wi, e.target.value)
											}
											tabIndex={wi * gridTotalRows + (ri * 2 + 7) + 1}
											className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
										/>
									</td>
								))}
							</tr>
							<tr className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
								<td className="px-3 py-2 text-xs font-medium text-[color:var(--text-secondary)] min-w-36">
									Convertidos
								</td>
								{row.sales.map((cell, wi) => (
									<td
										key={`${row.id}-sales-w${wi}`}
										className="px-2 py-2 text-center"
									>
										<Input
											value={formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(
													pastedText,
													false,
												);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onRecepCellChange(
														row.id,
														"sales",
														wi,
														cleanedValue,
													);
												}
											}}
											onChange={(e) =>
												onRecepCellChange(row.id, "sales", wi, e.target.value)
											}
											tabIndex={wi * gridTotalRows + (ri * 2 + 8) + 1}
											className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
										/>
									</td>
								))}
							</tr>
						</React.Fragment>
					))}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-bold text-[#ff6100] pt-5 pb-2 px-3 border-b border-[color:var(--border-subtle)]"
						>
							Vendas (todos os canais)
						</td>
					</tr>
					<tr className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
						<td className="text-xs font-medium text-[color:var(--text-secondary)] px-3 py-2">
							Total cadastrados
						</td>
						{weeklyStr.leadsTot.map((cell, wi) => (
							<td
								key={`leadsTot-${weekHeaders[wi] ?? wi}`}
								className="px-2 py-2 text-center"
							>
								<Input
									value={formatThousands(cell)}
									onPaste={(e) => {
										const pastedText = e.clipboardData.getData("text");
										const cleanedValue = cleanPastedValue(pastedText, false);
										if (cleanedValue !== pastedText) {
											e.preventDefault();
											onMatrixChange("leadsTot", wi, cleanedValue);
										}
									}}
									onChange={(e) =>
										onMatrixChange("leadsTot", wi, e.target.value)
									}
									tabIndex={
										wi * gridTotalRows + (7 + recepWeekRows.length * 2) + 1
									}
									className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
								/>
							</td>
						))}
					</tr>
					<tr className="border-b border-[color:var(--border-subtle)] hover:bg-black/[0.02]">
						<td className="text-xs font-medium text-[color:var(--text-secondary)] px-3 py-2">
							Total convertidos
						</td>
						{weeklyStr.salesTot.map((cell, wi) => (
							<td
								key={`salesTot-${weekHeaders[wi] ?? wi}`}
								className="px-2 py-2 text-center"
							>
								<Input
									value={formatThousands(cell)}
									onPaste={(e) => {
										const pastedText = e.clipboardData.getData("text");
										const cleanedValue = cleanPastedValue(pastedText, false);
										if (cleanedValue !== pastedText) {
											e.preventDefault();
											onMatrixChange("salesTot", wi, cleanedValue);
										}
									}}
									onChange={(e) =>
										onMatrixChange("salesTot", wi, e.target.value)
									}
									tabIndex={
										wi * gridTotalRows + (7 + recepWeekRows.length * 2 + 1) + 1
									}
									className="w-20 h-8 text-right text-sm bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
								/>
							</td>
						))}
					</tr>
				</tbody>
			</table>
		</div>
	);
}
