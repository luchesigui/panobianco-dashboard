"use client";

import type { StatusMessage } from "../hooks/useStatusMessage";

type Props = {
	message: StatusMessage | null;
};

export function StatusAlert({ message }: Props) {
	if (!message) return null;
	return (
		<div
			className={`px-4 py-3 border text-sm mb-6 flex items-center gap-2 ${
				message.type === "ok"
					? "bg-[color:var(--surface-card)] border-[color:var(--action-primary)] text-[color:var(--text-primary)]"
					: "bg-[color:var(--surface-card)] border-[color:var(--feedback-negative)] text-[color:var(--feedback-negative)]"
			}`}
		>
			<span className={message.type === "ok" ? "text-[color:var(--action-primary)] font-bold" : "text-[color:var(--feedback-negative)] font-bold"}>
				{message.type === "ok" ? "✓" : "✕"}
			</span>{" "}
			{message.text}
		</div>
	);
}
