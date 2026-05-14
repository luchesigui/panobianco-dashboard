import type { ReactNode } from "react";
import styles from "../page.module.css";

export type SectionColor =
	| "green"
	| "blue"
	| "orange"
	| "purple"
	| "pink"
	| "brown";

type Theme = {
	section: string;
	icon: string;
	badge: string;
};

const THEMES: Record<SectionColor, Theme> = {
	green: {
		section: styles.themeSectionOverview,
		icon: styles.themeIconAccent,
		badge: styles.badgeOverview,
	},
	blue: {
		section: styles.themeSectionVendas,
		icon: styles.themeIconBlue,
		badge: styles.badgeVendas,
	},
	orange: {
		section: styles.themeSectionRetencao,
		icon: styles.themeIconCoral,
		badge: styles.badgeRetencao,
	},
	purple: {
		section: styles.themeSectionFinanceiro,
		icon: styles.themeIconPurple,
		badge: styles.badgeFinanceiro,
	},
	pink: {
		section: styles.themeSectionPrevisao,
		icon: styles.themeIconPrevisao,
		badge: styles.badgePrevisao,
	},
	brown: {
		section: styles.themeSectionRoi,
		icon: styles.themeIconRoiBrown,
		badge: styles.badgeRoi,
	},
};

type SectionCardProps = {
	title: string;
	color: SectionColor;
	iconShort: string;
	badge?: string;
	children?: ReactNode;
};

export function SectionCard({
	title,
	color,
	iconShort,
	badge,
	children,
}: SectionCardProps) {
	const theme = THEMES[color];
	return (
		<section className={`${styles.themeSection} ${theme.section}`}>
			<div className={styles.themeHeader}>
				<div className={`${styles.themeIcon} ${theme.icon}`} aria-hidden>
					{iconShort}
				</div>
				<h2>{title}</h2>
				{badge ? (
					<span className={`${styles.themeBadge} ${theme.badge}`}>{badge}</span>
				) : null}
			</div>
			{children}
		</section>
	);
}
