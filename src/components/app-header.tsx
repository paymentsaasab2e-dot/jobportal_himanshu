"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { SendIcon, BellIcon } from "lucide-react";

const defaultActiveItem = navLinks.find((item) => item.isActive) || {
	title: "Dashboard",
};

export function AppHeader({ pageTitle }: { pageTitle?: string }) {
	const page = pageTitle
		? { title: pageTitle }
		: defaultActiveItem;

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#28A8E1]/12 bg-white/90 px-4 backdrop-blur-md md:px-6"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={page} />
			</div>
			<div className="flex items-center gap-3">
				<Button size="icon-sm" variant="outline">
					<SendIcon />
				</Button>
				<Button aria-label="Notifications" size="icon-sm" variant="outline">
					<BellIcon />
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
