export function parsePtBrNumber(raw: string): number | undefined {
	const t = raw.trim();
	if (t === "") return undefined;
	const hasComma = t.includes(",");
	const hasDot = t.includes(".");
	const dotAsThousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(t);

	let normalized = t;
	if (hasComma) {
		normalized = t.replace(/\./g, "").replace(",", ".");
	} else if (hasDot && dotAsThousandsOnly) {
		normalized = t.replace(/\./g, "");
	}

	const n = Number(normalized);
	return Number.isFinite(n) ? n : undefined;
}

export function numRowToStrings(
	arr: Array<number | null | undefined> | undefined,
	n: number,
): string[] {
	const out: string[] = [];
	for (let i = 0; i < n; i++) {
		const v = arr?.[i];
		out.push(v == null || v === undefined ? "" : String(v));
	}
	return out;
}

export function stringsToNumRow(s: string[]): Array<number | null> {
	return s.map((x) => {
		const v = parsePtBrNumber(x);
		return v === undefined ? null : v;
	});
}

export function formatCurrency(raw: string): string {
	if (!raw.trim()) return "";
	const num = parsePtBrNumber(raw);
	if (num === undefined) return raw;
	return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(num)}`;
}

export function formatMonthPtBr(yyyyMm: string): string {
	if (!yyyyMm) return "";
	const d = new Date(`${yyyyMm}-01T12:00:00`);
	const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(d);
	return `${month.charAt(0).toUpperCase() + month.slice(1)}/${d.getFullYear()}`;
}
