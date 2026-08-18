"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { LabelList, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import {
	buildDemoDashboard,
	type HireSourceRow,
} from "@/lib/employers/landingMetrics";

type ChannelKey = "portal" | "referral" | "linkedin";

type ChannelDatum = {
	channel: ChannelKey;
	share: number;
	fill: string;
};

function toChartData(rows: HireSourceRow[] | undefined, demoFallback: boolean): ChannelDatum[] {
	const source = rows ?? (demoFallback ? buildDemoDashboard().hireSources : []);
	return source.map((row) => ({
		channel: row.channel,
		share: row.share,
		fill: `var(--color-${row.channel})`,
	}));
}

const chartConfig = {
	share: {
		label: "Share",
	},
	portal: {
		label: "Portal apply",
		color: "var(--chart-1)",
	},
	referral: {
		label: "Referral",
		color: "var(--chart-3)",
	},
	linkedin: {
		label: "LinkedIn",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

export function ChannelBreakdownChart({
	className,
	data,
	delta = 2.4,
	demoFallback = true,
	...props
}: ComponentProps<typeof Card> & {
	data?: HireSourceRow[];
	delta?: number;
	demoFallback?: boolean;
}) {
	const chartData = toChartData(data, demoFallback);
	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="items-center space-y-1 pb-0 sm:items-start">
				<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
					<CardTitle>Hire sources</CardTitle>
					<Delta value={delta} variant="badge">
						<DeltaIcon variant="trend" />
						<DeltaValue suffix="pp" />
					</Delta>
				</div>
				<CardDescription>
					Share of new candidates in last 7 days
				</CardDescription>
			</CardHeader>
			<CardContent className="my-auto">
				<ChartContainer
					className="mx-auto aspect-square max-h-72 w-full"
					config={chartConfig}
				>
					<PieChart accessibilityLayer>
						<Pie
							cornerRadius={8}
							data={chartData}
							dataKey="share"
							innerRadius={36}
							nameKey="channel"
							outerRadius="88%"
							stroke="var(--card)"
							strokeWidth={4}
						>
							<LabelList
								className="fill-background font-medium"
								dataKey="share"
								fill="currentColor"
								fontWeight={500}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n) ? `${n}%` : String(label ?? "");
								}}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend content={<ChartLegendContent nameKey="channel" />} />
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
