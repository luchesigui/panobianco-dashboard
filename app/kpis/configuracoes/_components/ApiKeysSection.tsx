"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseSettingsForm } from "../hooks/useSettingsForm";

type Props = {
	apiKeys: UseSettingsForm["apiKeys"];
};

export function ApiKeysSection({ apiKeys }: Props) {
	return (
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
					<Label
						htmlFor="claude-api-key"
						className="text-xs font-medium text-slate-600"
					>
						Claude API Key
					</Label>
					<Input
						id="claude-api-key"
						type="password"
						autoComplete="off"
						value={apiKeys.claudeApiKey}
						onChange={(e) => apiKeys.setClaudeApiKey(e.target.value)}
						className="h-10 bg-white border-slate-200"
						placeholder="sk-ant-…"
					/>
					<p className="text-xs text-slate-400">
						Chave da API Anthropic para geração automática de insights e
						análises do dashboard.
					</p>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label
						htmlFor="evo-api-token"
						className="text-xs font-medium text-slate-600"
					>
						EVO API Token
					</Label>
					<Input
						id="evo-api-token"
						type="password"
						autoComplete="off"
						value={apiKeys.evoApiToken}
						onChange={(e) => apiKeys.setEvoApiToken(e.target.value)}
						className="h-10 bg-white border-slate-200"
						placeholder="Token da academia no sistema EVO"
					/>
					<p className="text-xs text-slate-400">
						Token de autenticação para buscar recebimentos e centros de receita
						da EVO.
					</p>
				</div>
				<Button
					onClick={() => void apiKeys.handleSave()}
					disabled={apiKeys.saving}
					variant="outline"
					className="h-9 px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
				>
					{apiKeys.saving ? "Salvando…" : "Salvar chaves"}
				</Button>
			</CardContent>
		</Card>
	);
}
