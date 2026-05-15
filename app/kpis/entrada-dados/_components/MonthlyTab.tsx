"use client";

import { Fragment, useState } from "react";
import {
	KPI_FORM_GROUPS,
	type KpiFormField,
	type KpiFormGroup,
} from "@/lib/data/dashboard-input-requirements";
import { mapRevenueGroupsToCodes } from "@/lib/data/revenue-mapping";
import type { UseKpiForm } from "../hooks/useKpiForm";
import type { UseFormLockState } from "../hooks/useFormLockState";
import type { UseSmDashboard } from "../hooks/useSmDashboard";
import { parsePtBrNumber } from "../lib/parsers";
import { ExpenseSection } from "./ExpenseSection";
import { FileUploadArea } from "./FileUploadArea";
import { FunnelAndReceptionistsCard } from "./FunnelAndReceptionistsCard";
import { KpiFormSection } from "./KpiFormSection";
import { RevenueBreakdownTable } from "./RevenueBreakdownTable";
import { SaveButton } from "./SaveButton";

type UploadHandle = {
	uploading: boolean;
	handleFile: (file: File) => Promise<void>;
};

type Props = {
	kpi: UseKpiForm;
	sm: UseSmDashboard;
	lock: UseFormLockState;
	uploads: {
		crescimento: UploadHandle;
		recebimentos: UploadHandle;
		custos: UploadHandle;
		recuperacao: UploadHandle;
	};
	onSaveAll: () => void;
	saving: boolean;
};

const monthlyGroups: KpiFormGroup[] = [
	...KPI_FORM_GROUPS.filter(
		(group) => group.id === "overview" || group.id === "finance_revenues",
	),
	...KPI_FORM_GROUPS.filter(
		(group) =>
			group.id !== "overview" &&
			group.id !== "finance_revenues",
	),
];

export function MonthlyTab({
	kpi,
	sm,
	lock,
	uploads,
	onSaveAll,
	saving,
}: Props) {
	const [focusedKey, setFocusedKey] = useState<string | null>(null);
	const onFocus = (key: string) => setFocusedKey(key);
	const onBlur = () => setFocusedKey(null);

	const shouldShowRevenueField = (code: string): boolean =>
		lock.isRevenueFieldAlwaysEditable(code) || kpi.hasRecebimentosBreakdown;

	const getFieldDisabledFor = (groupId: string) => (field: KpiFormField) => {
		if (groupId === "overview") return lock.isGroupLocked("overview");
		if (groupId === "finance_revenues") {
			if (lock.isRevenueFieldAlwaysEditable(field.code)) return false;
			return lock.isGroupLocked("finance_revenues");
		}
		return lock.isGroupLocked(groupId);
	};

	const renderHeaderSlot = (groupId: string) => {
		if (groupId === "overview") {
			return (
				<div className="mb-4">
					<FileUploadArea
						label="Importe o arquivo de relatório de crescimento."
						onFile={(file) => void uploads.crescimento.handleFile(file)}
						loading={uploads.crescimento.uploading}
					/>
				</div>
			);
		}
		if (groupId === "retention") {
			return (
				<div className="mb-4">
					<FileUploadArea
						label="Importe o arquivo de relatório de inadimplência (recuperação)."
						onFile={(file) => void uploads.recuperacao.handleFile(file)}
						loading={uploads.recuperacao.uploading}
					/>
				</div>
			);
		}
		if (groupId === "finance_revenues") {
			return (
				<div className="mb-4">
					<FileUploadArea
						label="Importe o arquivo de relatório de centro de receitas."
						onFile={(file) => void uploads.recebimentos.handleFile(file)}
						loading={uploads.recebimentos.uploading}
					/>
				</div>
			);
		}
		return null;
	};

	const isFieldVisibleFor = (groupId: string) => (field: KpiFormField) => {
		if (groupId === "overview")
			return kpi.hasUploadedCrescimento || kpi.hasUploadedRecuperacao;
		if (groupId === "finance_revenues") return shouldShowRevenueField(field.code);
		return true;
	};

	const showLockToggleFor = (groupId: string): boolean => {
		if (groupId === "overview") return true;
		if (groupId === "finance_revenues") return kpi.hasRecebimentosBreakdown;
		return false;
	};

	const onToggleLockFor = (groupId: string) => () => {
		if (groupId === "finance_revenues") {
			lock.setRecebimentosLocked((prev) => !prev);
		} else {
			lock.setCrescimentoLocked((prev) => !prev);
		}
	};

	return (
		<div className="space-y-5">
			{monthlyGroups.map((group) => {
				const isFinanceRevenues = group.id === "finance_revenues";

				let revenueAfterFields: React.ReactNode = null;
				if (isFinanceRevenues) {
					const revenueGroups = mapRevenueGroupsToCodes(
						kpi.recebimentosBreakdown,
					);
					const total =
						revenueGroups.matriculated_revenue +
						(parsePtBrNumber(kpi.kpiInputs["wellhub_revenue"] ?? "") ?? 0) +
						(parsePtBrNumber(kpi.kpiInputs["totalpass_revenue"] ?? "") ?? 0) +
						revenueGroups.products_revenue;
					revenueAfterFields = (
						<RevenueBreakdownTable
							breakdown={kpi.recebimentosBreakdown}
							total={total}
						/>
					);
				}

				const isRetention = group.id === "retention";

				let afterFields: React.ReactNode = null;
				if (isFinanceRevenues) {
					const revenueGroups = mapRevenueGroupsToCodes(
						kpi.recebimentosBreakdown,
					);
					const total =
						revenueGroups.matriculated_revenue +
						(parsePtBrNumber(kpi.kpiInputs["wellhub_revenue"] ?? "") ?? 0) +
						(parsePtBrNumber(kpi.kpiInputs["totalpass_revenue"] ?? "") ?? 0) +
						revenueGroups.products_revenue;
					afterFields = (
						<RevenueBreakdownTable
							breakdown={kpi.recebimentosBreakdown}
							total={total}
						/>
					);
				}

				return (
					<Fragment key={group.id}>
						<KpiFormSection
							title={group.title}
							description={group.description}
							fields={group.fields}
							values={kpi.kpiInputs}
							focusedKey={focusedKey}
							showLockToggle={showLockToggleFor(group.id)}
							locked={lock.isGroupLocked(group.id)}
							onToggleLock={onToggleLockFor(group.id)}
							headerSlot={renderHeaderSlot(group.id)}
							getFieldDisabled={getFieldDisabledFor(group.id)}
							isFieldVisible={isFieldVisibleFor(group.id)}
							afterFieldsSlot={afterFields}
							onFocus={onFocus}
							onBlur={onBlur}
							onChange={kpi.setKpiInput}
						/>
						{isFinanceRevenues ? (
							<ExpenseSection
								entries={kpi.expenseEntries}
								locked={lock.custosLocked}
								uploading={uploads.custos.uploading}
								onToggleLock={() =>
									lock.setCustosLocked((prev) => !prev)
								}
								onUploadFile={(file) => void uploads.custos.handleFile(file)}
								onChange={kpi.updateExpense}
							/>
						) : null}
					</Fragment>
				);
			})}

			<FunnelAndReceptionistsCard
				funnel={sm.funnel}
				onFunnelChange={sm.setFunnelField}
				recepMonth={sm.recepMonth}
				onRecepMonthChange={sm.updateRecepMonthField}
			/>

			<SaveButton onClick={onSaveAll} loading={saving}>
				Salvar dados mensais
			</SaveButton>
		</div>
	);
}
