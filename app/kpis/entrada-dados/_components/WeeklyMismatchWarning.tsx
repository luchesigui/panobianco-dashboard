"use client";

type Props = {
	messages: string[];
};

export function WeeklyMismatchWarning({ messages }: Props) {
	if (messages.length === 0) return null;
	return (
		<div className="bg-[color:var(--surface-card)] border border-[color:var(--border-strong)] text-[color:var(--text-primary)] px-4 py-3 text-sm">
			<strong className="text-[color:var(--pb-orange-warm)]">Aviso (não bloqueia gravação):</strong>
			<ul className="mt-1.5 ml-4 list-disc text-xs text-[color:var(--text-secondary)]">
				{messages.map((m) => (
					<li key={m}>{m}</li>
				))}
			</ul>
		</div>
	);
}
