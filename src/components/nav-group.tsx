"use client";

import { useEffect, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup, SidebarNavItem } from "@/components/app-shared";
import { ChevronRightIcon } from "lucide-react";

function itemShouldOpen(item: SidebarNavItem) {
	return Boolean(item.isActive || item.subItems?.some((sub) => sub.isActive));
}

function NavItem({ item }: { item: SidebarNavItem }) {
	const shouldOpen = itemShouldOpen(item);
	const [open, setOpen] = useState(shouldOpen);

	useEffect(() => {
		setOpen(shouldOpen);
	}, [shouldOpen]);

	if (!item.subItems?.length) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton isActive={item.isActive} render={<a href={item.path} />}>
					{item.icon}
					<span>{item.title}</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<Collapsible
			className="group/collapsible"
			open={open}
			onOpenChange={setOpen}
			render={<SidebarMenuItem />}
		>
			<CollapsibleTrigger render={<SidebarMenuButton isActive={item.isActive} />}>
				{item.icon}
				<span>{item.title}</span>
				<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<SidebarMenuSub>
					{item.subItems.map((subItem) => (
						<SidebarMenuSubItem key={subItem.title}>
							<SidebarMenuSubButton
								isActive={subItem.isActive}
								render={<a href={subItem.path} />}
							>
								{subItem.icon}
								<span>{subItem.title}</span>
							</SidebarMenuSubButton>
						</SidebarMenuSubItem>
					))}
				</SidebarMenuSub>
			</CollapsibleContent>
		</Collapsible>
	);
}

export function NavGroup({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => (
					<NavItem key={item.title} item={item} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
