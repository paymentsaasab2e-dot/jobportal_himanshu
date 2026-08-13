"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";
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
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
	{ day: "Apr 8", portal: 11, referral: 9, linkedin: 4 },
	{ day: "Apr 9", portal: 15, referral: 11, linkedin: 5 },
	{ day: "Apr 10", portal: 13, referral: 10, linkedin: 5 },
	{ day: "Apr 11", portal: 16, referral: 12, linkedin: 5 },
	{ day: "Apr 12", portal: 12, referral: 10, linkedin: 5 },
	{ day: "Apr 13", portal: 14, referral: 10, linkedin: 6 },
	{ day: "Apr 14", portal: 11, referral: 9, linkedin: 5 },
	{ day: "Apr 15", portal: 16, referral: 7, linkedin: 4 },
	{ day: "Apr 16", portal: 13, referral: 11, linkedin: 5 },
	{ day: "Apr 17", portal: 15, referral: 11, linkedin: 6 },
] as const;

const chartConfig = {
	portal: {
		label: "Portal",
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

/** Half of bar width (8) so ends read as fully rounded “caps”. */
const BAR_RADIUS = 5;

/**
 *  column hover background.
 */
function ColumnHoverCursor(props: React.ComponentProps<typeof Rectangle>) {
	return (
		<Rectangle
			fill="var(--muted)"
			fillOpacity={0.5}
			radius={BAR_RADIUS * 2}
			stroke="none"
			{...props}
		/>
	);
}

export function CsatResponsesChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle>Candidate intake</CardTitle>
				<CardDescription>
					New candidates per day by source, last 10 days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-video w-full" config={chartConfig}>
					<BarChart accessibilityLayer data={[...chartData]}>
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							minTickGap={8}
							tickFormatter={(value) => String(value)}
							tickLine={false}
							tickMargin={10}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={<ColumnHoverCursor />}
						/>
						<Bar
							background={{
								fill: "var(--muted)",
								radius: BAR_RADIUS,
							}}
							barSize={8}
							dataKey="linkedin"
							fill="var(--color-linkedin)"
							overflow="visible"
							radius={[0, 0, BAR_RADIUS, BAR_RADIUS]}
							stackId="intake"
						/>
						<Bar
							barSize={8}
							dataKey="referral"
							fill="var(--color-referral)"
							overflow="visible"
							radius={0}
							stackId="intake"
						/>
						<Bar
							barSize={8}
							dataKey="portal"
							fill="var(--color-portal)"
							overflow="visible"
							radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
							stackId="intake"
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
