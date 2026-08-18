"use client";

import type { MouseEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { DashboardStats } from "@/components/stats";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLandingMetrics } from "./sections/cinematic/useLandingMetrics";
import { buildDemoDashboard } from "@/lib/employers/landingMetrics";

function DashboardSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<div
					key={i}
					className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/5"
				/>
			))}
			<div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:col-span-2 lg:col-span-3" />
			<div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5" />
			<div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:col-span-2" />
			<div className="h-64 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:col-span-2" />
		</div>
	);
}

function EmployersDashboardContent() {
	const { data, loading } = useLandingMetrics();
	const isLive = data.mode === "live";
	const dashboard = isLive
		? data.dashboard!
		: data.dashboard || buildDemoDashboard();

	if (loading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<DashboardStats dashboard={dashboard} />
			<ConversationVolumeChart data={dashboard.applicationVolume} demoFallback={!isLive} />
			<ChannelBreakdownChart
				data={dashboard.hireSources}
				delta={dashboard.hireSourcesDelta}
				demoFallback={!isLive}
			/>
			<CsatResponsesChart data={dashboard.candidateIntake} demoFallback={!isLive} />
			<FirstReplyTimeChart data={dashboard.timeToShortlist} demoFallback={!isLive} />
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
				aria-label="HRYantra Phase 2 employer CRM dashboard preview"
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
