"use client";

import { useCallback, useState } from "react";

export type StatusMessage = { type: "ok" | "err"; text: string };

export function useStatusMessage() {
	const [message, setMessage] = useState<StatusMessage | null>(null);

	const showOk = useCallback((text: string) => {
		setMessage({ type: "ok", text });
	}, []);

	const showErr = useCallback((text: string) => {
		setMessage({ type: "err", text });
	}, []);

	const clear = useCallback(() => setMessage(null), []);

	return { message, showOk, showErr, clear };
}
