"use client";

import { useCallback, useState } from "react";

export function useFormLockState() {
	const [crescimentoLocked, setCrescimentoLocked] = useState(true);
	const [recebimentosLocked, setRecebimentosLocked] = useState(true);
	const [custosLocked, setCustosLocked] = useState(true);

	const isGroupLocked = useCallback(
		(groupId: string): boolean => {
			if (groupId === "overview" || groupId === "retention")
				return crescimentoLocked;
			if (groupId === "finance_revenues") return recebimentosLocked;
			return false;
		},
		[crescimentoLocked, recebimentosLocked],
	);

	const isRevenueFieldAlwaysEditable = useCallback(
		(code: string): boolean =>
			code === "wellhub_revenue" || code === "totalpass_revenue",
		[],
	);

	const isRetentionFieldAlwaysEditable = useCallback(
		(code: string): boolean =>
			code === "open_default_count" || code === "open_default_value",
		[],
	);

	return {
		crescimentoLocked,
		setCrescimentoLocked,
		recebimentosLocked,
		setRecebimentosLocked,
		custosLocked,
		setCustosLocked,
		isGroupLocked,
		isRevenueFieldAlwaysEditable,
		isRetentionFieldAlwaysEditable,
	};
}

export type UseFormLockState = ReturnType<typeof useFormLockState>;
