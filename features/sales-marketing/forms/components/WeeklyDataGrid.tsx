"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import type { RecepWeekRow, WeeklyStrings } from "../types";
import {
	cleanPastedValue,
	formatThousands,
} from "@/app/kpis/entrada-dados/lib/parsers";

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
	["Agendadas", "scheduledWeekly"],
	["Presenças", "attendanceWeekly"],
	["Fechamentos", "closingsWeekly"],
] as const;

export function WeeklyDataGrid({
	weekHeaders,
	weeklyStr,
	recepWeekRows,
	gridTotalRows,
	onMatrixChange,
	onRecepCellChange,
}: Props) {
	const weekCount = weekHeaders.length;

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr>
						<th className="text-left text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5 min-w-36">
							Métrica
						</th>
						{weekHeaders.map((header) => (
							<th
								key={header}
								className="text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{MARKETING_ROWS.map(([label, key], rowIndex) => {
						const isFrequency = key === "frequency";
						return (
							<tr key={key} className="hover:bg-slate-50/50">
								<td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">
									{label}
								</td>
								{weeklyStr[key].map((cell, weekIdx) => (
									<td
										key={`${key}-${weekHeaders[weekIdx] ?? weekIdx}`}
										className="border border-slate-200 px-1.5 py-1.5"
									>
										<Input
											value={isFrequency ? cell : formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(
													pastedText,
													isFrequency,
												);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onMatrixChange(key, weekIdx, cleanedValue);
												}
											}}
											onChange={(e) => onMatrixChange(key, weekIdx, e.target.value)}
											tabIndex={weekIdx * gridTotalRows + rowIndex + 1}
											className="w-20 h-8 text-right text-sm bg-white border-slate-200"
										/>
									</td>
								))}
							</tr>
						);
					})}
					<tr>
						<td
							colSpan={weekCount + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Funil semanal
						</td>
					</tr>
					{FUNNEL_ROWS.map(([label, key], rowIndex) => (
						<tr key={key} className="hover:bg-slate-50/50">
							<td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">
								{label}
							</td>
							{weeklyStr[key].map((cell, weekIdx) => (
								<td
									key={`${key}-${weekHeaders[weekIdx] ?? weekIdx}`}
									className="border border-slate-200 px-1.5 py-1.5"
								>
									<Input
										value={formatThousands(cell)}
										onPaste={(e) => {
											const pastedText = e.clipboardData.getData("text");
											const cleanedValue = cleanPastedValue(pastedText, false);
											if (cleanedValue !== pastedText) {
												e.preventDefault();
												onMatrixChange(key, weekIdx, cleanedValue);
											}
										}}
										onChange={(e) => onMatrixChange(key, weekIdx, e.target.value)}
										tabIndex={weekIdx * gridTotalRows + (rowIndex + 4) + 1}
										className="w-20 h-8 text-right text-sm bg-white border-slate-200"
									/>
								</td>
							))}
						</tr>
					))}
					<tr>
						<td
							colSpan={weekCount + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Vendas — por recepcionista
						</td>
					</tr>
					{recepWeekRows.map((row, rowIndex) => (
						<React.Fragment key={row.id}>
							<tr>
								<td
									colSpan={weekCount + 1}
									className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 border border-slate-200 px-3 py-1.5"
								>
									{row.name}
								</td>
							</tr>
							<tr className="hover:bg-slate-50/50">
								<td className="border border-slate-200 px-3 py-1.5 bg-white text-[10px] font-medium text-slate-400 uppercase tracking-tight min-w-36">
									Cadastrados
								</td>
								{row.leads.map((cell, weekIdx) => (
									<td
										key={`${row.id}-leads-w${weekIdx}`}
										className="border border-slate-200 px-1.5 py-1.5"
									>
										<Input
											value={formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(pastedText, false);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onRecepCellChange(row.id, "leads", weekIdx, cleanedValue);
												}
											}}
											onChange={(e) =>
												onRecepCellChange(row.id, "leads", weekIdx, e.target.value)
											}
											tabIndex={weekIdx * gridTotalRows + (rowIndex * 2 + 7) + 1}
											className="w-20 h-8 text-right text-sm bg-white border-slate-200"
										/>
									</td>
								))}
							</tr>
							<tr className="hover:bg-slate-50/50">
								<td className="border border-slate-200 px-3 py-1.5 bg-white text-[10px] font-medium text-slate-400 uppercase tracking-tight min-w-36">
									Convertidos
								</td>
								{row.sales.map((cell, weekIdx) => (
									<td
										key={`${row.id}-sales-w${weekIdx}`}
										className="border border-slate-200 px-1.5 py-1.5"
									>
										<Input
											value={formatThousands(cell)}
											onPaste={(e) => {
												const pastedText = e.clipboardData.getData("text");
												const cleanedValue = cleanPastedValue(pastedText, false);
												if (cleanedValue !== pastedText) {
													e.preventDefault();
													onRecepCellChange(row.id, "sales", weekIdx, cleanedValue);
												}
											}}
											onChange={(e) =>
												onRecepCellChange(row.id, "sales", weekIdx, e.target.value)
											}
											tabIndex={weekIdx * gridTotalRows + (rowIndex * 2 + 8) + 1}
											className="w-20 h-8 text-right text-sm bg-white border-slate-200"
										/>
									</td>
								))}
							</tr>
						</React.Fragment>
					))}
					<tr>
						<td
							colSpan={weekCount + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Vendas (todos canais)
						</td>
					</tr>
					<tr className="hover:bg-slate-50/50">
						<td className="text-[10px] font-medium text-slate-400 border border-slate-200 px-3 py-1.5 bg-white uppercase tracking-tight">
							Total Cadastrados
						</td>
						{weeklyStr.totalLeadsWeekly.map((cell, weekIdx) => (
							<td
								key={`totalLeadsWeekly-${weekHeaders[weekIdx] ?? weekIdx}`}
								className="border border-slate-200 px-1.5 py-1.5"
							>
								<Input
									value={formatThousands(cell)}
									onPaste={(e) => {
										const pastedText = e.clipboardData.getData("text");
										const cleanedValue = cleanPastedValue(pastedText, false);
										if (cleanedValue !== pastedText) {
											e.preventDefault();
											onMatrixChange("totalLeadsWeekly", weekIdx, cleanedValue);
										}
									}}
									onChange={(e) =>
										onMatrixChange("totalLeadsWeekly", weekIdx, e.target.value)
									}
									tabIndex={
										weekIdx * gridTotalRows + (7 + recepWeekRows.length * 2) + 1
									}
									className="w-20 h-8 text-right text-sm bg-white border-slate-200"
								/>
							</td>
						))}
					</tr>
					<tr className="hover:bg-slate-50/50">
						<td className="text-[10px] font-medium text-slate-400 border border-slate-200 px-3 py-1.5 bg-white uppercase tracking-tight">
							Total Convertidos
						</td>
						{weeklyStr.totalSalesWeekly.map((cell, weekIdx) => (
							<td
								key={`totalSalesWeekly-${weekHeaders[weekIdx] ?? weekIdx}`}
								className="border border-slate-200 px-1.5 py-1.5"
							>
								<Input
									value={formatThousands(cell)}
									onPaste={(e) => {
										const pastedText = e.clipboardData.getData("text");
										const cleanedValue = cleanPastedValue(pastedText, false);
										if (cleanedValue !== pastedText) {
											e.preventDefault();
											onMatrixChange("totalSalesWeekly", weekIdx, cleanedValue);
										}
									}}
									onChange={(e) =>
										onMatrixChange("totalSalesWeekly", weekIdx, e.target.value)
									}
									tabIndex={
										weekIdx * gridTotalRows +
										(7 + recepWeekRows.length * 2 + 1) +
										1
									}
									className="w-20 h-8 text-right text-sm bg-white border-slate-200"
								/>
							</td>
						))}
					</tr>
				</tbody>
			</table>
		</div>
	);
}
