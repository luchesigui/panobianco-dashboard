import type { ReactNode } from "react";
import { formatDeltaPill } from "@/lib/kpis/format";
import styles from "./KpiCard.module.css";

type PillTone = "auto" | "good" | "bad" | "neutral" | "invert";

function toneClass(tone: Exclude<PillTone, "auto" | "invert">): string {
	if (tone === "good") return styles.pillGood;
	if (tone === "bad") return styles.pillBad;
	return styles.pillNeutral;
}

function autoTone(value: number, invert: boolean): string {
	if (value === 0) return styles.pillNeutral;
	const positive = value > 0;
	const isGood = invert ? !positive : positive;
	return isGood ? styles.pillGood : styles.pillBad;
}

type CardProps = {
	accentColor?: string;
	className?: string;
	children: ReactNode;
};

function Card({ accentColor, className, children }: CardProps) {
	return (
		<article className={`${styles.card}${className ? ` ${className}` : ""}`}>
			{children}
			{accentColor != null ? (
				<span
					className={styles.accentBar}
					style={{ background: accentColor }}
					aria-hidden
				/>
			) : null}
		</article>
	);
}

function Header({ children }: { children: ReactNode }) {
	return <div className={styles.header}>{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
	return <span className={styles.title}>{children}</span>;
}

function MainNumber({ children }: { children: ReactNode }) {
	return <p className={styles.mainNumber}>{children}</p>;
}

type SubdescriptionProps = {
	tone?: "default" | "muted" | "danger";
	children: ReactNode;
};

function Subdescription({ tone = "default", children }: SubdescriptionProps) {
	const cls = [styles.subdescription];
	if (tone === "muted") cls.push(styles.subdescriptionMuted);
	if (tone === "danger") cls.push(styles.subdescriptionDanger);
	return <p className={cls.join(" ")}>{children}</p>;
}

type PillProps =
	| {
			value: number;
			tone?: PillTone;
			suffix?: string;
			/** Format whole-percent (default true). */
			pctAsInteger?: boolean;
	  }
	| {
			value?: undefined;
			tone: Exclude<PillTone, "auto" | "invert">;
			label: string;
			suffix?: string;
	  };

function Pill(props: PillProps) {
	if (props.value === undefined) {
		const cls = `${styles.pill} ${toneClass(props.tone)}`;
		return (
			<p className={styles.pillRow}>
				<span className={cls}>{props.label}</span>
				{props.suffix ? <span>{props.suffix}</span> : null}
			</p>
		);
	}
	const tone = props.tone ?? "auto";
	const asInteger = props.pctAsInteger ?? true;
	const pillText = formatDeltaPill(props.value, asInteger);
	const cls =
		tone === "auto"
			? `${styles.pill} ${autoTone(props.value, false)}`
			: tone === "invert"
				? `${styles.pill} ${autoTone(props.value, true)}`
				: `${styles.pill} ${toneClass(tone)}`;
	return (
		<p className={styles.pillRow}>
			<span className={cls}>{pillText}</span>
			{props.suffix ? <span>{props.suffix}</span> : null}
		</p>
	);
}

export const KpiCard = Object.assign(Card, {
	Header,
	Title,
	MainNumber,
	Subdescription,
	Pill,
});

export type { PillTone };
