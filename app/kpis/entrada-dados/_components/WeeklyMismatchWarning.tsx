"use client";

type Props = {
	messages: string[];
};

export function WeeklyMismatchWarning({ messages }: Props) {
	if (messages.length === 0) return null;
	return (
		<div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
			<strong>Aviso (não bloqueia gravação):</strong>
			<ul className="mt-1.5 ml-4 list-disc">
				{messages.map((m) => (
					<li key={m}>{m}</li>
				))}
			</ul>
		</div>
	);
}
