"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/kpis", label: "Dashboard", exact: true },
  { href: "/kpis/entrada-dados", label: "Adicionar dados", exact: false },
  { href: "/kpis/configuracoes", label: "Configurações", exact: false },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
        <Link href="/kpis" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-emerald-700 flex items-center justify-center text-white text-xs font-bold tracking-tight">
            P
          </div>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">
            Panobianco
          </span>
        </Link>

        <nav className="flex items-center gap-1 ml-auto">
          {NAV_LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
