import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Archivo } from "next/font/google";
import { Navbar } from "./Navbar";
import styles from "./layout.module.css";
import brandStyles from "./kpi-brand.module.css";
import { clsx } from "clsx";

const brandFont = localFont({
	src: [
		{
			path: "../../public/fonts/FormaDJRMicro-Light.ttf",
			weight: "300",
			style: "normal",
		},
		{
			path: "../../public/fonts/FormaDJRMicro-Regular.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/fonts/FormaDJRMicro-Bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-brand",
	display: "swap",
});

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
		<div className={clsx(brandFont.variable, body.variable, display.variable, styles.kpiShell, brandStyles.kpiScope)}>
			<Navbar />
			{children}
		</div>
	);
}
