"use client";

import type { StatusMessage } from "../hooks/useSettingsForm";

type Props = {
	message: StatusMessage | null;
};

export function SettingsMessage({ message }: Props) {
	if (!message) return null;
	return (
		<div
			className={`px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2 ${
				message.type === "ok"
					? "bg-emerald-50 border border-emerald-200 text-emerald-800"
					: "bg-red-50 border border-red-200 text-red-800"
			}`}
		>
			<span className="shrink-0 mt-0.5">
				{message.type === "ok" ? "✓" : "✕"}
			</span>
			<pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
				{message.text}
			</pre>
		</div>
	);
}
