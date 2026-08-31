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
		<Card className="border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)]">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-bold text-[color:var(--text-primary)]">
					Chaves de API e integrações
				</CardTitle>
				<CardDescription className="text-xs text-[color:var(--text-muted)] mt-0.5">
					Conectores para EVO, Gemini e serviços externos.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-3 space-y-4">
				<div className="flex flex-col gap-1.5">
					<Label
						htmlFor="claude-api-key"
						className="text-xs font-medium text-[color:var(--text-secondary)]"
					>
						API Key da IA (Gemini / Claude)
					</Label>
					<Input
						id="claude-api-key"
						type="password"
						autoComplete="off"
						value={apiKeys.claudeApiKey}
						onChange={(e) => apiKeys.setClaudeApiKey(e.target.value)}
						className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
						placeholder="AIzaSy… ou sk-ant-…"
					/>
					<p className="text-xs text-[color:var(--text-muted)]">
						Chave da API (Gemini ou Anthropic) para geração automática de insights e análises do dashboard.
					</p>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label
						htmlFor="evo-api-token"
						className="text-xs font-medium text-[color:var(--text-secondary)]"
					>
						EVO API Token
					</Label>
					<Input
						id="evo-api-token"
						type="password"
						autoComplete="off"
						value={apiKeys.evoApiToken}
						onChange={(e) => apiKeys.setEvoApiToken(e.target.value)}
						className="h-10 bg-[color:var(--surface-card)] border-[color:var(--border-subtle)]"
						placeholder="Token da academia no sistema EVO"
					/>
					<p className="text-xs text-[color:var(--text-muted)]">
						Token de autenticação para buscar recebimentos e centros de receita
						da EVO.
					</p>
				</div>
				<Button
					onClick={() => void apiKeys.handleSave()}
					disabled={apiKeys.saving}
					variant="outline"
					className="h-9 px-5 border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]"
				>
					{apiKeys.saving ? "Salvando…" : "Salvar chaves"}
				</Button>
			</CardContent>
		</Card>
	);
}
