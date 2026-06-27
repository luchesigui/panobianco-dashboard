"use client";

import type { Consultora } from "@/app/kpis/configuracoes/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GymOption } from "@/lib/data/entrada-load";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { SalesMarketingTab } from "@/features/sales-marketing/forms/components/SalesMarketingTab";
import { useSalesMarketingWeeklyFormSection } from "@/features/sales-marketing/forms/hooks/useSalesMarketingWeeklyFormSection";
import { MonthlyTab } from "./_components/MonthlyTab";
import { PageHeader } from "./_components/PageHeader";
import { StatusAlert } from "./_components/StatusAlert";
import { useFileUpload } from "./hooks/useFileUpload";
import { useFormLockState } from "./hooks/useFormLockState";
import { useKpiForm } from "./hooks/useKpiForm";
import { useStatusMessage } from "./hooks/useStatusMessage";
import { parsePtBrNumber } from "./lib/parsers";

type Props = {
	gyms: GymOption[];
	initialGymSlug: string;
	initialPeriodId: string;
	initialKpiValues: Record<string, number>;
	initialMetaByCode: Record<string, Record<string, unknown>>;
	initialSmPayload: SalesMarketingDashboardPayload;
	initialConsultoras: Consultora[];
};

export function EntradaDadosForm({
	gyms,
	initialGymSlug,
	initialPeriodId,
	initialKpiValues,
	initialMetaByCode,
	initialSmPayload,
	initialConsultoras,
}: Props) {
	const status = useStatusMessage();
	const lock = useFormLockState();

	const kpi = useKpiForm({
		initialKpiValues,
		initialMetaByCode,
		gymSlug: initialGymSlug,
		periodId: initialPeriodId,
		onOk: status.showOk,
		onErr: status.showErr,
	});

	const sm = useSalesMarketingWeeklyFormSection({
		initialSmPayload,
		initialConsultoras,
		gymSlug: initialGymSlug,
		periodId: initialPeriodId,
		getMonthlyMarketing: () => ({
			reach: parsePtBrNumber(kpi.kpiInputs["marketing_reach"] ?? "") ?? undefined,
			frequency:
				parsePtBrNumber(kpi.kpiInputs["marketing_frequency"] ?? "") ?? undefined,
			views: parsePtBrNumber(kpi.kpiInputs["marketing_views"] ?? "") ?? undefined,
			followers:
				parsePtBrNumber(kpi.kpiInputs["marketing_followers"] ?? "") ?? undefined,
		}),
		onOk: status.showOk,
		onErr: status.showErr,
	});

	const crescimento = useFileUpload({
		kind: "crescimento",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			kpi.applyCrescimento(json);
			lock.setCrescimentoLocked(true);
			status.showOk("Arquivo de crescimento processado.");
		},
		onError: status.showErr,
	});

	const recebimentos = useFileUpload({
		kind: "recebimentos",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			kpi.applyRecebimentos(json);
			lock.setRecebimentosLocked(true);
			status.showOk("Arquivo de recebimentos processado.");
		},
		onError: status.showErr,
	});

	const custos = useFileUpload({
		kind: "custos",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			kpi.applyCustos(json);
			lock.setCustosLocked(true);
			status.showOk("Arquivo de custos processado.");
		},
		onError: status.showErr,
	});

	const recuperacao = useFileUpload({
		kind: "recuperacao",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			kpi.applyRecuperacao(json);
			status.showOk("Arquivo de inadimplência (recuperação) processado.");
		},
		onError: status.showErr,
	});

	const renovacao = useFileUpload({
		kind: "renovacao",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			kpi.applyRenovacao(json);
			status.showOk("Arquivo de renovação processado.");
		},
		onError: status.showErr,
	});

	const conversion = useFileUpload({
		kind: "conversion",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			sm.applyConversion(json);
			if (typeof json.totalLeads === "number") {
				kpi.setKpiInput("leads_generated", String(json.totalLeads));
			}
			status.showOk("Relatório de vendas/conversão das recepcionistas processado.");
		},
		onError: status.showErr,
	});

	const weeklyConversion = useFileUpload({
		kind: "conversion",
		periodId: initialPeriodId,
		onSuccess: (json) => {
			const targetWeekIdx = sm.applyWeeklyConversion(json);
			const weekLabel = sm.weekHeaders[targetWeekIdx] ?? `S${targetWeekIdx + 1}`;
			status.showOk(`Relatório processado e aplicado à semana ${weekLabel}.`);
		},
		onError: status.showErr,
	});

	const onSaveAll = () => {
		void (async () => {
			status.clear();
			const ok = await kpi.handleSaveKpis();
			if (ok) await sm.handleSaveSm();
		})();
	};

	const monthlySaving = kpi.saving || sm.saving;

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-4xl mx-auto px-6 py-10 pb-20">
				<PageHeader
					gyms={gyms}
					gymSlug={initialGymSlug}
					periodId={initialPeriodId}
				/>

				<StatusAlert message={status.message} />

				<Tabs defaultValue="semanal">
					<TabsList className="mb-6 bg-slate-100 p-1 rounded-lg h-auto">
						<TabsTrigger
							value="semanal"
							className="px-6 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
						>
							Semanal
						</TabsTrigger>
						<TabsTrigger
							value="mensal"
							className="px-6 py-2 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
						>
							Mensal
						</TabsTrigger>
					</TabsList>

					<TabsContent value="mensal">
						<MonthlyTab
							kpi={kpi}
							sm={sm}
							lock={lock}
							uploads={{
								crescimento,
								recebimentos,
								custos,
								recuperacao,
								renovacao,
								conversion,
							}}
							onSaveAll={onSaveAll}
							saving={monthlySaving}
						/>
					</TabsContent>

					<TabsContent value="semanal">
						<SalesMarketingTab
							sm={sm}
							onUploadFile={(file) => void weeklyConversion.handleFile(file)}
							uploading={weeklyConversion.uploading}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
