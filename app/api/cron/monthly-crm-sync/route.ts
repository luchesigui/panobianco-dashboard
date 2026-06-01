import { NextResponse } from "next/server";
import { validateApiRequest } from "@/lib/auth";

/**
 * Vercel Cron (production only): dia 1 de cada mês, 00:05 UTC.
 * Para ~00:05 America/Sao_Paulo, ajuste o schedule em vercel.json (ex.: 5 3 1 * * ≈ BRT).
 *
 * Defina CRON_SECRET no projeto Vercel; a plataforma envia Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: Request) {
	const auth = validateApiRequest(req);
	if (!auth.isValid) {
		return NextResponse.json({ error: auth.error || "Não autorizado." }, { status: auth.status || 401 });
	}

	const today = new Date();

	const formatDate = (date: Date) => {
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const dd = String(date.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	};

	const prevStart = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
	const prevEnd = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));

	const currStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
	const currEnd = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));

	const origin = new URL(req.url).origin;
	const paths = [
		`/api/receivables?requery&dueDateStart=${prevStart}&dueDateEnd=${prevEnd}`,
		`/api/payables?requery&dueDateStart=${prevStart}&dueDateEnd=${prevEnd}`,
		`/api/receivables?requery&dueDateStart=${currStart}&dueDateEnd=${currEnd}`,
		`/api/payables?requery&dueDateStart=${currStart}&dueDateEnd=${currEnd}`,
	];

	const results = await Promise.all(
		paths.map(async (path) => {
			const res = await fetch(`${origin}${path}`, { method: "GET" });
			let body: unknown = null;
			try {
				body = await res.json();
			} catch {
				body = null;
			}
			return { path, status: res.status, body };
		}),
	);

	return NextResponse.json({ ok: true, results });
}
