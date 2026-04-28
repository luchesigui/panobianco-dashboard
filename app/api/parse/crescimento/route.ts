import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

type CrescimentoResponse = {
  base_students_end: number;
  sales_total: number;
  monthly_cancellations: number;
  monthly_non_renewed: number;
};

function parseNumeric(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
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

    const lastRow = rows[rows.length - 1];
    const response: CrescimentoResponse = {
      base_students_end: parseNumeric(lastRow["Ativos fim"]),
      sales_total: parseNumeric(lastRow["Novos"]),
      monthly_cancellations: parseNumeric(lastRow["Cancelados"]),
      monthly_non_renewed: parseNumeric(lastRow["Vencidos"]),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
