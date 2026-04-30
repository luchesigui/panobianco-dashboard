export function mapRevenueGroupsToCodes(
	groups: Record<string, number>,
): Record<string, number> {
	let matriculated = 0;
	let wellhub = 0;
	let totalpass = 0;
	let products = 0;

	for (const [name, value] of Object.entries(groups)) {
		const lower = name.toLowerCase();
		if (lower.startsWith("matriculado")) {
			matriculated += value;
			continue;
		}
		if (lower.includes("wellhub")) {
			wellhub += value;
			continue;
		}
		if (lower.includes("totalpass")) {
			totalpass += value;
			continue;
		}
		products += value;
	}

	return {
		matriculated_revenue: matriculated,
		wellhub_revenue: wellhub,
		totalpass_revenue: totalpass,
		products_revenue: products,
	};
}
