import type { ReactNode } from "react";
import brandStyles from "../kpi-brand.module.css";
import styles from "../page.module.css";

type SectionCardProps = {
	title: string;
	/** Human-readable period/status metadata, not a color-coded badge. */
	badge?: string;
	children?: ReactNode;
};

export function SectionCard({ title, badge, children }: SectionCardProps) {
	return (
		<section className={styles.themeSection}>
			<div className={styles.themeHeader}>
				<h2>{title}</h2>
				{badge ? <p className={styles.themeMeta}>{badge}</p> : null}
			</div>
			{children}
		</section>
	);
}
