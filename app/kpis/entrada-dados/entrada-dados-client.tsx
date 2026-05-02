"use client";

import type { Consultora } from "@/app/kpis/configuracoes/actions";
import type { GymOption } from "@/lib/data/entrada-load";
import type { SalesMarketingDashboardPayload } from "@/lib/data/sales-marketing-dashboard";
import { useKpiPeriodStore } from "@/lib/stores/kpi-period-store";
import { useEffect, useState } from "react";
import { EntradaDadosForm } from "./entrada-dados-form";

type Props = {
  gyms: GymOption[];
  gymSlug: string;
  serverPeriodId: string;
  serverKpiValues: Record<string, number>;
  serverMetaByCode: Record<string, Record<string, unknown>>;
  serverSmPayload: SalesMarketingDashboardPayload;
  consultoras: Consultora[];
};

export function EntradaDadosClient({
  gyms,
  gymSlug,
  serverPeriodId,
  serverKpiValues,
  serverMetaByCode,
  serverSmPayload,
  consultoras,
}: Props) {
  const selectedMonth = useKpiPeriodStore((s) => s.selectedMonth);

  const [payload, setPayload] = useState(() => ({
    periodId: serverPeriodId,
    kpiValues: serverKpiValues,
    metaByCode: serverMetaByCode,
    smPayload: serverSmPayload,
  }));

  const targetPeriodId = `${selectedMonth}-01`;
  const needsFetch = targetPeriodId !== payload.periodId;

  useEffect(() => {
    if (!needsFetch) return;
    const controller = new AbortController();

    void (async () => {
      await Promise.resolve();
      try {
        const url = `/api/kpis/entrada-dados?gym=${encodeURIComponent(gymSlug)}&period=${encodeURIComponent(targetPeriodId)}`;
        const res = await fetch(url, {
          method: "GET",
          cache: "default",
          signal: controller.signal,
        });
        const json = (await res.json()) as
          | {
              kpiValues: Record<string, number>;
              metaByCode: Record<string, Record<string, unknown>>;
              smPayload: SalesMarketingDashboardPayload;
            }
          | { error?: string };
        if (!res.ok) {
          throw new Error(
            "error" in json && typeof json.error === "string"
              ? json.error
              : "Erro ao carregar período.",
          );
        }
        const data = json as {
          kpiValues: Record<string, number>;
          metaByCode: Record<string, Record<string, unknown>>;
          smPayload: SalesMarketingDashboardPayload;
        };
        setPayload({
          periodId: targetPeriodId,
          kpiValues: data.kpiValues,
          metaByCode: data.metaByCode,
          smPayload: data.smPayload,
        });
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        console.error(
          "Falha ao carregar dados do período",
          e instanceof Error ? e.message : e,
        );
      }
    })();

    return () => {
      controller.abort();
    };
  }, [gymSlug, needsFetch, targetPeriodId]);

  return (
    <EntradaDadosForm
      key={`${gymSlug}-${payload.periodId}`}
      gyms={gyms}
      initialGymSlug={gymSlug}
      initialPeriodId={payload.periodId}
      initialKpiValues={payload.kpiValues}
      initialMetaByCode={payload.metaByCode}
      initialSmPayload={payload.smPayload}
      initialConsultoras={consultoras}
    />
  );
}
