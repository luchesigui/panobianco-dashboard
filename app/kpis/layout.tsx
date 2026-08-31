import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import { Navbar } from "./Navbar";
import styles from "./layout.module.css";
import brandStyles from "./kpi-brand.module.css";
import { clsx } from "clsx";

// Forma DJR Micro is the 2026 brand font. Archivo is the approved
// operational fallback until the licensed font files are supplied.
const body = Archivo({
	subsets: ["latin"],
	variable: "--font-kpi-body",
	weight: ["400", "500", "600", "700", "800", "900"],
	display: "swap",
});

const display = Archivo({
	subsets: ["latin"],
	variable: "--font-kpi-display",
	weight: ["400", "500", "600", "700", "800", "900"],
	display: "swap",
});

export default function KpisLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<div className={clsx(body.variable, display.variable, styles.kpiShell, brandStyles.kpiScope)}>
			<Navbar />
			{children}
		</div>
	);
}
