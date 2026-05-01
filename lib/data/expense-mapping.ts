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
