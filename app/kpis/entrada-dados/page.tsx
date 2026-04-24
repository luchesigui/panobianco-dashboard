import { loadEntradaPageData } from "@/lib/data/entrada-load";
import { EntradaDadosForm } from "./entrada-dados-form";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function normalizeMonth(m: string | undefined): string {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  if (!m) return currentMonth;
  if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(m)) return m;
  return currentMonth;
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntradaDadosPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const gymSlug = firstParam(sp.gym) ?? "panobianco-sjc-satelite";
  const periodId = normalizeMonth(firstParam(sp.month));

  const data = await loadEntradaPageData(gymSlug, periodId);

  return (
    <EntradaDadosForm
      key={`${gymSlug}-${periodId}`}
      gyms={data.gyms}
      initialGymSlug={gymSlug}
      initialPeriodId={periodId}
      initialKpiValues={data.kpiValues}
      initialMetaByCode={data.metaByCode}
      initialSmPayload={data.smPayload}
    />
  );
}
