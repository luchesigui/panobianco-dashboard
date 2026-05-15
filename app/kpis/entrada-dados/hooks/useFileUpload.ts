"use client";

import { useCallback, useState } from "react";

type UploadKind = "crescimento" | "recebimentos" | "custos" | "recuperacao";

type Options = {
	kind: UploadKind;
	periodId: string;
	onSuccess: (json: Record<string, unknown>) => void;
	onError: (text: string) => void;
};

export function useFileUpload({
	kind,
	periodId,
	onSuccess,
	onError,
}: Options) {
	const [uploading, setUploading] = useState(false);

	const handleFile = useCallback(
		async (file: File) => {
			setUploading(true);
			try {
				const data = new FormData();
				data.set("file", file);
				if (kind === "recebimentos") {
					data.set("period", periodId.slice(0, 7));
				}
				const res = await fetch(`/api/parse/${kind}`, {
					method: "POST",
					body: data,
				});
				const json = (await res.json()) as Record<string, unknown>;
				if (!res.ok) {
					throw new Error(
						typeof json.error === "string"
							? json.error
							: `Falha ao processar ${kind}.`,
					);
				}
				onSuccess(json);
			} catch (error) {
				const text =
					error instanceof Error
						? error.message
						: `Erro ao processar arquivo de ${kind}.`;
				onError(text);
			} finally {
				setUploading(false);
			}
		},
		[kind, periodId, onSuccess, onError],
	);

	return { uploading, handleFile };
}
