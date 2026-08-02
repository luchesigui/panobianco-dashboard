"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../page.module.css";

type MonthSelectorProps = {
	monthLabel: string;
	prevPeriodId?: string;
	nextPeriodId?: string;
};

export function MonthSelector({
	monthLabel,
	prevPeriodId,
	nextPeriodId,
}: MonthSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const handleNavigate = (periodId?: string) => {
		if (!periodId) return;
		const params = new URLSearchParams(searchParams.toString());
		params.set("period", periodId);
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className={styles.periodStrip}>
			<button
				type="button"
				className={styles.periodNavBtn}
				onClick={() => handleNavigate(prevPeriodId)}
				disabled={!prevPeriodId}
				aria-label="Mês anterior"
				title="Mês anterior"
			>
				<ChevronLeft size={16} />
			</button>
			<div className={styles.periodLabelWrapper}>
				<span>Período:</span>
				<strong>{monthLabel}</strong>
			</div>
			<button
				type="button"
				className={styles.periodNavBtn}
				onClick={() => handleNavigate(nextPeriodId)}
				disabled={!nextPeriodId}
				aria-label="Próximo mês"
				title="Próximo mês"
			>
				<ChevronRight size={16} />
			</button>
		</div>
	);
}

