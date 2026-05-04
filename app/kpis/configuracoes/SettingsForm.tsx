"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  saveGymNameAction,
  saveGymSettingsAction,
  saveStudentBaseGoalsAction,
  saveConsultorasAction,
  type Consultora,
} from "./actions";

type Settings = {
  gymName: string;
  salesTarget: string;
  claudeApiKey: string;
  evoApiToken: string;
  totalInvested: string;
};

type ConsultoraRow = {
  id?: string;
  name: string;
  monthly_goal: string;
  sort_order: number;
};

type SaveSection =
  | "gymName"
  | "totalInvested"
  | "consultoras"
  | "consultorasGoals"
  | "studentBaseGoals"
  | "apiKeys";

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatBrlIntegerMask(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const value = Number(digits);
  if (!Number.isFinite(value)) return "";
  return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value)}`;
}

function parseBrlIntegerMask(masked: string): number | null {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function SettingsForm({
  initialSettings,
  initialStudentBaseGoals,
  initialConsultoras,
}: {
  initialSettings: Settings;
  initialStudentBaseGoals: Record<number, number>;
  initialConsultoras: Consultora[];
}) {
  const router = useRouter();
  const [gymName, setGymName] = useState(initialSettings.gymName);
  const [claudeApiKey, setClaudeApiKey] = useState(initialSettings.claudeApiKey);
  const [evoApiToken, setEvoApiToken] = useState(initialSettings.evoApiToken);
  const [totalInvested, setTotalInvested] = useState(() =>
    formatBrlIntegerMask(initialSettings.totalInvested),
  );
  const [studentBaseGoals, setStudentBaseGoals] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (let m = 1; m <= 12; m++) {
      init[m] = initialStudentBaseGoals[m] != null ? String(initialStudentBaseGoals[m]) : "";
    }
    return init;
  });
  const [consultoras, setConsultoras] = useState<ConsultoraRow[]>(() =>
    initialConsultoras.map((c) => ({
      id: c.id,
      name: c.name,
      monthly_goal: c.monthly_goal != null ? String(c.monthly_goal) : "",
      sort_order: c.sort_order,
    })),
  );
  const [savingSections, setSavingSections] = useState<Record<SaveSection, boolean>>({
    gymName: false,
    totalInvested: false,
    consultoras: false,
    consultorasGoals: false,
    studentBaseGoals: false,
    apiKeys: false,
  });
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const consultorasTotal = consultoras.reduce((sum, c) => {
    const v = Number(c.monthly_goal);
    return sum + (Number.isFinite(v) && v > 0 ? v : 0);
  }, 0);

  const setSectionSaving = (section: SaveSection, isSaving: boolean) => {
    setSavingSections((prev) => ({ ...prev, [section]: isSaving }));
  };

  const handleSaveGymName = async () => {
    setSectionSaving("gymName", true);
    setMessage(null);
    const res = await saveGymNameAction(gymName);
    if (res.ok) {
      setMessage({ type: "ok", text: "Nome da academia atualizado." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSectionSaving("gymName", false);
  };

  const handleSaveApiKeys = async () => {
    setSectionSaving("apiKeys", true);
    setMessage(null);
    const res = await saveGymSettingsAction({
      claudeApiKey: claudeApiKey || undefined,
      evoApiToken: evoApiToken || undefined,
    });
    if (res.ok) {
      setMessage({ type: "ok", text: "Chaves salvas." });
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSectionSaving("apiKeys", false);
  };

  const handleSaveTotalInvested = async () => {
    setSectionSaving("totalInvested", true);
    setMessage(null);
    const parsed = parseBrlIntegerMask(totalInvested);
    if (totalInvested.trim() !== "" && (parsed == null || parsed < 0)) {
      setMessage({ type: "err", text: "Informe um valor numérico válido para investimento total." });
      setSectionSaving("totalInvested", false);
      return;
    }
    const res = await saveGymSettingsAction({
      totalInvested: totalInvested.trim() === "" ? "" : (parsed ?? undefined),
    });
    if (res.ok) {
      setMessage({ type: "ok", text: "Investimento total salvo." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSectionSaving("totalInvested", false);
  };

  const handleSaveStudentBaseGoals = async () => {
    setSectionSaving("studentBaseGoals", true);
    setMessage(null);
    const goals: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      const v = Number(studentBaseGoals[m]);
      if (studentBaseGoals[m] !== "" && Number.isFinite(v) && v > 0) {
        goals[m] = v;
      }
    }
    const res = await saveStudentBaseGoalsAction(goals);
    if (res.ok) {
      setMessage({ type: "ok", text: "Metas de base de alunos salvas." });
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSectionSaving("studentBaseGoals", false);
  };

  const handleSaveConsultoras = async (section: "consultoras" | "consultorasGoals") => {
    setSectionSaving(section, true);
    setMessage(null);
    const validRows = consultoras
      .filter((c) => c.name.trim())
      .map((c, i) => ({
        id: c.id,
        name: c.name.trim(),
        monthly_goal: c.monthly_goal !== "" ? Number(c.monthly_goal) : null,
        sort_order: i,
      }));
    const res = await saveConsultorasAction(validRows);
    if (res.ok) {
      setMessage({ type: "ok", text: "Consultoras salvas." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error });
    }
    setSectionSaving(section, false);
  };

  const addConsultora = () => {
    setConsultoras((prev) => [
      ...prev,
      { name: "", monthly_goal: "", sort_order: prev.length },
    ]);
    setTimeout(() => {
      nameInputRefs.current[consultoras.length]?.focus();
    }, 0);
  };

  const removeConsultora = (index: number) => {
    setConsultoras((prev) => prev.filter((_, i) => i !== index));
  };

  const updateConsultora = (index: number, field: keyof ConsultoraRow, value: string) => {
    setConsultoras((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
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
                disabled={savingSections.gymName}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {savingSections.gymName ? "Salvando…" : "Salvar nome"}
              </Button>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="total-invested" className="text-xs font-medium text-slate-600">
                  Investimento total
                </Label>
                <Input
                  id="total-invested"
                  inputMode="numeric"
                  value={totalInvested}
                  onChange={(e) => setTotalInvested(formatBrlIntegerMask(e.target.value))}
                  className="h-10 bg-white border-slate-200"
                  placeholder="R$ 1.020.300"
                />
                <p className="text-xs text-slate-400">
                  Substitui o número do card "Total investido" na seção ROI do dashboard.
                </p>
              </div>
              <Button
                onClick={() => void handleSaveTotalInvested()}
                disabled={savingSections.totalInvested}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {savingSections.totalInvested ? "Salvando…" : "Salvar investimento total"}
              </Button>
            </CardContent>
          </Card>

          {/* Consultoras */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Consultoras
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Equipe de vendas. Usada para atribuição de metas e recepções.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="space-y-2">
                {consultoras.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      ref={(el) => { nameInputRefs.current[i] = el; }}
                      value={c.name}
                      onChange={(e) => updateConsultora(i, "name", e.target.value)}
                      className="h-9 bg-white border-slate-200 text-sm"
                      placeholder="Nome da consultora"
                    />
                    <button
                      type="button"
                      onClick={() => nameInputRefs.current[i]?.focus()}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                      tabIndex={-1}
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConsultora(i)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addConsultora}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Plus size={13} />
                Adicionar consultora
              </button>
              <Button
                onClick={() => void handleSaveConsultoras("consultoras")}
                disabled={savingSections.consultoras}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {savingSections.consultoras ? "Salvando…" : "Salvar consultoras"}
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
                Meta de vendas mensais por consultora.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {consultoras.filter((c) => c.name.trim()).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Cadastre consultoras acima para definir metas individuais.
                </p>
              ) : (
                <div className="space-y-2">
                  {consultoras
                    .filter((c) => c.name.trim())
                    .map((c, i) => {
                      const globalIndex = consultoras.indexOf(c);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-48 truncate">{c.name}</span>
                          <Input
                            inputMode="numeric"
                            value={c.monthly_goal}
                            onChange={(e) => updateConsultora(globalIndex, "monthly_goal", e.target.value)}
                            className="h-9 bg-white border-slate-200 text-sm w-28"
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                    <span className="text-xs font-medium text-slate-500 w-48">Total</span>
                    <span className="text-sm font-semibold text-slate-700 w-28 pl-3">
                      {consultorasTotal > 0 ? consultorasTotal : "—"}
                    </span>
                  </div>
                </div>
              )}
              {consultoras.filter((c) => c.name.trim()).length > 0 && (
                <Button
                  onClick={() => void handleSaveConsultoras("consultorasGoals")}
                  disabled={savingSections.consultorasGoals}
                  variant="outline"
                  className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  {savingSections.consultorasGoals ? "Salvando…" : "Salvar metas"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Student base goals */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Meta de Base de Alunos
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Meta de alunos ativos ao final de cada mês.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                {MONTHS_PT.map((label, i) => {
                  const month = i + 1;
                  return (
                    <div key={month} className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-slate-500">{label}</Label>
                      <Input
                        inputMode="numeric"
                        value={studentBaseGoals[month] ?? ""}
                        onChange={(e) =>
                          setStudentBaseGoals((prev) => ({ ...prev, [month]: e.target.value }))
                        }
                        className="h-9 bg-white border-slate-200 text-sm"
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
              <Button
                onClick={() => void handleSaveStudentBaseGoals()}
                disabled={savingSections.studentBaseGoals}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {savingSections.studentBaseGoals ? "Salvando…" : "Salvar metas de base"}
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="evo-api-token" className="text-xs font-medium text-slate-600">
                  EVO API Token
                </Label>
                <Input
                  id="evo-api-token"
                  type="password"
                  autoComplete="off"
                  value={evoApiToken}
                  onChange={(e) => setEvoApiToken(e.target.value)}
                  className="h-10 bg-white border-slate-200"
                  placeholder="Token da academia no sistema EVO"
                />
                <p className="text-xs text-slate-400">
                  Token de autenticação para buscar recebimentos e centros de receita da EVO.
                </p>
              </div>
              <Button
                onClick={() => void handleSaveApiKeys()}
                disabled={savingSections.apiKeys}
                variant="outline"
                className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {savingSections.apiKeys ? "Salvando…" : "Salvar chaves"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
