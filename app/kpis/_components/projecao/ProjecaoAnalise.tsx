import type { ForecastAnalysisItem } from "@/lib/data/kpis";
import styles from "./projecao.module.css";

function analysisIconClass(t: ForecastAnalysisItem["type"]): string {
	if (t === "good") return styles.iconGood;
	if (t === "bad") return styles.iconBad;
	if (t === "warn") return styles.iconWarn;
	return styles.iconInfo;
}

function analysisGlyph(t: ForecastAnalysisItem["type"]): string {
	if (t === "good") return "▲";
	if (t === "bad") return "▼";
	if (t === "warn") return "●";
	return "i";
}

type Props = {
	nextPeriodLabel: string;
	analysis: ForecastAnalysisItem[];
};

export function ProjecaoAnalise({ nextPeriodLabel, analysis }: Props) {
	const periodCaps = (() => {
		const i = nextPeriodLabel.indexOf("/");
		if (i === -1) return nextPeriodLabel.toUpperCase();
		return `${nextPeriodLabel.slice(0, i).toUpperCase()}/${nextPeriodLabel.slice(i + 1)}`;
	})();
	const headerCaps = `PREVISÃO ${periodCaps} — ANÁLISE`;

	return (
		<div className={styles.analysisWrap}>
			<div className={styles.analysisCard}>
				<div className={styles.analysisHeader}>{headerCaps}</div>
				<div className={styles.analysisBody}>
					{analysis.map((item) => (
						<div
							key={`${item.type}-${item.body.slice(0, 48)}`}
							className={styles.analysisItem}
						>
							<span
								className={`${styles.analysisIcon} ${analysisIconClass(item.type)}`}
								aria-hidden
							>
								{analysisGlyph(item.type)}
							</span>
							<p className={styles.analysisText}>{item.body}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
