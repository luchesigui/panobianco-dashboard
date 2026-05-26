import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getServiceSupabase } from "@/lib/supabase/server";
import { saveMonthlyKpisAction, saveSmDashboardAction } from "@/app/kpis/entrada-dados/actions";
import { createDefaultSmPayload, normalizeSmPayloadWeeks, recomputeWeeklyTotals } from "@/lib/data/sales-marketing-payload-merge";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
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
    const receptionistMap = new Map<string, { leads: number; sales: number }>();

    for (const row of rows) {
      const cadastradoPorRaw = row["Cadastrado por"];
      const conversaoRaw = row["Conversão"];

      const cadastradoPor = typeof cadastradoPorRaw === "string" ? cadastradoPorRaw.trim() : String(cadastradoPorRaw ?? "").trim();
      const isConverted = conversaoRaw !== undefined && conversaoRaw !== null && String(conversaoRaw).trim() !== "";

      totalLeads++;
      if (isConverted) {
        totalSales++;
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
      byReceptionist: byReceptionistParsed,
    };

    if (save && periodParam && weekParam) {
      const weekIndex = parseInt(weekParam, 10) - 1;

      const supabase = getServiceSupabase();
      const gymRow = await supabase.from("gyms").select("id").eq("slug", gymParam).maybeSingle();
      if (gymRow.error || !gymRow.data) {
        return NextResponse.json({ error: "Academia não encontrada." }, { status: 404 });
      }
      const gymId = gymRow.data.id;

      // Load active consultoras
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
        sort_order: Number(r.sort_order),
      }));

      // Load existing dashboard payload
      const { data: dashRow, error: dashErr } = await supabase
        .from("sales_marketing_dashboard_payload")
        .select("payload")
        .eq("gym_id", gymId)
        .eq("period_id", periodParam)
        .maybeSingle();

      if (dashErr) {
        return NextResponse.json({ error: `Erro ao buscar dados do dashboard: ${dashErr.message}` }, { status: 500 });
      }

      let payload: SalesMarketingDashboardPayload;
      const raw = dashRow?.payload;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        payload = normalizeSmPayloadWeeks(raw as SalesMarketingDashboardPayload);
      } else {
        payload = createDefaultSmPayload(monthLabel(periodParam));
      }

      // Match names using first name case-insensitive matching
      const matchedReceptionists: Record<string, { leads: number; sales: number }> = {};
      for (const [rawName, stats] of receptionistMap.entries()) {
        const spreadsheetFirstName = getFirstName(rawName);
        const matchedConsultora = consultoras.find(c => getFirstName(c.name) === spreadsheetFirstName);
        if (matchedConsultora) {
          const existing = matchedReceptionists[matchedConsultora.name] || { leads: 0, sales: 0 };
          existing.leads += stats.leads;
          existing.sales += stats.sales;
          matchedReceptionists[matchedConsultora.name] = existing;
        }
      }

      // Update byReceptionist weekly totals
      for (const c of consultoras) {
        let row = payload.weekly.salesWeekly.byReceptionist?.find(r => r.name === c.name);
        if (!row) {
          row = {
            name: c.name,
            leadsByWeek: Array(5).fill(null),
            leadsTotal: null,
            salesByWeek: Array(5).fill(null),
            salesTotal: null,
          };
          if (!payload.weekly.salesWeekly.byReceptionist) {
            payload.weekly.salesWeekly.byReceptionist = [];
          }
          payload.weekly.salesWeekly.byReceptionist.push(row);
        }

        const stats = matchedReceptionists[c.name];
        row.leadsByWeek[weekIndex] = stats ? stats.leads : 0;
        row.salesByWeek[weekIndex] = stats ? stats.sales : 0;
      }

      // Update weekly totals
      payload.weekly.salesWeekly.leadsByWeek[weekIndex] = totalLeads;
      payload.weekly.salesWeekly.totals[weekIndex] = totalSales;

      // Recalculate monthly totals for receptionists
      payload.receptionists = consultoras.map(c => {
        const row = payload.weekly.salesWeekly.byReceptionist?.find(r => r.name === c.name);
        let leads = null;
        let sales = null;
        if (row) {
          let hasAny = false;
          let sumLeads = 0;
          let sumSales = 0;
          for (let i = 0; i < row.leadsByWeek.length; i++) {
            if (row.leadsByWeek[i] !== null) {
              hasAny = true;
              sumLeads += row.leadsByWeek[i]!;
            }
            if (row.salesByWeek[i] !== null) {
              hasAny = true;
              sumSales += row.salesByWeek[i]!;
            }
          }
          if (hasAny) {
            leads = sumLeads;
            sales = sumSales;
          }
        }
        const conversion_pct = (leads && leads > 0 && sales !== null)
          ? Math.round((sales / leads) * 100 * 10) / 10
          : 0;
        const existingRecep = payload.receptionists?.find(r => r.name === c.name);
        return {
          name: c.name,
          badge: existingRecep?.badge,
          leads,
          sales,
          goal: c.monthly_goal ?? existingRecep?.goal ?? 0,
          conversion_pct,
          bar_variant: existingRecep?.bar_variant,
        };
      });

      // Recompute all weekly totals
      recomputeWeeklyTotals(payload.weekly);

      // Save SM Dashboard payload
      const saveSmRes = await saveSmDashboardAction({
        gymSlug: gymParam,
        periodId: periodParam,
        payload: payload,
      });

      if (!saveSmRes.ok) {
        return NextResponse.json({ error: `Erro ao salvar dashboard de vendas/marketing: ${saveSmRes.error}` }, { status: 500 });
      }

      // Save overall generated leads & sales to KPI values
      const saveKpisRes = await saveMonthlyKpisAction({
        gymSlug: gymParam,
        periodId: periodParam,
        values: {
          leads_generated: payload.weekly.salesWeekly.leadsGrandTotal,
          sales_total: payload.weekly.salesWeekly.grandTotal,
        },
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
