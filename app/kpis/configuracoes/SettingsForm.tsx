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
					<h1 className="mb-1 font-[var(--font-kpi-display)] text-[clamp(42px,7vw,72px)] font-black italic uppercase leading-[0.95] tracking-tight text-slate-950">
						Configurações
					</h1>
					<p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
						Gerencie as configurações da academia, metas e integrações.
					</p>
					</div>
					<div className="h-12 w-12 shrink-0 bg-[#ff6100] text-center font-[var(--font-kpi-display)] text-2xl font-black leading-[48px] text-white [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%,0_22%)]" aria-hidden>
						P
					</div>
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
