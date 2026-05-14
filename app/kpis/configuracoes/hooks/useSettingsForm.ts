"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	saveConsultorasAction,
	saveGymNameAction,
	saveGymSettingsAction,
	saveStudentBaseGoalsAction,
	type Consultora,
} from "../actions";
import {
	formatBrlIntegerMask,
	parseBrlIntegerMask,
} from "../lib/brl-mask";

export type Settings = {
	gymName: string;
	salesTarget: string;
	claudeApiKey: string;
	evoApiToken: string;
	totalInvested: string;
};

export type ConsultoraRow = {
	id?: string;
	name: string;
	monthly_goal: string;
	sort_order: number;
};

type SaveSection =
	| "gymName"
	| "totalInvested"
	| "consultoras"
	| "consultorasGoals"
	| "studentBaseGoals"
	| "apiKeys";

export type StatusMessage = { type: "ok" | "err"; text: string };

type Args = {
	initialSettings: Settings;
	initialStudentBaseGoals: Record<number, number>;
	initialConsultoras: Consultora[];
};

export function useSettingsForm({
	initialSettings,
	initialStudentBaseGoals,
	initialConsultoras,
}: Args) {
	const router = useRouter();
	const [gymName, setGymName] = useState(initialSettings.gymName);
	const [claudeApiKey, setClaudeApiKey] = useState(initialSettings.claudeApiKey);
	const [evoApiToken, setEvoApiToken] = useState(initialSettings.evoApiToken);
	const [totalInvested, setTotalInvested] = useState(() =>
		formatBrlIntegerMask(initialSettings.totalInvested),
	);
	const [studentBaseGoals, setStudentBaseGoals] = useState<
		Record<number, string>
	>(() => {
		const init: Record<number, string> = {};
		for (let m = 1; m <= 12; m++) {
			init[m] =
				initialStudentBaseGoals[m] != null
					? String(initialStudentBaseGoals[m])
					: "";
		}
		return init;
	});
	const [consultoras, setConsultoras] = useState<ConsultoraRow[]>(() =>
		initialConsultoras.map((c) => ({
			id: c.id,
			name: c.name,
			monthly_goal: c.monthly_goal != null ? String(c.monthly_goal) : "",
			sort_order: c.sort_order,
		})),
	);
	const [savingSections, setSavingSections] = useState<
		Record<SaveSection, boolean>
	>({
		gymName: false,
		totalInvested: false,
		consultoras: false,
		consultorasGoals: false,
		studentBaseGoals: false,
		apiKeys: false,
	});
	const [message, setMessage] = useState<StatusMessage | null>(null);

	const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const consultorasTotal = consultoras.reduce((sum, c) => {
		const v = Number(c.monthly_goal);
		return sum + (Number.isFinite(v) && v > 0 ? v : 0);
	}, 0);

	const setSectionSaving = useCallback(
		(section: SaveSection, isSaving: boolean) => {
			setSavingSections((prev) => ({ ...prev, [section]: isSaving }));
		},
		[],
	);

	const handleSaveGymName = useCallback(async () => {
		setSectionSaving("gymName", true);
		setMessage(null);
		const res = await saveGymNameAction(gymName);
		if (res.ok) {
			setMessage({ type: "ok", text: "Nome da academia atualizado." });
			router.refresh();
		} else {
			setMessage({ type: "err", text: res.error });
		}
		setSectionSaving("gymName", false);
	}, [gymName, router, setSectionSaving]);

	const handleSaveApiKeys = useCallback(async () => {
		setSectionSaving("apiKeys", true);
		setMessage(null);
		const res = await saveGymSettingsAction({
			claudeApiKey: claudeApiKey || undefined,
			evoApiToken: evoApiToken || undefined,
		});
		if (res.ok) {
			setMessage({ type: "ok", text: "Chaves salvas." });
		} else {
			setMessage({ type: "err", text: res.error });
		}
		setSectionSaving("apiKeys", false);
	}, [claudeApiKey, evoApiToken, setSectionSaving]);

	const handleSaveTotalInvested = useCallback(async () => {
		setSectionSaving("totalInvested", true);
		setMessage(null);
		const parsed = parseBrlIntegerMask(totalInvested);
		if (totalInvested.trim() !== "" && (parsed == null || parsed < 0)) {
			setMessage({
				type: "err",
				text: "Informe um valor numérico válido para investimento total.",
			});
			setSectionSaving("totalInvested", false);
			return;
		}
		const res = await saveGymSettingsAction({
			totalInvested:
				totalInvested.trim() === "" ? "" : (parsed ?? undefined),
		});
		if (res.ok) {
			setMessage({ type: "ok", text: "Investimento total salvo." });
			router.refresh();
		} else {
			setMessage({ type: "err", text: res.error });
		}
		setSectionSaving("totalInvested", false);
	}, [totalInvested, router, setSectionSaving]);

	const handleSaveStudentBaseGoals = useCallback(async () => {
		setSectionSaving("studentBaseGoals", true);
		setMessage(null);
		const goals: Record<number, number> = {};
		for (let m = 1; m <= 12; m++) {
			const v = Number(studentBaseGoals[m]);
			if (studentBaseGoals[m] !== "" && Number.isFinite(v) && v > 0) {
				goals[m] = v;
			}
		}
		const res = await saveStudentBaseGoalsAction(goals);
		if (res.ok) {
			setMessage({ type: "ok", text: "Metas de base de alunos salvas." });
		} else {
			setMessage({ type: "err", text: res.error });
		}
		setSectionSaving("studentBaseGoals", false);
	}, [studentBaseGoals, setSectionSaving]);

	const handleSaveConsultoras = useCallback(
		async (section: "consultoras" | "consultorasGoals") => {
			setSectionSaving(section, true);
			setMessage(null);
			const validRows = consultoras
				.filter((c) => c.name.trim())
				.map((c, i) => ({
					id: c.id,
					name: c.name.trim(),
					monthly_goal: c.monthly_goal !== "" ? Number(c.monthly_goal) : null,
					sort_order: i,
				}));
			const res = await saveConsultorasAction(validRows);
			if (res.ok) {
				setMessage({ type: "ok", text: "Consultoras salvas." });
				router.refresh();
			} else {
				setMessage({ type: "err", text: res.error });
			}
			setSectionSaving(section, false);
		},
		[consultoras, router, setSectionSaving],
	);

	const addConsultora = useCallback(() => {
		setConsultoras((prev) => [
			...prev,
			{ name: "", monthly_goal: "", sort_order: prev.length },
		]);
		setTimeout(() => {
			nameInputRefs.current[consultoras.length]?.focus();
		}, 0);
	}, [consultoras.length]);

	const removeConsultora = useCallback((index: number) => {
		setConsultoras((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const updateConsultora = useCallback(
		(index: number, field: keyof ConsultoraRow, value: string) => {
			setConsultoras((prev) =>
				prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
			);
		},
		[],
	);

	const updateStudentBaseGoal = useCallback(
		(month: number, value: string) => {
			setStudentBaseGoals((prev) => ({ ...prev, [month]: value }));
		},
		[],
	);

	return {
		message,
		nameInputRefs,
		gymInfo: {
			gymName,
			setGymName,
			totalInvested,
			setTotalInvested,
			savingName: savingSections.gymName,
			savingTotalInvested: savingSections.totalInvested,
			handleSaveGymName,
			handleSaveTotalInvested,
		},
		consultoras: {
			rows: consultoras,
			total: consultorasTotal,
			saving: savingSections.consultoras,
			savingGoals: savingSections.consultorasGoals,
			addConsultora,
			removeConsultora,
			updateConsultora,
			handleSaveConsultoras,
		},
		studentBaseGoals: {
			values: studentBaseGoals,
			update: updateStudentBaseGoal,
			saving: savingSections.studentBaseGoals,
			handleSave: handleSaveStudentBaseGoals,
		},
		apiKeys: {
			claudeApiKey,
			setClaudeApiKey,
			evoApiToken,
			setEvoApiToken,
			saving: savingSections.apiKeys,
			handleSave: handleSaveApiKeys,
		},
	};
}

export type UseSettingsForm = ReturnType<typeof useSettingsForm>;
