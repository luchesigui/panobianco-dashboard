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
      const valueRaw = row["Valor"];
      const center = typeof centerRaw === "string" ? centerRaw.trim() : "";
      if (!center) continue;
      items[center] = (items[center] ?? 0) + parseCurrency(valueRaw);
    }

    const total = Object.values(items).reduce((acc, value) => acc + value, 0);
    return NextResponse.json({ items, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
