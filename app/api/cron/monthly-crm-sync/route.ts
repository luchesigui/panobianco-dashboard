import { NextResponse } from "next/server";

/**
 * Vercel Cron (production only): dia 1 de cada mês, 00:05 UTC.
 * Para ~00:05 America/Sao_Paulo, ajuste o schedule em vercel.json (ex.: 5 3 1 * * ≈ BRT).
 *
 * Defina CRON_SECRET no projeto Vercel; a plataforma envia Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: Request) {
	const cronSecret = process.env.CRON_SECRET;
	const authHeader = req.headers.get("authorization");
	if (
		!cronSecret ||
		!authHeader ||
		authHeader !== `Bearer ${cronSecret}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const origin = new URL(req.url).origin;
	const paths = ["/api/receivables?requery", "/api/payables?requery"] as const;

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
