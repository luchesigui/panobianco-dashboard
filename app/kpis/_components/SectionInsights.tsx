"use client";

import { type ReactNode, useState } from "react";
import styles from "../page.module.css";
import { generateAiInsightsAction } from "../actions";
import { ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";

export type InsightVariant =
	| "overview"
	| "sales_marketing"
	| "sales_marketing_weekly"
	| "retention"
	| "finance"
	| "forecast"
	| "roi";

export type InsightItem = {
	type: string;
	title: string;
	body: string;
};

const HEADER_LABEL: Record<InsightVariant, string> = {
	overview: "Insights",
	sales_marketing: "Insights",
	sales_marketing_weekly: "Insights",
	retention: "Insights",
	finance: "Insights",
	forecast: "Insights",
	roi: "Insights",
};

const CAPS_HEADER: Record<InsightVariant, boolean> = {
	overview: false,
	sales_marketing: true,
	sales_marketing_weekly: true,
	retention: true,
	finance: true,
	forecast: false,
	roi: true,
};

const PREFIX_BANG: Record<InsightVariant, boolean> = {
	overview: false,
	sales_marketing: false,
	sales_marketing_weekly: false,
	retention: false,
	finance: false,
	forecast: false,
	roi: false,
};

const HEADER_VARIANT_CLASS: Record<InsightVariant, string> = {
	overview: styles.headerOverview,
	sales_marketing: styles.headerVendas,
	sales_marketing_weekly: styles.headerVendas,
	retention: styles.headerRetencao,
	finance: styles.headerFinanceiro,
	forecast: styles.headerPrevisao,
	roi: styles.headerRoi,
};

function insightIconClass(type: string): string {
	const t = (type || "").toLowerCase();
	if (t === "good" || t === "positive" || t === "success")
		return styles.insightIconGood;
	if (t === "bad" || t === "negative" || t === "danger")
		return styles.insightIconBad;
	if (t === "warn" || t === "warning") return styles.insightIconWarn;
	if (t === "neutral") return styles.insightIconNeutral;
	return styles.insightIconInfo;
}

function insightGlyph(type: string): string {
	const t = (type || "").toLowerCase();
	if (t === "good" || t === "positive" || t === "success") return "▲";
	if (t === "bad" || t === "negative" || t === "danger") return "▼";
	if (t === "warn" || t === "warning" || t === "neutral") return "●";
	return "i";
}

function highlight50PercentInBody(body: string): ReactNode {
	if (!body) return "";
	const idx = body.indexOf("50%");
	if (idx === -1) return body;
	return (
		<>
			{body.slice(0, idx)}
			<span className={styles.insightGoodMark}>50%</span>
			{body.slice(idx + 3)}
		</>
	);
}

function highlightPayback19Meses(body: string): ReactNode {
	if (!body) return "";
	const marker = "~19 meses";
	const i = body.indexOf(marker);
	if (i === -1) return body;
	return (
		<>
			{body.slice(0, i)}
			<span className={styles.insightGoodMark}>{marker}</span>
			{body.slice(i + marker.length)}
		</>
	);
}

function HeaderIcon() {
	return (
		<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden style={{ width: "14px", height: "14px" }}>
			<title>Informação</title>
			<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V4zM8 12a1 1 0 110-2 1 1 0 010 2z" />
		</svg>
	);
}

function renderItemBody(variant: InsightVariant, item: InsightItem): ReactNode {
	const hasTitle = Boolean(item.title?.trim());
	if (variant === "overview" && !hasTitle) return item.body;
	if (variant === "finance" && !hasTitle) return item.body;
	if (variant === "roi" && !hasTitle) return highlightPayback19Meses(item.body);
	if (variant === "sales_marketing" && hasTitle) {
		return (
			<>
				<strong>{item.title}</strong> {item.body}
			</>
		);
	}
	if (variant === "sales_marketing_weekly" && hasTitle) {
		return (
			<>
				<strong>{item.title}</strong> {item.body}
			</>
		);
	}
	if (variant === "retention" && hasTitle) {
		return (
			<>
				<strong>{item.title}</strong> {highlight50PercentInBody(item.body)}
			</>
		);
	}
	return (
		<>
			<strong>{item.title}</strong>
			{item.body ? <> {item.body}</> : null}
		</>
	);
}

// biome-ignore lint/style/useDefaultParameterLast: <explanation>
function isSingleStyle(variant: InsightVariant, item: InsightItem): boolean {
	const hasTitle = Boolean(item.title?.trim());
	if (variant === "overview" && !hasTitle) return true;
	if (variant === "finance" && !hasTitle) return true;
	if (variant === "roi" && !hasTitle) return true;
	if (variant === "sales_marketing" && hasTitle) return true;
	if (variant === "sales_marketing_weekly" && hasTitle) return true;
	if (variant === "retention" && hasTitle) return true;
	return false;
}

type SectionInsightsProps = {
	variant: InsightVariant;
	items: InsightItem[];
	periodId: string;
	weekOfMonth?: string;
};

export function SectionInsights({ variant, items, periodId, weekOfMonth }: SectionInsightsProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleGenerate = async () => {
		setIsGenerating(true);
		setErrorMsg(null);
		try {
			const res = await generateAiInsightsAction(periodId, variant, weekOfMonth);
			if (!res.ok) {
				setErrorMsg(res.error || "Erro na geração dos insights.");
			}
		} catch (err) {
			setErrorMsg("Erro de conexão na requisição de IA.");
		} finally {
			setIsGenerating(false);
		}
	};

	const showAiButton = ["overview", "sales_marketing", "sales_marketing_weekly", "retention", "finance"].includes(variant);

	const cardClass = clsx(styles.insightCard, {
		[styles.insightCardRetention]: variant === "retention",
		[styles.insightCardRoi]: variant === "roi",
	});
	const headerClass = clsx(styles.insightCardHeader, HEADER_VARIANT_CLASS[variant], {
		[styles.insightHeaderCaps]: CAPS_HEADER[variant],
	});
	const headerLabel = variant === "sales_marketing_weekly" && weekOfMonth
		? `Insights — Semana ${weekOfMonth}`
		: `${PREFIX_BANG[variant] ? "! " : ""}${HEADER_LABEL[variant]}`;

	return (
		<div className={styles.insightsWrap}>
			<div className={cardClass}>
				<div className={headerClass}>
					<div className={styles.insightCardHeaderWrapper}>
						<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
							<HeaderIcon />
							<span>{headerLabel}</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							{showAiButton && items.length > 0 && (
								<button
									type="button"
									onClick={handleGenerate}
									disabled={isGenerating}
									className={styles.aiButton}
								>
									{isGenerating ? "Gerando..." : "Recalcular"}
								</button>
							)}
							<button
								type="button"
								onClick={() => setIsCollapsed(!isCollapsed)}
								className={styles.aiButton}
								style={{ padding: "4px" }}
								aria-label={isCollapsed ? "Expandir" : "Recolher"}
							>
								{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
							</button>
						</div>
					</div>
				</div>
				{!isCollapsed && (
					<div className={styles.insightCardBody}>
						{items.length === 0 ? (
							<div className={styles.insightCardBodyEmpty}>
								<p className={styles.insightEmptyText}>
									{errorMsg || "Nenhum insight disponível para esta seção."}
								</p>
								{showAiButton && (
									<button
										type="button"
										onClick={handleGenerate}
										disabled={isGenerating}
										className={styles.aiButton}
										style={{ marginLeft: "0" }}
									>
										{isGenerating ? "Gerando com IA..." : "Gerar insights com IA"}
									</button>
								)}
							</div>
						) : (
							items.map((insight, idx) => (
								<div key={`${variant}-${idx}`} className={styles.insightItem}>
									<div
										className={clsx(styles.insightIcon, insightIconClass(insight.type))}
										aria-hidden
									>
										{insightGlyph(insight.type)}
									</div>
									<div
										className={clsx({
											[styles.insightBodySingle]: isSingleStyle(variant, insight),
										})}
									>
										{renderItemBody(variant, insight)}
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
