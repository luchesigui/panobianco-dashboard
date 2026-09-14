export function slugifyExpenseCode(label: string): string {
	const normalized = label
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
	return `expense_${normalized}`;
}

export function titleFromExpenseCode(code: string): string {
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

/**
 * Checks if an expense center or code refers to dividend distribution (e.g. "Dividendos mensais", "expense_dividendos_eventuais").
 * Dividends are distribution of profits, not operational expenses (OPEX).
 */
export function isDividendExpense(labelOrCode: string | null | undefined): boolean {
	if (!labelOrCode) return false;
	const normalized = labelOrCode
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
	return normalized.includes("dividendo");
}
