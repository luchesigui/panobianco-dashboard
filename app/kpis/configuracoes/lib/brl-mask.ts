export function formatBrlIntegerMask(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";
	const value = Number(digits);
	if (!Number.isFinite(value)) return "";
	return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value)}`;
}

export function parseBrlIntegerMask(masked: string): number | null {
	const digits = masked.replace(/\D/g, "");
	if (!digits) return null;
	const value = Number(digits);
	if (!Number.isFinite(value)) return null;
	return value;
}
