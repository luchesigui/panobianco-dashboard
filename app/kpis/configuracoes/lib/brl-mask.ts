export function formatBrlIntegerMask(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";
	const value = Number(digits);
	if (!Number.isFinite(value)) return "";
	return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value)}`;
}

/** Igual a formatBrlIntegerMask, mas preserva um "-" inicial (ex.: "−R$ 12.345"). */
export function formatBrlSignedIntegerMask(raw: string): string {
	const negative = /^\s*[-−]/.test(raw);
	const formatted = formatBrlIntegerMask(raw);
	if (!formatted) return negative ? "−" : "";
	return negative ? `−${formatted}` : formatted;
}

export function parseBrlSignedIntegerMask(masked: string): number | null {
	const value = parseBrlIntegerMask(masked);
	if (value == null) return null;
	return /^\s*[-−]/.test(masked) ? -value : value;
}

export function parseBrlIntegerMask(masked: string): number | null {
	const digits = masked.replace(/\D/g, "");
	if (!digits) return null;
	const value = Number(digits);
	if (!Number.isFinite(value)) return null;
	return value;
}
