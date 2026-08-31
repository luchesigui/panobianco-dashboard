"use client";

import type { StatusMessage } from "../hooks/useSettingsForm";

type Props = {
	message: StatusMessage | null;
};

export function SettingsMessage({ message }: Props) {
	if (!message) return null;
	return (
		<div
			className={`px-4 py-3 border text-sm mb-6 flex items-start gap-2 ${
				message.type === "ok"
					? "bg-[color:var(--surface-card)] border-[color:var(--action-primary)] text-[color:var(--text-primary)]"
					: "bg-[color:var(--surface-card)] border-[color:var(--feedback-negative)] text-[color:var(--feedback-negative)]"
			}`}
		>
			<span className={`shrink-0 mt-0.5 font-bold ${message.type === "ok" ? "text-[color:var(--action-primary)]" : "text-[color:var(--feedback-negative)]"}`}>
				{message.type === "ok" ? "✓" : "✕"}
			</span>
			<pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
				{message.text}
			</pre>
		</div>
	);
}
