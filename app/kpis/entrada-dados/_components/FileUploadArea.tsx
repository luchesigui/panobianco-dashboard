"use client";

import { Upload } from "lucide-react";

type Props = {
	label: string;
	onFile: (file: File) => void;
	loading: boolean;
};

export function FileUploadArea({ label, onFile, loading }: Props) {
	return (
		<label className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
			<span>{label}</span>
			<span className="inline-flex items-center gap-2">
				<Upload className="h-3.5 w-3.5" />
				{loading ? "Processando..." : "Importar .xlsx"}
			</span>
			<input
				type="file"
				accept=".xlsx"
				className="hidden"
				disabled={loading}
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) onFile(file);
					e.currentTarget.value = "";
				}}
			/>
		</label>
	);
}
