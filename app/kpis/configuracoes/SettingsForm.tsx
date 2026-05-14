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
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-2xl mx-auto px-6 py-10 pb-20">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
						Configurações
					</h1>
					<p className="text-sm text-slate-500">
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
