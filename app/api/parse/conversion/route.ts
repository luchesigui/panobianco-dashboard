import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getServiceSupabase } from "@/lib/supabase/server";
import { saveMonthlyKpisAction } from "@/app/kpis/entrada-dados/actions";
import { validateApiRequest } from "@/lib/auth";

function monthLabel(periodYyyyMmDd: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(periodYyyyMmDd);
  if (!m) return periodYyyyMmDd;
  const mo = Number.parseInt(m[2], 10);
  const short = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const y = m[1].slice(-2);
  return `${short[mo - 1] ?? m[2]}/${y}`;
}

function getFirstName(fullName: string): string {
  const firstWord = fullName.trim().split(/\s+/)[0] || "";
  return firstWord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const save = searchParams.get("save") === "true";
    const gymParam = searchParams.get("gym") || "panobianco-sjc-satelite";
    const periodParam = searchParams.get("period");
    let weekParam = searchParams.get("week") || searchParams.get("weekIndex");
    if (weekParam && weekParam.startsWith("S")) {
      weekParam = weekParam.substring(1);
    }

    if (save) {
      const auth = validateApiRequest(req);
      if (!auth.isValid) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      if (!periodParam || !/^\d{4}-\d{2}-\d{2}$/.test(periodParam)) {
        return NextResponse.json({ error: "Parâmetro 'period' inválido ou ausente. Formato esperado: YYYY-MM-DD." }, { status: 400 });
      }
      if (!weekParam || !/^[1-5]$/.test(weekParam)) {
        return NextResponse.json({ error: "Parâmetro 'week' ou 'weekIndex' inválido ou ausente. Esperado de 1 a 5 ou S1 a S5." }, { status: 400 });
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

    let totalLeads = 0;
    let totalSales = 0;
    let totalOnlineSales = 0;
    const receptionistMap = new Map<string, { leads: number; sales: number }>();

    for (const row of rows) {
      const cadastradoPorRaw = row["Cadastrado por"];
      const conversaoRaw = row["Conversão"];
      const contratoVendidoRaw = row["1º contrato vendido"];

      const cadastradoPor = typeof cadastradoPorRaw === "string" ? cadastradoPorRaw.trim() : String(cadastradoPorRaw ?? "").trim();
      const isConverted = conversaoRaw !== undefined && conversaoRaw !== null && String(conversaoRaw).trim() !== "";
      
      const contratoVendido = typeof contratoVendidoRaw === "string" ? contratoVendidoRaw.trim() : String(contratoVendidoRaw ?? "").trim();
      const isOnline = isConverted && contratoVendido.toLowerCase().includes("venda online");

      totalLeads++;
      if (isConverted) {
        totalSales++;
      }
      if (isOnline) {
        totalOnlineSales++;
      }

      if (cadastradoPor) {
        const existing = receptionistMap.get(cadastradoPor) || { leads: 0, sales: 0 };
        existing.leads++;
        if (isConverted) {
          existing.sales++;
        }
        receptionistMap.set(cadastradoPor, existing);
      }
    }

    const byReceptionistParsed = Array.from(receptionistMap.entries()).map(([name, stats]) => ({
      name,
      leads: stats.leads,
      sales: stats.sales,
    }));

    const response = {
      totalLeads,
      totalSales,
      totalOnlineSales,
      byReceptionist: byReceptionistParsed,
    };

    if (save && periodParam && weekParam) {
      const weekNum = parseInt(weekParam, 10);

      const supabase = getServiceSupabase();
      const gymRow = await supabase.from("gyms").select("id").eq("slug", gymParam).maybeSingle();
      if (gymRow.error || !gymRow.data) {
        return NextResponse.json({ error: "Academia não encontrada." }, { status: 404 });
      }
      const gymId = gymRow.data.id;

      const { data: consultorasData, error: consultorasErr } = await supabase
        .from("consultoras")
        .select("id,name,monthly_goal,sort_order")
        .eq("gym_id", gymId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (consultorasErr) {
        return NextResponse.json({ error: `Erro ao buscar consultoras: ${consultorasErr.message}` }, { status: 500 });
      }

      const consultoras = (consultorasData ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        monthly_goal: r.monthly_goal != null ? Number(r.monthly_goal) : null,
      }));

      // Match spreadsheet names to consultora names via first name
      const matchedReceptionists: Record<string, { leads: number; sales: number }> = {};
      for (const [rawName, stats] of receptionistMap.entries()) {
        const spreadsheetFirstName = getFirstName(rawName);
        const matched = consultoras.find((c) => getFirstName(c.name) === spreadsheetFirstName);
        if (matched) {
          const existing = matchedReceptionists[matched.name] ?? { leads: 0, sales: 0 };
          existing.leads += stats.leads;
          existing.sales += stats.sales;
          matchedReceptionists[matched.name] = existing;
        }
      }

      // Upsert conversoes_semanais for this week
      const { error: convErr } = await supabase.from("conversoes_semanais").upsert(
        { gym_id: gymId, period_id: periodParam, week_num: weekNum, leads: totalLeads, sales: totalSales, sales_online: totalOnlineSales },
        { onConflict: "gym_id,period_id,week_num" },
      );
      if (convErr) {
        return NextResponse.json({ error: `Erro ao salvar conversões: ${convErr.message}` }, { status: 500 });
      }

      // Upsert recepcao_semanal for each consultora this week
      const recepcaoRows = consultoras.map((c) => ({
        gym_id: gymId,
        period_id: periodParam,
        week_num: weekNum,
        receptionist_name: c.name,
        consultora_id: c.id,
        leads: matchedReceptionists[c.name]?.leads ?? 0,
        sales: matchedReceptionists[c.name]?.sales ?? 0,
      }));

      const { error: recErr } = await supabase.from("recepcao_semanal").upsert(
        recepcaoRows,
        { onConflict: "gym_id,period_id,week_num,receptionist_name" },
      );
      if (recErr) {
        return NextResponse.json({ error: `Erro ao salvar recepção: ${recErr.message}` }, { status: 500 });
      }

      // Compute grand totals from all weeks for KPI values
      const { data: allConversoes } = await supabase
        .from("conversoes_semanais")
        .select("leads,sales,sales_online")
        .eq("gym_id", gymId)
        .eq("period_id", periodParam);

      const leadsGrandTotal = (allConversoes ?? []).reduce((s, r) => s + (r.leads ?? 0), 0);
      const grandTotal = (allConversoes ?? []).reduce((s, r) => s + (r.sales ?? 0), 0);
      const onlineGrandTotal = (allConversoes ?? []).reduce((s, r) => s + (r.sales_online ?? 0), 0);

      const saveKpisRes = await saveMonthlyKpisAction({
        gymSlug: gymParam,
        periodId: periodParam,
        values: { leads_generated: leadsGrandTotal, sales_total: grandTotal, vendas_online: onlineGrandTotal },
      });
      if (!saveKpisRes.ok) {
        return NextResponse.json({ error: `Erro ao salvar KPIs mensais: ${saveKpisRes.error}` }, { status: 500 });
      }

      return NextResponse.json({ ok: true, ...response });
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao processar arquivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
