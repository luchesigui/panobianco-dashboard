import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { saveMonthlyKpisAction } from "@/app/kpis/entrada-dados/actions";
import { validateApiRequest } from "@/lib/auth";

type RenovacaoResponse = {
  monthly_renewed: number;
  monthly_non_renewed: number;
  month_total_records: number;
};

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

    let renewedCount = 0;
    let nonRenewedCount = 0;

    for (const row of rows) {
      const statusKey = Object.keys(row).find(k => k.trim().toLowerCase() === "status");
      if (!statusKey) continue;
      const statusValue = String(row[statusKey] || "").trim().toLowerCase();

      if (statusValue === "não renovado" || statusValue === "nao renovado") {
        nonRenewedCount++;
      } else if (statusValue.startsWith("renovação") || statusValue.startsWith("renovacao")) {
        renewedCount++;
      }
    }

    const response: RenovacaoResponse = {
      monthly_renewed: renewedCount,
      monthly_non_renewed: nonRenewedCount,
      month_total_records: rows.length,
    };

    if (save && periodParam) {
      const saveRes = await saveMonthlyKpisAction({
        gymSlug: gymParam,
        periodId: periodParam,
        values: {
          monthly_renewed: response.monthly_renewed,
          monthly_non_renewed: response.monthly_non_renewed,
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
