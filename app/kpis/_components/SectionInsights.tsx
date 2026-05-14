import type { ReactNode } from "react";
import styles from "../page.module.css";

export type InsightVariant =
	| "overview"
	| "sales_marketing"
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
	overview: "Destaques do mês",
	sales_marketing: "Análise de vendas e marketing",
	retention: "Análise de retenção",
	finance: "ANÁLISE FINANCEIRA",
	forecast: "Insights",
	roi: "ANÁLISE DE RETORNO — BRUNO E GUILHERME",
};

const CAPS_HEADER: Record<InsightVariant, boolean> = {
	overview: false,
	sales_marketing: true,
	retention: true,
	finance: true,
	forecast: false,
	roi: true,
};

const PREFIX_BANG: Record<InsightVariant, boolean> = {
	overview: false,
	sales_marketing: false,
	retention: true,
	finance: true,
	forecast: false,
	roi: true,
};

const HEADER_VARIANT_CLASS: Record<InsightVariant, string> = {
	overview: styles.headerOverview,
	sales_marketing: styles.headerVendas,
	retention: styles.headerRetencao,
	finance: styles.headerFinanceiro,
	forecast: styles.headerPrevisao,
	roi: styles.headerRoi,
};

function insightIconClass(type: string): string {
	const t = type.toLowerCase();
	if (t === "good" || t === "positive" || t === "success")
		return styles.insightIconGood;
	if (t === "bad" || t === "negative" || t === "danger")
		return styles.insightIconBad;
	if (t === "warn" || t === "warning") return styles.insightIconWarn;
	if (t === "neutral") return styles.insightIconNeutral;
	return styles.insightIconInfo;
}

function insightGlyph(type: string): string {
	const t = type.toLowerCase();
	if (t === "good" || t === "positive" || t === "success") return "▲";
	if (t === "bad" || t === "negative" || t === "danger") return "▼";
	if (t === "warn" || t === "warning" || t === "neutral") return "●";
	return "i";
}

function highlight50PercentInBody(body: string): ReactNode {
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
		<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
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

function isSingleStyle(variant: InsightVariant, item: InsightItem): boolean {
	const hasTitle = Boolean(item.title?.trim());
	if (variant === "overview" && !hasTitle) return true;
	if (variant === "finance" && !hasTitle) return true;
	if (variant === "roi" && !hasTitle) return true;
	if (variant === "sales_marketing" && hasTitle) return true;
	if (variant === "retention" && hasTitle) return true;
	return false;
}

type SectionInsightsProps = {
	variant: InsightVariant;
	items: InsightItem[];
};

export function SectionInsights({ variant, items }: SectionInsightsProps) {
	if (items.length === 0) return null;
	const cardClass = `${styles.insightCard}${
		variant === "retention" ? ` ${styles.insightCardRetention}` : ""
	}${variant === "roi" ? ` ${styles.insightCardRoi}` : ""}`;
	const headerClass = `${styles.insightCardHeader} ${HEADER_VARIANT_CLASS[variant]} ${
		CAPS_HEADER[variant] ? styles.insightHeaderCaps : ""
	}`;
	const headerLabel = `${PREFIX_BANG[variant] ? "! " : ""}${HEADER_LABEL[variant]}`;
	return (
		<div className={styles.insightsWrap}>
			<div className={cardClass}>
				<div className={headerClass}>
					<HeaderIcon />
					{headerLabel}
				</div>
				<div className={styles.insightCardBody}>
					{items.map((insight, idx) => (
						<div key={`${variant}-${idx}`} className={styles.insightItem}>
							<div
								className={`${styles.insightIcon} ${insightIconClass(insight.type)}`}
								aria-hidden
							>
								{insightGlyph(insight.type)}
							</div>
							<div
								className={
									isSingleStyle(variant, insight)
										? styles.insightBodySingle
										: undefined
								}
							>
								{renderItemBody(variant, insight)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
