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
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className="btn-primary h-11 px-8 text-xs font-bold uppercase tracking-[0.08em] shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{loading ? loadingLabel : children}
		</button>
	);
}
