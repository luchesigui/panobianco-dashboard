import type { ReactNode } from "react";
import styles from "../page.module.css";
import { clsx } from "clsx";

export type SectionColor =
	| "green"
	| "blue"
	| "orange"
	| "purple"
	| "pink"
	| "brown";

type Theme = {
	section: string;
};

const THEMES: Record<SectionColor, Theme> = {
	green: {
		section: styles.themeSectionOverview,
	},
	blue: {
		section: styles.themeSectionVendas,
	},
	orange: {
		section: styles.themeSectionRetencao,
	},
	purple: {
		section: styles.themeSectionFinanceiro,
	},
	pink: {
		section: styles.themeSectionPrevisao,
	},
	brown: {
		section: styles.themeSectionRoi,
	},
};

type SectionCardProps = {
	title: string;
	color: SectionColor;
	badge?: string;
	children?: ReactNode;
};

export function SectionCard({
	title,
	color,
	children,
}: SectionCardProps) {
	const theme = THEMES[color];
	return (
		<section className={clsx(styles.themeSection, theme.section)}>
			<div className={styles.themeHeader}>
				<h2>{title}</h2>
			</div>
			{children}
		</section>
	);
}
