"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";

type Props = {
	defaultTab?: "mensal" | "semanal";
	monthlyContent: ReactNode;
	weeklyContent: ReactNode;
};

export function DashboardTabs({
	defaultTab = "mensal",
	monthlyContent,
	weeklyContent,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const [, startTransition] = useTransition();

	const getTabFromUrl = (): "mensal" | "semanal" => {
		const tab = searchParams.get("tab");
		if (tab === "semanal" || tab === "mensal") return tab;
		if (searchParams.get("week")) return "semanal";
		return defaultTab;
	};

	const [activeTab, setActiveTab] = useState<"mensal" | "semanal">(getTabFromUrl);

	useEffect(() => {
		const tabFromUrl = getTabFromUrl();
		if (tabFromUrl !== activeTab) {
			setActiveTab(tabFromUrl);
		}
	}, [searchParams]);

	const handleTabChange = (value: string) => {
		const nextTab = value as "mensal" | "semanal";
		setActiveTab(nextTab);

		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", nextTab);
		if (nextTab === "mensal" && params.has("week")) {
			params.delete("week");
		}
		startTransition(() => {
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		});
	};

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="w-full"
		>
			<TabsList className="mb-6 h-auto rounded-none bg-transparent p-0 gap-2">
				<TabsTrigger
					value="semanal"
					className="rounded-none px-6 py-2.5 text-xs font-bold text-[color:var(--text-secondary)] border border-[color:var(--border-subtle)] bg-white data-active:!bg-[#ff6100] data-active:!border-[#ff6100] data-active:!text-white data-[state=active]:!bg-[#ff6100] data-[state=active]:!border-[#ff6100] data-[state=active]:!text-white transition-all botao-chanfrado-nav cursor-pointer shadow-sm hover:text-[color:var(--text-primary)]"
				>
					Semanal
				</TabsTrigger>
				<TabsTrigger
					value="mensal"
					className="rounded-none px-6 py-2.5 text-xs font-bold text-[color:var(--text-secondary)] border border-[color:var(--border-subtle)] bg-white data-active:!bg-[#ff6100] data-active:!border-[#ff6100] data-active:!text-white data-[state=active]:!bg-[#ff6100] data-[state=active]:!border-[#ff6100] data-[state=active]:!text-white transition-all botao-chanfrado-nav cursor-pointer shadow-sm hover:text-[color:var(--text-primary)]"
				>
					Mensal
				</TabsTrigger>
			</TabsList>

			<TabsContent value="semanal" className="space-y-6 focus-visible:outline-none">
				{weeklyContent}
			</TabsContent>

			<TabsContent value="mensal" className="space-y-6 focus-visible:outline-none">
				{monthlyContent}
			</TabsContent>
		</Tabs>
	);
}
