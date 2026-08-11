import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";

type Stat = {
	label: string;
	value: string;
	delta: number;
	footnote: string;
	/** When true, a negative delta is treated as favorable. */
	lowerIsBetter: boolean;
};

/** Phase 2 recruitment CRM live metrics for the employers hero preview. */
const stats: readonly Stat[] = [
	{
		label: "Open leads",
		value: "42",
		delta: 8.2,
		footnote: "vs yesterday",
		lowerIsBetter: false,
	},
	{
		label: "Active jobs",
		value: "16",
		delta: 3.1,
		footnote: "vs last week",
		lowerIsBetter: false,
	},
	{
		label: "AI matches today",
		value: "128",
		delta: 12.4,
		footnote: "vs yesterday",
		lowerIsBetter: false,
	},
	{
		label: "Placements (30d)",
		value: "9",
		delta: 4.6,
		footnote: "vs prior 30d",
		lowerIsBetter: false,
	},
];

export function DashboardStats() {
	return (
		<>
			{stats.map((s) => (
				<Card className={cn("shadow-none dark:ring-0")} key={s.label}>
					<CardHeader>
						<CardTitle className="font-normal text-muted-foreground text-xs">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
						<div className="flex items-center gap-1 text-xs">
							<Delta value={s.delta}>
								<DeltaIcon />
								<DeltaValue />
							</Delta>
							<span className="text-muted-foreground">{s.footnote}</span>
						</div>
					</CardContent>
				</Card>
			))}
		</>
	);
}
