import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

type RecuperacaoResponse = {
  open_default_count: number;
  open_default_value: number;
  recovered_default_count: number;
  recovered_default_value: number;
  cancelled_count: number;
  month_total_records: number;
};

function parseCurrency(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  // Remove currency symbol and whitespace
  let cleaned = value.trim().replace(/R\$\s*/, "");
  
  // If it has a comma, it's PT-BR format: "1.234,56" or "1234,56"
  if (cleaned.includes(",")) {
    // Only remove dots if we are sure they are thousand separators
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  
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
      raw: true, // Use raw values for better numeric detection
    });
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Planilha sem linhas de dados." }, { status: 400 });
    }

    let openCount = 0;
    let openValue = 0;
    let recoveredCount = 0;
    let recoveredValue = 0;
    let cancelledCount = 0;

    for (const row of rows) {
      const status = String(row["Status"] || "").trim();
      
      // Look for the value in common column name variants
      const rawValue = row["Valor da divida"] ?? row["Valor da Dívida"] ?? row["Valor"] ?? row["Valor da dívida"];
      const value = parseCurrency(rawValue);

      if (status === "Em aberto") {
        openCount++;
        openValue += value;
      } else if (status === "Recuperado") {
        recoveredCount++;
        recoveredValue += value;
      } else if (status === "Cancelada") {
        cancelledCount++;
      }
    }

    const response: RecuperacaoResponse = {
      open_default_count: openCount,
      open_default_value: openValue,
      recovered_default_count: recoveredCount,
      recovered_default_value: recoveredValue,
      cancelled_count: cancelledCount,
      month_total_records: rows.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
