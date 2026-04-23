import type { ReactNode } from "react";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navbar } from "./Navbar";
import styles from "./layout.module.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-kpi-body",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-kpi-display",
  weight: ["400", "600"],
});

export default function KpisLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={`${dmSans.variable} ${fraunces.variable} ${styles.kpiShell}`}>
      <Navbar />
      {children}
    </div>
  );
}
