"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/logout";
import { clsx } from "clsx";
import brandStyles from "./kpi-brand.module.css";

const NAV_LINKS = [
	{ href: "/kpis", label: "Dashboard", exact: true },
	{ href: "/kpis/entrada-dados", label: "Adicionar dados", exact: false },
	{ href: "/kpis/configuracoes", label: "Configurações", exact: false },
];

export function Navbar() {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 border-b border-[color:var(--border-strong)] bg-[color:var(--pb-grena)] text-[color:var(--pb-off-white)]">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
				<Link href="/kpis" className="flex shrink-0 items-center gap-2.5 uppercase">
					<span className={brandStyles.brandEdge} aria-hidden />
					<span className="text-sm font-bold tracking-[0.08em] text-[color:var(--pb-white)]">
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
									"text-xs font-semibold uppercase tracking-[0.06em] transition-colors",
									active
										? clsx(brandStyles.brandControl, "text-[color:var(--pb-white)]")
										: "px-4 py-1.5 text-[color:var(--pb-off-white)]/80 hover:bg-white/10 hover:text-[color:var(--pb-white)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[color:var(--focus-ring)]"
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
						className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[color:var(--pb-off-white)]/80 transition-colors hover:bg-white/10 hover:text-[color:var(--pb-white)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[color:var(--focus-ring)]"
					>
						Sair
					</button>
				</form>
			</div>
		</header>
	);
}
