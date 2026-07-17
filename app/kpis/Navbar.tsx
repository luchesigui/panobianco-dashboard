"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/logout";
import { clsx } from "clsx";

const NAV_LINKS = [
	{ href: "/kpis", label: "Dashboard", exact: true },
	{ href: "/kpis/entrada-dados", label: "Adicionar dados", exact: false },
	{ href: "/kpis/configuracoes", label: "Configurações", exact: false },
];

export function Navbar() {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f6f3]/95 text-slate-900 shadow-sm backdrop-blur">
			<div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
				<Link href="/kpis" className="flex items-center gap-2.5 shrink-0 uppercase">
					<div className="w-8 h-8 bg-[#FF6100] flex items-center justify-center text-white text-sm font-black tracking-tight [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%,0_22%)]">
						P
					</div>
					<span className="text-sm font-extrabold tracking-[0.08em]">
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
								className={clsx(
									"px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-[0.06em] transition-colors",
									active
										? "bg-white text-slate-950 shadow-sm ring-1 ring-black/10"
										: "text-slate-500 hover:bg-white/70 hover:text-slate-900"
								)}
							>
								{label}
							</Link>
						);
					})}
				</nav>

				<form action={logout} className="ml-2">
					<button
						type="submit"
						className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-[0.06em] text-slate-500 hover:bg-white/70 hover:text-slate-900 transition-colors"
					>
						Sair
					</button>
				</form>
			</div>
		</header>
	);
}
