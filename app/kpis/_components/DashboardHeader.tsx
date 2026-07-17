import styles from "../page.module.css";

type DashboardHeaderProps = {
	gymName: string;
};

export function DashboardHeader({ gymName }: DashboardHeaderProps) {
	return (
		<div className={styles.brand}>
			<div>
				<h1 className={styles.title}>Dashboard estratégico</h1>
				<p className={styles.subtitle}>{gymName}</p>
			</div>
		</div>
	);
}
