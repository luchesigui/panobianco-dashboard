export const EXPENSE_LABEL_MAP: Record<string, string> = {
	expense_fgts: "FGTS",
	expense_inss: "INSS",
	expense_iptu: "IPTU",
	expense_irrf: "IRRF",
	expense_agua: "Água",
	expense_contribuicao_social: "Contribuição Social",
	expense_maquinas: "Máquinas",
	expense_13o_salario: "13º Salário",
};

export function titleFromExpenseCode(code: string): string {
	if (code in EXPENSE_LABEL_MAP) return EXPENSE_LABEL_MAP[code] ?? code;
	const raw = code
		.replace(/^expense_/, "")
		.replace(/_/g, " ")
		.trim();
	if (!raw) return code;
	return raw
		.split(" ")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
