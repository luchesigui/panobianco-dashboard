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
				<div className="mb-8">
					<p className="text-sm font-semibold text-[#cc3300] mb-2">
						Panobianco · Configuração do Sistema
					</p>
					<h1 className="font-display text-4xl sm:text-[3.5rem] font-bold leading-[0.96] tracking-tight text-[color:var(--text-primary)]">
						Configurações
					</h1>
					<p className="text-base sm:text-[1.5rem] leading-snug font-normal text-[color:var(--text-secondary)] mt-3">
						Gerencie as configurações da academia, metas e integrações.
					</p>
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
