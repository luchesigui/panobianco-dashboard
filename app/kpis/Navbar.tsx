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
		<header className="sticky top-0 z-50 border-b border-black/20 bg-[#330000]/95 text-[#faede4] shadow-sm backdrop-blur">
			<div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
				<Link href="/kpis" className="flex items-center gap-2.5 shrink-0 uppercase">
					<span className="h-6 w-1 bg-[#ff6100] [clip-path:polygon(0_0,100%_0,100%_72%,0_100%)]" aria-hidden />
					<span className="text-sm font-extrabold tracking-[0.08em] text-white">
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
										? "bg-[#ff6100] text-[#161515] shadow-sm"
										: "text-[#faede4]/75 hover:bg-white/10 hover:text-white"
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
						className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-[0.06em] text-[#faede4]/75 hover:bg-white/10 hover:text-white transition-colors"
					>
						Sair
					</button>
				</form>
			</div>
		</header>
	);
}
