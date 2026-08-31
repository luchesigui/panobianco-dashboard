"use client";

import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "light-on-dark" | "dark-on-light" | "orange";

interface LogoProps {
	className?: string;
	width?: number;
	height?: number;
	showLink?: boolean;
	variant?: LogoVariant;
	priority?: boolean;
	href?: string;
}

const LOGO_SRC: Record<LogoVariant, string> = {
	"light-on-dark": "/logo-white.svg",
	"dark-on-light": "/logo-black.svg",
	orange: "/logo-orange.svg",
};

export default function Logo({
	className = "",
	width = 146,
	height = 27,
	showLink = true,
	variant = "light-on-dark",
	priority = true,
	href = "/kpis",
}: LogoProps) {
	const logoImage = (
		<Image
			src={LOGO_SRC[variant]}
			alt="Panobianco"
			width={width}
			height={height}
			className={className}
			priority={priority}
		/>
	);

	if (showLink) {
		return (
			<Link href={href} className="inline-flex items-center">
				{logoImage}
			</Link>
		);
	}

	return <span className="inline-flex items-center">{logoImage}</span>;
}
