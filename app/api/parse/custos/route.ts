import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { saveMonthlyKpisAction } from "@/app/kpis/entrada-dados/actions";
import { slugifyExpenseCode } from "@/lib/data/expense-mapping";
import { validateApiRequest } from "@/lib/auth";

function parseCurrency(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const cleaned = value
    .trim()
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/[^\d.,-]/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const dotAsThousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(cleaned);

  let normalized = cleaned;
  if (hasComma) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasDot && dotAsThousandsOnly) {
    normalized = cleaned.replace(/\./g, "");
  }

  const parsed = Number(normalized);
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
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "Planilha sem abas." }, { status: 400 });
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    if (rows.length === 0) {
      return NextResponse.json({ error: "Planilha sem linhas de dados." }, { status: 400 });
    }

    const items: Record<string, number> = {};
    for (const row of rows) {
      const centerRaw = row["Centro de custo"];
      const valueRawBaixa = row["Valor"];
      const center = typeof centerRaw === "string" ? centerRaw.trim() : "";
      if (!center) continue;
      items[center] = (items[center] ?? 0) + parseCurrency(valueRawBaixa);
    }

    const total = Object.values(items).reduce((acc, value) => acc + value, 0);
    const response = { items, total };

    if (save && periodParam) {
      const expenseItems = Object.fromEntries(
        Object.entries(items).map(([label, value]) => [
          slugifyExpenseCode(label),
          Number(value ?? 0),
        ])
      );

      const saveRes = await saveMonthlyKpisAction({
        gymSlug: gymParam,
        periodId: periodParam,
        values: {
          expenses_total: total,
        },
        expenseItems,
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
