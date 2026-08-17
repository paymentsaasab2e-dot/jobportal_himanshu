import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import {
	buildDemoDashboard,
	type EmployerLandingDashboard,
} from "@/lib/employers/landingMetrics";

type Stat = {
	label: string;
	value: string;
	delta: number;
	footnote: string;
	lowerIsBetter: boolean;
};

function statsFromDashboard(dashboard: EmployerLandingDashboard): Stat[] {
	const { openLeads, activeJobs, aiMatchesToday, placements30d } = dashboard.kpis;
	return [
		{
			label: "Open leads",
			value: String(openLeads.value),
			delta: openLeads.delta,
			footnote: openLeads.footnote,
			lowerIsBetter: false,
		},
		{
			label: "Active jobs",
			value: String(activeJobs.value),
			delta: activeJobs.delta,
			footnote: activeJobs.footnote,
			lowerIsBetter: false,
		},
		{
			label: "AI matches today",
			value: String(aiMatchesToday.value),
			delta: aiMatchesToday.delta,
			footnote: aiMatchesToday.footnote,
			lowerIsBetter: false,
		},
		{
			label: "Placements (30d)",
			value: String(placements30d.value),
			delta: placements30d.delta,
			footnote: placements30d.footnote,
			lowerIsBetter: false,
		},
	];
}

export function DashboardStats({
	dashboard,
}: {
	dashboard?: EmployerLandingDashboard;
}) {
	const stats = statsFromDashboard(dashboard || buildDemoDashboard());

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
