import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

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
      const valueRawBaixa = row["Valor baixa"];
      const center = typeof centerRaw === "string" ? centerRaw.trim() : "";
      if (!center) continue;
      const parsedValorBaixa = parseCurrency(valueRawBaixa);
      groups[center] = (groups[center] ?? 0) + parsedValorBaixa;
      matchedRows += 1;
    }

    const total = Object.values(groups).reduce((acc, value) => acc + value, 0);
    return NextResponse.json({ groups, total, matchedRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
