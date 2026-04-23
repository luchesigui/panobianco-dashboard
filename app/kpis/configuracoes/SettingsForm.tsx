"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGymNameAction, saveGymSettingsAction } from "./actions";

type Settings = {
  gymName: string;
  salesTarget: string;
  claudeApiKey: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const router = useRouter();
  const [gymName, setGymName] = useState(initialSettings.gymName);
  const [salesTarget, setSalesTarget] = useState(initialSettings.salesTarget);
  const [claudeApiKey, setClaudeApiKey] = useState(initialSettings.claudeApiKey);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSaveGymName = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveGymNameAction(gymName);
    if (res.ok) {
      setMessage({ type: "ok", text: "Nome da academia atualizado." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSaving(false);
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveGymSettingsAction({
      salesTarget: salesTarget ? Number(salesTarget) : undefined,
    });
    if (res.ok) {
      setMessage({ type: "ok", text: "Metas salvas." });
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSaving(false);
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveGymSettingsAction({
      claudeApiKey: claudeApiKey || undefined,
    });
    if (res.ok) {
      setMessage({ type: "ok", text: "Chaves salvas." });
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
            Configurações
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie as configurações da academia, metas e integrações.
          </p>
        </div>

        {message ? (
          <div
            className={`px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2 ${
              message.type === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <span className="shrink-0 mt-0.5">{message.type === "ok" ? "✓" : "✕"}</span>
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{message.text}</pre>
          </div>
        ) : null}

        <div className="space-y-6">
          {/* Gym info */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Academia
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Informações exibidas no dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gym-name" className="text-xs font-medium text-slate-600">
                  Nome de exibição
                </Label>
                <Input
                  id="gym-name"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="h-10 bg-white border-slate-200"
                  placeholder="ex: Panobianco Jd. Satélite"
                />
                <p className="text-xs text-slate-400">
                  Substitui o slug no cabeçalho do dashboard.
                </p>
              </div>
              <Button
                onClick={() => void handleSaveGymName()}
                disabled={saving}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {saving ? "Salvando…" : "Salvar nome"}
              </Button>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Metas
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Referências usadas nos gráficos e cards do dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="flex flex-col gap-1.5 max-w-48">
                <Label htmlFor="sales-target" className="text-xs font-medium text-slate-600">
                  Meta de vendas mensais
                </Label>
                <Input
                  id="sales-target"
                  inputMode="numeric"
                  value={salesTarget}
                  onChange={(e) => setSalesTarget(e.target.value)}
                  className="h-10 bg-white border-slate-200"
                  placeholder="ex: 150"
                />
              </div>
              <Button
                onClick={() => void handleSaveGoals()}
                disabled={saving}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {saving ? "Salvando…" : "Salvar metas"}
              </Button>
            </CardContent>
          </Card>

          {/* API keys */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Integrações e API Keys
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Chaves usadas para análise automática de dados pelo assistente de IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="claude-api-key" className="text-xs font-medium text-slate-600">
                  Claude API Key
                </Label>
                <Input
                  id="claude-api-key"
                  type="password"
                  autoComplete="off"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  className="h-10 bg-white border-slate-200"
                  placeholder="sk-ant-…"
                />
                <p className="text-xs text-slate-400">
                  Chave da API Anthropic para geração automática de insights e análises do dashboard.
                </p>
              </div>
              <Button
                onClick={() => void handleSaveApiKeys()}
                disabled={saving}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {saving ? "Salvando…" : "Salvar chaves"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
