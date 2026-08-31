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
					<h1 className="mb-1 font-[var(--font-kpi-display)] text-[clamp(32px,5vw,52px)] font-medium uppercase leading-[1] tracking-tight text-[color:var(--text-primary)]">
						Configurações
					</h1>
					<p className="text-xs font-semibold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">
						Gerencie as configurações da academia, metas e integrações.
					</p>
					</div>
					<div className="h-12 w-3 shrink-0 bg-[color:var(--action-primary)]" aria-hidden />
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
