"use client";

import { Button } from "@/components/ui/button";

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
			className="h-10 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm"
		>
			{loading ? loadingLabel : children}
		</Button>
	);
}
