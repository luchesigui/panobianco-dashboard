import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Navbar } from "./Navbar";
import styles from "./layout.module.css";
import { clsx } from "clsx";

const body = Barlow({
	subsets: ["latin"],
	variable: "--font-kpi-body",
	weight: ["400", "500", "600", "700", "800"],
	display: "swap",
});

const display = Barlow_Condensed({
	subsets: ["latin"],
	variable: "--font-kpi-display",
	weight: ["700", "800", "900"],
	display: "swap",
});

export default function KpisLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<div className={clsx(body.variable, display.variable, styles.kpiShell)}>
			<Navbar />
			{children}
		</div>
	);
}
