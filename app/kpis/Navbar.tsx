"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/logout";
import { clsx } from "clsx";
import Logo from "@/components/Logo";

const NAV_LINKS = [
	{ href: "/kpis", label: "Dashboard", exact: true },
	{ href: "/kpis/entrada-dados", label: "Adicionar dados", exact: false },
	{ href: "/kpis/configuracoes", label: "Configurações", exact: false },
];

export function Navbar() {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 h-20 border-b border-white/10 bg-[#161515]/95 backdrop-blur-md text-white">
			<div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
				<div className="flex items-center gap-3">
					<Logo width={146} height={27} variant="light-on-dark" href="/kpis" />
					<span className="hidden sm:inline-block text-xs font-medium text-white/40 border-l border-white/10 pl-3">
						Dashboard
					</span>
				</div>

				<div className="flex items-center gap-6">
					<nav className="flex items-center gap-2">
						{NAV_LINKS.map(({ href, label, exact }) => {
							const active = exact ? pathname === href : pathname.startsWith(href);
							return (
								<Link
									key={href}
									href={href}
									className={clsx(
										"text-xs font-semibold tracking-wide transition-all",
										active
											? "botao-chanfrado-nav bg-[#ff6100] px-4 py-2 font-bold text-white shadow-sm hover:bg-[#cc3300]"
											: "px-3 py-2 text-white/80 hover:text-[#ff6100]"
									)}
								>
									{label}
								</Link>
							);
						})}
					</nav>

					<form action={logout}>
						<button
							type="submit"
							className="text-xs font-medium text-white/60 transition-colors hover:text-white px-2 py-1 cursor-pointer"
						>
							Sair
						</button>
					</form>
				</div>
			</div>
		</header>
	);
}
