import { loadEntradaPageData } from "@/lib/data/entrada-load";
import { loadConsultorasAction } from "@/app/kpis/configuracoes/actions";
import { EntradaDadosClient } from "./entrada-dados-client";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function currentMonthPeriodId(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntradaDadosPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const gymSlug = firstParam(sp.gym) ?? "panobianco-sjc-satelite";
  const periodId = currentMonthPeriodId();

  const [data, consultoras] = await Promise.all([
    loadEntradaPageData(gymSlug, periodId),
    loadConsultorasAction(),
  ]);

  return (
    <EntradaDadosClient
      gyms={data.gyms}
      gymSlug={gymSlug}
      serverPeriodId={periodId}
      serverKpiValues={data.kpiValues}
      serverMetaByCode={data.metaByCode}
      serverSmPayload={data.smPayload}
      consultoras={consultoras}
    />
  );
}
