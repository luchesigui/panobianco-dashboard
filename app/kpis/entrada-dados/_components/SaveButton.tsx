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
			className="h-10 rounded-full bg-[#ff6100] px-6 font-extrabold uppercase tracking-[0.06em] text-white shadow-sm hover:bg-[#ff4b00]"
		>
			{loading ? loadingLabel : children}
		</Button>
	);
}
