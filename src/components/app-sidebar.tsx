"use client";

import { useEffect, useMemo } from "react";
import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/nav-group";
import {
	footerNavLinks,
	navGroups,
	type SidebarNavGroup,
	type SidebarNavItem,
} from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { PlusIcon, SearchIcon } from "lucide-react";

function withActivePath(
	groups: SidebarNavGroup[],
	activePath?: string,
): SidebarNavGroup[] {
	if (!activePath) return groups;

	const markItem = (item: SidebarNavItem): SidebarNavItem => ({
		...item,
		isActive: item.path === activePath || item.subItems?.some((sub) => sub.path === activePath),
		subItems: item.subItems?.map((sub) => ({
			...sub,
			isActive: sub.path === activePath,
		})),
	});

	return groups.map((group) => ({
		...group,
		items: group.items.map(markItem),
	}));
}

export function AppSidebar({ activePath }: { activePath?: string }) {
	const groups = useMemo(() => withActivePath(navGroups, activePath), [activePath]);

	useEffect(() => {
		if (!activePath) return;
		const frame = window.requestAnimationFrame(() => {
			const active = document.querySelector(
				'.employers-dashboard-preview [data-slot="sidebar-menu-button"][data-active="true"]',
			);
			active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [activePath]);

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader className="h-14 justify-center">
				<SidebarMenuButton render={<a href="#link" />}>
					<LogoIcon />
					<span className="font-medium">HRYantra</span>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenuItem className="flex items-center gap-2">
						<SidebarMenuButton
							className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
							tooltip="Create lead"
						>
							<PlusIcon />
							<span>New Lead</span>
						</SidebarMenuButton>
						<Button
							aria-label="Search workspace"
							className="size-8 group-data-[collapsible=icon]:opacity-0"
							size="icon"
							variant="outline"
						>
							<SearchIcon />
							<span className="sr-only">Search workspace</span>
						</Button>
					</SidebarMenuItem>
				</SidebarGroup>
				{groups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<LatestChange />
				<SidebarMenu className="mt-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								className="text-muted-foreground"
								isActive={item.isActive}
								size="sm"
								render={<a href={item.path} />}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
