"use client";

import type { Consultora } from "./actions";
import { ApiKeysSection } from "./_components/ApiKeysSection";
import { ConsultorasSection } from "./_components/ConsultorasSection";
import { GoalsSection } from "./_components/GoalsSection";
import { GymInfoSection } from "./_components/GymInfoSection";
import { SettingsMessage } from "./_components/SettingsMessage";
import { StudentBaseGoalsSection } from "./_components/StudentBaseGoalsSection";
import { useSettingsForm, type Settings } from "./hooks/useSettingsForm";

type Props = {
	initialSettings: Settings;
	initialStudentBaseGoals: Record<number, number>;
	initialConsultoras: Consultora[];
};

export function SettingsForm({
	initialSettings,
	initialStudentBaseGoals,
	initialConsultoras,
}: Props) {
	const form = useSettingsForm({
		initialSettings,
		initialStudentBaseGoals,
		initialConsultoras,
	});

	return (
		<div className="min-h-screen bg-transparent">
			<div className="max-w-4xl mx-auto px-6 py-10 pb-20">
				<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#cc3300] mb-1">
							Panobianco · Configuração do Sistema
						</p>
						<h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[color:var(--text-primary)]">
							Configurações
						</h1>
						<p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] mt-1">
							Gerencie as configurações da academia, metas e integrações.
						</p>
					</div>
					<div className="selo-chanfrado h-10 w-2.5 bg-[#ff6100] shrink-0" aria-hidden />
				</div>

				<SettingsMessage message={form.message} />

				<div className="space-y-6">
					<GymInfoSection gymInfo={form.gymInfo} />
					<ConsultorasSection
						consultoras={form.consultoras}
						nameInputRefs={form.nameInputRefs}
					/>
					<GoalsSection consultoras={form.consultoras} />
					<StudentBaseGoalsSection studentBaseGoals={form.studentBaseGoals} />
					<ApiKeysSection apiKeys={form.apiKeys} />
				</div>
			</div>
		</div>
	);
}
