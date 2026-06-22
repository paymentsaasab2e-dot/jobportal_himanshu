"use client";

import type { MouseEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { DashboardStats } from "@/components/stats";
import { TooltipProvider } from "@/components/ui/tooltip";

function EmployersDashboardContent() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<DashboardStats />
			<ConversationVolumeChart />
			<ChannelBreakdownChart />
			<CsatResponsesChart />
			<FirstReplyTimeChart />
		</div>
	);
}

function preventDemoNavigation(event: MouseEvent<HTMLElement>) {
	const anchor = (event.target as HTMLElement).closest("a");
	if (anchor) {
		event.preventDefault();
	}
}

export function EmployersDashboardPreview() {
	return (
		<TooltipProvider delay={300}>
			<div
				aria-label="Interactive employer dashboard preview"
				className="employers-dashboard-preview dark relative z-20 mx-auto w-full max-w-[min(100%,1280px)] px-3 sm:px-5"
				onClickCapture={preventDemoNavigation}
				role="region"
			>
				<div className="employers-dashboard-preview__frame overflow-visible rounded-xl border border-white/10 bg-background shadow-2xl ring-1 ring-white/5">
					<AppShell preview className="h-auto min-h-0">
						<EmployersDashboardContent />
					</AppShell>
				</div>
			</div>
		</TooltipProvider>
	);
}
