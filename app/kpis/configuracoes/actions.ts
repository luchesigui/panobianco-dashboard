"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/server";

const GYM_SLUG = "panobianco-sjc-satelite";

export type ActionResult = { ok: true } | { ok: false; error: string };

function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null,
  tableName: string,
): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes(`public.${tableName}`) ||
    message.includes(`relation "${tableName}" does not exist`) ||
    message.includes(`table '${tableName}'`) ||
    message.includes("schema cache")
  );
}

export async function saveGymNameAction(name: string): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, error: "Nome não pode ser vazio." };
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("gyms")
    .update({ name: name.trim() })
    .eq("slug", GYM_SLUG);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveGymSettingsAction(settings: {
  salesTarget?: number;
  claudeApiKey?: string;
  evoApiToken?: string;
  totalInvested?: number | string;
}): Promise<ActionResult> {
  const supabase = getServiceSupabase();

  const gymRow = await supabase
    .from("gyms")
    .select("id")
    .eq("slug", GYM_SLUG)
    .maybeSingle();
  if (gymRow.error || !gymRow.data) {
    return { ok: false, error: "Academia não encontrada." };
  }
  const gymId = gymRow.data.id as string;

  const entries = Object.entries(settings).filter(([, v]) => v !== undefined);
  const rows = entries
    .filter(([, v]) => v !== "")
    .map(([key, value]) => ({
      gym_id: gymId,
      key,
      value: String(value),
    }));
  const deleteKeys = entries.filter(([, v]) => v === "").map(([key]) => key);

  if (rows.length === 0 && deleteKeys.length === 0) return { ok: true };

  if (deleteKeys.length > 0) {
    const { error } = await supabase
      .from("gym_settings")
      .delete()
      .eq("gym_id", gymId)
      .in("key", deleteKeys);
    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return {
          ok: false,
          error:
            "Tabela gym_settings não encontrada. Execute a migração:\n\nCREATE TABLE gym_settings (\n  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,\n  key text NOT NULL,\n  value text NOT NULL,\n  updated_at timestamptz DEFAULT now(),\n  PRIMARY KEY (gym_id, key)\n);",
        };
      }
      return { ok: false, error: error.message };
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("gym_settings").upsert(rows, {
      onConflict: "gym_id,key",
    });
    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        return {
          ok: false,
          error:
            "Tabela gym_settings não encontrada. Execute a migração:\n\nCREATE TABLE gym_settings (\n  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,\n  key text NOT NULL,\n  value text NOT NULL,\n  updated_at timestamptz DEFAULT now(),\n  PRIMARY KEY (gym_id, key)\n);",
        };
      }
      return { ok: false, error: error.message };
    }
  }
  return { ok: true };
}

export async function loadStudentBaseGoalsAction(year?: number): Promise<Record<number, number>> {
  const y = year ?? new Date().getFullYear();
  const supabase = getServiceSupabase();

  const gymRow = await supabase.from("gyms").select("id").eq("slug", GYM_SLUG).maybeSingle();
  if (!gymRow.data?.id) return {};

  const gymId = gymRow.data.id as string;

  const defRow = await supabase
    .from("kpi_definitions")
    .select("id")
    .eq("code", "base_students_goal")
    .maybeSingle();
  if (!defRow.data?.id) return {};

  const defId = defRow.data.id as string;

  const { data: rows } = await supabase
    .from("kpi_values")
    .select("period_id,value_numeric")
    .eq("gym_id", gymId)
    .eq("kpi_definition_id", defId)
    .gte("period_id", `${y}-01-01`)
    .lte("period_id", `${y}-12-01`);

  const result: Record<number, number> = {};
  for (const row of rows ?? []) {
    const month = parseInt((row.period_id as string).slice(5, 7), 10);
    if (month >= 1 && month <= 12 && typeof row.value_numeric === "number") {
      result[month] = row.value_numeric;
    }
  }
  return result;
}

export async function saveStudentBaseGoalsAction(
  goals: Record<number, number>,
  year?: number,
): Promise<ActionResult> {
  const y = year ?? new Date().getFullYear();
  const supabase = getServiceSupabase();

  const gymRow = await supabase.from("gyms").select("id").eq("slug", GYM_SLUG).maybeSingle();
  if (gymRow.error || !gymRow.data) return { ok: false, error: "Academia não encontrada." };
  const gymId = gymRow.data.id as string;

  const defRow = await supabase
    .from("kpi_definitions")
    .select("id")
    .eq("code", "base_students_goal")
    .maybeSingle();
  if (defRow.error || !defRow.data) {
    return { ok: false, error: "Definição 'base_students_goal' não encontrada." };
  }
  const defId = defRow.data.id as string;

  const rows = Object.entries(goals)
    .map(([month, value]) => ({ month: Number(month), value }))
    .filter(({ month, value }) => month >= 1 && month <= 12 && Number.isFinite(value) && value > 0)
    .map(({ month, value }) => ({
      gym_id: gymId,
      period_id: `${y}-${String(month).padStart(2, "0")}-01`,
      kpi_definition_id: defId,
      value_numeric: value,
      meta_json: {},
    }));

  if (rows.length === 0) return { ok: true };

  const { error } = await supabase
    .from("kpi_values")
    .upsert(rows, { onConflict: "gym_id,period_id,kpi_definition_id" });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/kpis");
  return { ok: true };
}

export type Consultora = {
  id: string;
  name: string;
  monthly_goal: number | null;
  sort_order: number;
};

export async function loadConsultorasAction(): Promise<Consultora[]> {
  const supabase = getServiceSupabase();
  const gymRow = await supabase.from("gyms").select("id").eq("slug", GYM_SLUG).maybeSingle();
  if (!gymRow.data?.id) return [];

  const { data } = await supabase
    .from("consultoras")
    .select("id,name,monthly_goal,sort_order")
    .eq("gym_id", gymRow.data.id as string)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    monthly_goal: r.monthly_goal != null ? Number(r.monthly_goal) : null,
    sort_order: Number(r.sort_order),
  }));
}

export async function saveConsultorasAction(
  rows: { id?: string; name: string; monthly_goal?: number | null; sort_order: number }[],
): Promise<ActionResult> {
  const supabase = getServiceSupabase();
  const gymRow = await supabase.from("gyms").select("id").eq("slug", GYM_SLUG).maybeSingle();
  if (gymRow.error || !gymRow.data) return { ok: false, error: "Academia não encontrada." };
  const gymId = gymRow.data.id as string;

  const existingRes = await supabase
    .from("consultoras")
    .select("id")
    .eq("gym_id", gymId)
    .is("deleted_at", null);
  if (isMissingTableError(existingRes.error, "consultoras")) {
    return {
      ok: false,
      error:
        "Tabela consultoras não encontrada no projeto Supabase atual. Aplique as migrações da pasta infra/supabase/migrations no mesmo projeto configurado em NEXT_PUBLIC_SUPABASE_URL.",
    };
  }
  const existingIds = new Set((existingRes.data ?? []).map((r) => r.id as string));

  const incomingIds = new Set(rows.filter((r) => r.id).map((r) => r.id as string));
  const toSoftDelete = [...existingIds].filter((id) => !incomingIds.has(id));

  if (toSoftDelete.length > 0) {
    const { error } = await supabase
      .from("consultoras")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", toSoftDelete);
    if (isMissingTableError(error, "consultoras")) {
      return {
        ok: false,
        error:
          "Tabela consultoras não encontrada no projeto Supabase atual. Aplique as migrações da pasta infra/supabase/migrations no mesmo projeto configurado em NEXT_PUBLIC_SUPABASE_URL.",
      };
    }
    if (error) return { ok: false, error: error.message };
  }

  for (const row of rows) {
    const payload = {
      gym_id: gymId,
      name: row.name.trim(),
      monthly_goal: row.monthly_goal ?? null,
      sort_order: row.sort_order,
      updated_at: new Date().toISOString(),
    };
    if (row.id) {
      const { error } = await supabase
        .from("consultoras")
        .update(payload)
        .eq("id", row.id)
        .eq("gym_id", gymId);
      if (isMissingTableError(error, "consultoras")) {
        return {
          ok: false,
          error:
            "Tabela consultoras não encontrada no projeto Supabase atual. Aplique as migrações da pasta infra/supabase/migrations no mesmo projeto configurado em NEXT_PUBLIC_SUPABASE_URL.",
        };
      }
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("consultoras").insert({ ...payload, deleted_at: null });
      if (isMissingTableError(error, "consultoras")) {
        return {
          ok: false,
          error:
            "Tabela consultoras não encontrada no projeto Supabase atual. Aplique as migrações da pasta infra/supabase/migrations no mesmo projeto configurado em NEXT_PUBLIC_SUPABASE_URL.",
        };
      }
      if (error) return { ok: false, error: error.message };
    }
  }

  revalidatePath("/kpis/configuracoes");
  return { ok: true };
}

export async function loadSettingsAction(): Promise<{
  gymName: string;
  salesTarget: string;
  claudeApiKey: string;
  evoApiToken: string;
  totalInvested: string;
}> {
  const supabase = getServiceSupabase();

  const gymRow = await supabase
    .from("gyms")
    .select("id,name")
    .eq("slug", GYM_SLUG)
    .maybeSingle();

  const gymId = gymRow.data?.id as string | undefined;
  const gymName = (gymRow.data?.name as string) ?? GYM_SLUG;

  const defaults = {
    gymName,
    salesTarget: "150",
    claudeApiKey: "",
    evoApiToken: "",
    totalInvested: "",
  };
  if (!gymId) return defaults;

  const { data: settingsRows } = await supabase
    .from("gym_settings")
    .select("key,value")
    .eq("gym_id", gymId);

  const map = new Map((settingsRows ?? []).map((r) => [r.key as string, r.value as string]));
  return {
    gymName,
    salesTarget: map.get("salesTarget") ?? "150",
    claudeApiKey: map.get("claudeApiKey") ?? "",
    evoApiToken: map.get("evoApiToken") ?? "",
    totalInvested: map.get("totalInvested") ?? "",
  };
}
