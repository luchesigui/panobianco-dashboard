"use client";

import type { StatusMessage } from "../hooks/useStatusMessage";

type Props = {
	message: StatusMessage | null;
};

export function StatusAlert({ message }: Props) {
	if (!message) return null;
	return (
		<div
			className={`px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 ${
				message.type === "ok"
					? "bg-emerald-50 border border-emerald-200 text-emerald-800"
					: "bg-red-50 border border-red-200 text-red-800"
			}`}
		>
			{message.type === "ok" ? "✓" : "✕"} {message.text}
		</div>
	);
}
