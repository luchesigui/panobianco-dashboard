import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const archivoBody = Archivo({
  subsets: ["latin"],
  variable: "--font-kpi-body",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const archivoDisplay = Archivo({
  subsets: ["latin"],
  variable: "--font-kpi-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panobianco KPI Dashboard",
  description: "KPI dashboard integrado ao Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivoBody.variable} ${archivoDisplay.variable}`} suppressHydrationWarning>
      <body><TooltipProvider>{children}</TooltipProvider></body>
    </html>
  );
}
