import { loadEntradaPageData } from "@/lib/data/entrada-load";
import { NextResponse } from "next/server";

function normalizePeriod(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gymSlug = searchParams.get("gym") ?? "panobianco-sjc-satelite";
    const period = normalizePeriod(searchParams.get("period"));

    if (!period) {
      return NextResponse.json({ error: "Período inválido." }, { status: 400 });
    }

    const data = await loadEntradaPageData(gymSlug, period);
    return NextResponse.json(
      {
        kpiValues: data.kpiValues,
        metaByCode: data.metaByCode,
        smPayload: data.smPayload,
      },
      {
        headers: {
          // Cache curto no browser por URL (gym + period).
          "Cache-Control": "private, max-age=90, stale-while-revalidate=180",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
