import { getServiceSupabase } from "@/lib/supabase/server";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { createDefaultSmPayload } from "@/lib/data/sales-marketing-payload-merge";
export type GymOption = { slug: string; name: string };
export type DefOption = { code: string; id: string };

function monthLabel(periodYyyyMmDd: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(periodYyyyMmDd);
  if (!m) return periodYyyyMmDd;
  const mo = Number.parseInt(m[2], 10);
  const short = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const y = m[1].slice(-2);
  return `${short[mo - 1] ?? m[2]}/${y}`;
}

export async function loadEntradaPageData(gymSlug: string, periodId: string): Promise<{
  gyms: GymOption[];
  definitions: DefOption[];
  kpiValues: Record<string, number>;
  metaByCode: Record<string, Record<string, unknown>>;
  smPayload: SalesMarketingDashboardPayload;
}> {
  const supabase = getServiceSupabase();

  const [gymsRes, defsRes] = await Promise.all([
    supabase.from("gyms").select("slug,name").order("name"),
    supabase.from("kpi_definitions").select("id,code").order("code"),
  ]);
  if (gymsRes.error) throw new Error(gymsRes.error.message);
  if (defsRes.error) throw new Error(defsRes.error.message);

  const gyms = (gymsRes.data ?? []).map((g) => ({
    slug: g.slug,
    name: g.name,
  }));
  const definitions = (defsRes.data ?? []).map((d) => ({
    id: d.id,
    code: d.code,
  }));

  const gym = gyms.find((g) => g.slug === gymSlug) ?? gyms[0];
  const effectiveSlug = gym?.slug ?? gymSlug;

  const gymRow = await supabase.from("gyms").select("id").eq("slug", effectiveSlug).maybeSingle();
  if (gymRow.error || !gymRow.data) {
    return {
      gyms,
      definitions,
      kpiValues: {},
      metaByCode: {},
      smPayload: createDefaultSmPayload(monthLabel(periodId)),
    };
  }

  const gymId = gymRow.data.id;

  const { data: valueRows, error: valErr } = await supabase
    .from("kpi_values")
    .select("kpi_definition_id,value_numeric,meta_json")
    .eq("gym_id", gymId)
    .eq("period_id", periodId);
  if (valErr) throw new Error(valErr.message);

  const idToCode = new Map(definitions.map((d) => [d.id, d.code]));
  const kpiValues: Record<string, number> = {};
  const metaByCode: Record<string, Record<string, unknown>> = {};
  for (const row of valueRows ?? []) {
    const code = idToCode.get(row.kpi_definition_id);
    if (!code || row.value_numeric == null) continue;
    kpiValues[code] = Number(row.value_numeric);
    const mj = row.meta_json;
    if (mj && typeof mj === "object" && !Array.isArray(mj)) {
      metaByCode[code] = mj as Record<string, unknown>;
    }
  }

  const { data: dashRow, error: dashErr } = await supabase
    .from("sales_marketing_dashboard_payload")
    .select("payload")
    .eq("gym_id", gymId)
    .eq("period_id", periodId)
    .maybeSingle();
  if (dashErr) throw new Error(dashErr.message);

  let smPayload: SalesMarketingDashboardPayload;
  const raw = dashRow?.payload;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    smPayload = raw as SalesMarketingDashboardPayload;
  } else {
    smPayload = createDefaultSmPayload(monthLabel(periodId));
  }

  return { gyms, definitions, kpiValues, metaByCode, smPayload };
}
