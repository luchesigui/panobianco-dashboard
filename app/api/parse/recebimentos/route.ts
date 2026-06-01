import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { saveMonthlyKpisAction } from "@/app/kpis/entrada-dados/actions";
import { mapRevenueGroupsToCodes } from "@/lib/data/revenue-mapping";
import { validateApiRequest } from "@/lib/auth";

function parseCurrency(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const cleaned = value
    .trim()
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const save = searchParams.get("save") === "true";
    const gymParam = searchParams.get("gym") || "panobianco-sjc-satelite";
    const periodParam = searchParams.get("period");

    if (save) {
      const auth = validateApiRequest(req);
      if (!auth.isValid) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      if (!periodParam || !/^\d{4}-\d{2}-\d{2}$/.test(periodParam)) {
        return NextResponse.json({ error: "Parâmetro 'period' inválido ou ausente. Formato esperado: YYYY-MM-DD." }, { status: 400 });
      }
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "Planilha sem abas." }, { status: 400 });
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: true,
    });
    if (rows.length === 0) {
      return NextResponse.json({ error: "Planilha sem linhas de dados." }, { status: 400 });
    }

    const groups: Record<string, number> = {};
    let matchedRows = 0;
    for (const row of rows) {
      const centerRaw = row["Centro de receita"];
      const valueRawBaixa = row["Valor de baixa"] ?? row["Valor baixa"] ?? row["Valor"];
      let center = typeof centerRaw === "string" ? centerRaw.trim() : "";

      // Check if any column name resembles a description, and if its value contains "Wellhub"
      let rowDescription = "";
      for (const [k, v] of Object.entries(row)) {
        const keyLower = k.toLowerCase();
        if (
          (keyLower.includes("descri") ||
            keyLower.includes("detalhe") ||
            keyLower.includes("hist")) &&
          typeof v === "string"
        ) {
          rowDescription = v;
          break;
        }
      }

      if (rowDescription.toLowerCase().includes("wellhub")) {
        center = "Receita Wellhub";
      }

      if (!center) continue;
      const parsedValorBaixa = parseCurrency(valueRawBaixa);
      groups[center] = (groups[center] ?? 0) + parsedValorBaixa;
      matchedRows += 1;
    }

    const total = Object.values(groups).reduce((acc, value) => acc + value, 0);
    const response = { groups, total, matchedRows };

    if (save && periodParam) {
      const mapped = mapRevenueGroupsToCodes(groups);
      const revenueTotal =
        (mapped.matriculated_revenue ?? 0) +
        (mapped.wellhub_revenue ?? 0) +
        (mapped.totalpass_revenue ?? 0) +
        (mapped.products_revenue ?? 0);

      const saveRes = await saveMonthlyKpisAction({
        gymSlug: gymParam,
        periodId: periodParam,
        values: {
          matriculated_revenue: mapped.matriculated_revenue,
          wellhub_revenue: mapped.wellhub_revenue,
          totalpass_revenue: mapped.totalpass_revenue,
          products_revenue: mapped.products_revenue,
          revenue_total: revenueTotal,
        },
        metaByCode: {
          revenue_total: { breakdown: groups },
        },
      });

      if (!saveRes.ok) {
        return NextResponse.json({ error: `Erro ao salvar no banco: ${saveRes.error}` }, { status: 500 });
      }

      return NextResponse.json({ ok: true, ...response });
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
