"use server";

import { getServiceSupabase } from "@/lib/supabase/server";

const GYM_SLUG = "panobianco-jd-satelite";

export type ActionResult = { ok: true } | { ok: false; error: string };

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

  const rows = Object.entries(settings)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([key, value]) => ({
      gym_id: gymId,
      key,
      value: String(value),
    }));

  if (rows.length === 0) return { ok: true };

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
  return { ok: true };
}

export async function loadSettingsAction(): Promise<{
  gymName: string;
  salesTarget: string;
  claudeApiKey: string;
}> {
  const supabase = getServiceSupabase();

  const gymRow = await supabase
    .from("gyms")
    .select("id,name")
    .eq("slug", GYM_SLUG)
    .maybeSingle();

  const gymId = gymRow.data?.id as string | undefined;
  const gymName = (gymRow.data?.name as string) ?? GYM_SLUG;

  const defaults = { gymName, salesTarget: "150", claudeApiKey: "" };
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
  };
}
