import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const brandFont = localFont({
  src: [
    {
      path: "../public/fonts/FormaDJRMicro-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/FormaDJRMicro-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/FormaDJRMicro-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-brand",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
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
    <html lang="pt-BR" className={`${brandFont.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased"><TooltipProvider>{children}</TooltipProvider></body>
    </html>
  );
}
