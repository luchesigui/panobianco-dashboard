import styles from "../page.module.css";

type MonthSelectorProps = {
	monthLabel: string;
};

/**
 * Visual-only month indicator. Will become an interactive selector that drives
 * data refetch in a follow-up — for now it just mirrors the current month label.
 */
export function MonthSelector({ monthLabel }: MonthSelectorProps) {
	return (
		<div className={styles.periodStrip}>
			<span>Período:</span>
			<strong>{monthLabel}</strong>
		</div>
	);
}
