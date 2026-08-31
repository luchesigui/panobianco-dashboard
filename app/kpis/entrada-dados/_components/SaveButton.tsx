"use client";

import { Button } from "@/components/ui/button";
import brand from "../../kpi-brand.module.css";

type Props = {
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
	loadingLabel?: string;
	children: React.ReactNode;
};

export function SaveButton({
	onClick,
	disabled,
	loading,
	loadingLabel = "Salvando…",
	children,
}: Props) {
	return (
		<Button
			onClick={onClick}
			disabled={disabled || loading}
			className={`${brand.brandControl} h-10 px-6 font-semibold uppercase tracking-[0.06em] transition-colors hover:bg-[color:var(--pb-graphite)] hover:border-[color:var(--pb-graphite)]`}
		>
			{loading ? loadingLabel : children}
		</Button>
	);
}
