"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import type { RecepWeekRow, WeeklyStrings } from "../lib/types";

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
					<tr>
						<th className="text-left text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5 min-w-36">
							Métrica
						</th>
						{weekHeaders.map((h) => (
							<th
								key={h}
								className="text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2.5"
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{MARKETING_ROWS.map(([label, key], ri) => (
						<tr key={key} className="hover:bg-slate-50/50">
							<td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">
								{label}
							</td>
							{weeklyStr[key].map((cell, wi) => (
								<td
									key={`${key}-${weekHeaders[wi] ?? wi}`}
									className="border border-slate-200 px-1.5 py-1.5"
								>
									<Input
										value={cell}
										onChange={(e) => onMatrixChange(key, wi, e.target.value)}
										tabIndex={wi * gridTotalRows + ri + 1}
										className="w-20 h-8 text-right text-sm bg-white border-slate-200"
									/>
								</td>
							))}
						</tr>
					))}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Funil semanal
						</td>
					</tr>
					{FUNNEL_ROWS.map(([label, key], ri) => (
						<tr key={key} className="hover:bg-slate-50/50">
							<td className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 bg-slate-50/70">
								{label}
							</td>
							{weeklyStr[key].map((cell, wi) => (
								<td
									key={`${key}-${weekHeaders[wi] ?? wi}`}
									className="border border-slate-200 px-1.5 py-1.5"
								>
									<Input
										value={cell}
										onChange={(e) => onMatrixChange(key, wi, e.target.value)}
										tabIndex={wi * gridTotalRows + (ri + 4) + 1}
										className="w-20 h-8 text-right text-sm bg-white border-slate-200"
									/>
								</td>
							))}
						</tr>
					))}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Vendas — por recepcionista
						</td>
					</tr>
					{recepWeekRows.map((row, ri) => (
						<React.Fragment key={row.id}>
							<tr>
								<td
									colSpan={nWeeks + 1}
									className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 border border-slate-200 px-3 py-1.5"
								>
									{row.name}
								</td>
							</tr>
							<tr className="hover:bg-slate-50/50">
								<td className="border border-slate-200 px-3 py-1.5 bg-white text-[10px] font-medium text-slate-400 uppercase tracking-tight min-w-36">
									Cadastrados
								</td>
								{row.leads.map((cell, wi) => (
									<td
										key={`${row.id}-leads-w${wi}`}
										className="border border-slate-200 px-1.5 py-1.5"
									>
										<Input
											value={cell}
											onChange={(e) =>
												onRecepCellChange(row.id, "leads", wi, e.target.value)
											}
											tabIndex={wi * gridTotalRows + (ri * 2 + 7) + 1}
											className="w-20 h-8 text-right text-sm bg-white border-slate-200"
										/>
									</td>
								))}
							</tr>
							<tr className="hover:bg-slate-50/50">
								<td className="border border-slate-200 px-3 py-1.5 bg-white text-[10px] font-medium text-slate-400 uppercase tracking-tight min-w-36">
									Convertidos
								</td>
								{row.sales.map((cell, wi) => (
									<td
										key={`${row.id}-sales-w${wi}`}
										className="border border-slate-200 px-1.5 py-1.5"
									>
										<Input
											value={cell}
											onChange={(e) =>
												onRecepCellChange(row.id, "sales", wi, e.target.value)
											}
											tabIndex={wi * gridTotalRows + (ri * 2 + 8) + 1}
											className="w-20 h-8 text-right text-sm bg-white border-slate-200"
										/>
									</td>
								))}
							</tr>
						</React.Fragment>
					))}
					<tr>
						<td
							colSpan={nWeeks + 1}
							className="text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2"
						>
							Vendas (todos canais)
						</td>
					</tr>
					<tr className="hover:bg-slate-50/50">
						<td className="text-[10px] font-medium text-slate-400 border border-slate-200 px-3 py-1.5 bg-white uppercase tracking-tight">
							Total Cadastrados
						</td>
						{weeklyStr.leadsTot.map((cell, wi) => (
							<td
								key={`leadsTot-${weekHeaders[wi] ?? wi}`}
								className="border border-slate-200 px-1.5 py-1.5"
							>
								<Input
									value={cell}
									onChange={(e) =>
										onMatrixChange("leadsTot", wi, e.target.value)
									}
									tabIndex={
										wi * gridTotalRows + (7 + recepWeekRows.length * 2) + 1
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
						{weeklyStr.salesTot.map((cell, wi) => (
							<td
								key={`salesTot-${weekHeaders[wi] ?? wi}`}
								className="border border-slate-200 px-1.5 py-1.5"
							>
								<Input
									value={cell}
									onChange={(e) =>
										onMatrixChange("salesTot", wi, e.target.value)
									}
									tabIndex={
										wi * gridTotalRows + (7 + recepWeekRows.length * 2 + 1) + 1
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
