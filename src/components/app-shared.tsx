import type { ReactNode } from "react";
import {
	LayoutGridIcon,
	TargetIcon,
	BriefcaseIcon,
	UserRoundSearchIcon,
	KanbanIcon,
	SparklesIcon,
	CalendarDaysIcon,
	UserCheckIcon,
	InboxIcon,
	WalletIcon,
	UsersIcon,
	BarChart3Icon,
	SettingsIcon,
	HelpCircleIcon,
	ActivityIcon,
	Building2Icon,
} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

/** Phase 2 employer CRM sidenav — used by the employers hero dashboard preview. */
export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{
				title: "Dashboard",
				path: "#/dashboard",
				icon: <LayoutGridIcon />,
				isActive: true,
			},
		],
	},
	{
		label: "CRM",
		items: [
			{
				title: "Leads",
				path: "#/leads",
				icon: <TargetIcon />,
			},
			{
				title: "Clients",
				path: "#/clients",
				icon: <Building2Icon />,
			},
			{
				title: "Contacts",
				path: "#/contacts",
				icon: <UsersIcon />,
			},
		],
	},
	{
		label: "Recruitment",
		items: [
			{
				title: "Jobs",
				path: "#/jobs",
				icon: <BriefcaseIcon />,
			},
			{
				title: "Candidates",
				path: "#/candidates",
				icon: <UserRoundSearchIcon />,
			},
			{
				title: "Pipeline",
				path: "#/pipeline",
				icon: <KanbanIcon />,
			},
			{
				title: "AI Matches",
				path: "#/matches",
				icon: <SparklesIcon />,
				subItems: [
					{ title: "4-pass scoring", path: "#/matches/scoring" },
					{ title: "Shortlists", path: "#/matches/shortlists" },
					{ title: "Bulk actions", path: "#/matches/bulk" },
				],
			},
			{
				title: "Interviews",
				path: "#/interviews",
				icon: <CalendarDaysIcon />,
			},
			{
				title: "Placements",
				path: "#/placements",
				icon: <UserCheckIcon />,
			},
		],
	},
	{
		label: "Operations",
		items: [
			{
				title: "Inbox",
				path: "#/inbox",
				icon: <InboxIcon />,
			},
			{
				title: "Reports",
				path: "#/reports",
				icon: <BarChart3Icon />,
			},
			{
				title: "Billing",
				path: "#/billing",
				icon: <WalletIcon />,
			},
			{
				title: "Team & RBAC",
				icon: <SettingsIcon />,
				subItems: [
					{ title: "Members", path: "#/team/members" },
					{ title: "Roles", path: "#/team/roles" },
					{ title: "Departments", path: "#/team/departments" },
					{ title: "AI Coins", path: "#/settings/ai-coins" },
					{ title: "Org settings", path: "#/settings" },
				],
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help Center",
		path: "#/help",
		icon: <HelpCircleIcon />,
	},
	{
		title: "Behaviour Engine",
		path: "#/thebehave",
		icon: <ActivityIcon />,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item],
		),
	),
	...footerNavLinks,
];
