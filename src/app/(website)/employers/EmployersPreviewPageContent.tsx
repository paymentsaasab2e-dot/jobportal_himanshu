"use client";

import React from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Inbox,
  Kanban,
  Sparkles,
  Target,
  UserCheck,
  UserRoundSearch,
  Users,
  Wallet,
} from "lucide-react";
import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { DashboardStats } from "@/components/stats";
import {
  formatCompact,
  type EmployerLandingMetrics,
} from "@/lib/employers/landingMetrics";
import type { EmployersPreviewPageId } from "./EmployersPreviewTourContext";

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#28A8E1]/15 bg-white p-4 shadow-[0_8px_24px_rgba(8,66,140,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F7FD] text-[#08428c]">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-bold tracking-tight text-[#0F172A]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function StageRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-slate-100 bg-[#F8FBFE] px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-[#08428c]">{formatCompact(count)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-linear-to-r from-[#08428c] to-[#28A8E1]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ModuleShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ActivityList({ items }: { items: EmployerLandingMetrics["activityFeed"] }) {
  return (
    <div className="rounded-2xl border border-[#28A8E1]/15 bg-white p-4 shadow-[0_8px_24px_rgba(8,66,140,0.05)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Live activity
      </p>
      <ul className="space-y-2.5">
        {(items.length ? items : [{ time: "—", text: "Waiting for platform activity…" }]).map(
          (item, index) => (
            <li
              key={`${item.time}-${index}`}
              className="flex items-start gap-3 rounded-xl bg-[#F8FBFE] px-3 py-2.5"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-[#E8F7FD] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0F5A7A]">
                {item.time}
              </span>
              <span className="text-sm text-slate-700">{item.text}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function EmployersPreviewPageContent({
  pageId,
  metrics,
  isLive,
}: {
  pageId: EmployersPreviewPageId;
  metrics: EmployerLandingMetrics;
  isLive: boolean;
}) {
  const { dashboard, funnel, leadStages, metrics: m, activityFeed, tenantCount, mode } =
    metrics;
  const stageEntries = Object.entries(leadStages) as Array<[keyof typeof leadStages, number]>;
  const stageMax = Math.max(1, ...stageEntries.map(([, value]) => value));
  const sourceNote = isLive
    ? `Live Phase 2 aggregates${tenantCount ? ` · ${formatCompact(tenantCount)} tenants` : ""}`
    : "Platform demo series — connects to live aggregates when available";

  if (pageId === "dashboard") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#0F5A7A]">{sourceNote}</p>
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
      </div>
    );
  }

  if (pageId === "leads") {
    return (
      <ModuleShell
        title="Leads workspace"
        subtitle={`${sourceNote} · ${formatCompact(m.activeLeads)} open leads`}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {stageEntries.map(([stage, count]) => (
            <MetricCard
              key={stage}
              label={stage}
              value={formatCompact(count)}
              hint="Stage count"
              icon={<Target className="h-4 w-4" />}
            />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            {stageEntries.map(([stage, count]) => (
              <StageRow key={stage} label={stage} count={count} max={stageMax} />
            ))}
          </div>
          <ActivityList items={activityFeed.slice(0, 5)} />
        </div>
      </ModuleShell>
    );
  }

  if (pageId === "clients") {
    return (
      <ModuleShell title="Client CRM" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Clients"
            value={formatCompact(m.totalClients)}
            hint="Active accounts"
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            label="From leads"
            value={formatCompact(funnel.leads)}
            hint="Lead pipeline"
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            label="Open jobs"
            value={formatCompact(m.activeJobs)}
            hint="Across clients"
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard
            label="Placements"
            value={formatCompact(m.totalPlacements)}
            hint="Tracked joins"
            icon={<UserCheck className="h-4 w-4" />}
          />
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "contacts") {
    return (
      <ModuleShell title="Contacts" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Client accounts"
            value={formatCompact(m.totalClients)}
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            label="Recruiters"
            value={formatCompact(m.activeRecruiters)}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            label="Meetings stage"
            value={formatCompact(leadStages.MEETING)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <MetricCard
            label="Proposal stage"
            value={formatCompact(leadStages.PROPOSAL)}
            icon={<Target className="h-4 w-4" />}
          />
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "jobs") {
    return (
      <ModuleShell title="Jobs" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Active jobs"
            value={formatCompact(m.activeJobs)}
            hint="Open requisitions"
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard
            label="Total jobs"
            value={formatCompact(m.totalJobs)}
            hint="All time tracked"
            icon={<Kanban className="h-4 w-4" />}
          />
          <MetricCard
            label="Applications"
            value={formatCompact(m.applications)}
            hint="Candidate applies"
            icon={<UserRoundSearch className="h-4 w-4" />}
          />
          <MetricCard
            label="AI matches"
            value={formatCompact(m.aiMatches)}
            hint="Across roles"
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ConversationVolumeChart data={dashboard.applicationVolume} demoFallback={!isLive} />
          </div>
          <ChannelBreakdownChart
            data={dashboard.hireSources}
            delta={dashboard.hireSourcesDelta}
            demoFallback={!isLive}
          />
        </div>
      </ModuleShell>
    );
  }

  if (pageId === "candidates") {
    return (
      <ModuleShell title="Candidates" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Candidates"
            value={formatCompact(m.totalCandidates)}
            icon={<UserRoundSearch className="h-4 w-4" />}
          />
          <MetricCard
            label="Applications"
            value={formatCompact(m.applications)}
            icon={<Inbox className="h-4 w-4" />}
          />
          <MetricCard
            label="In funnel"
            value={formatCompact(funnel.candidates)}
            icon={<Kanban className="h-4 w-4" />}
          />
          <MetricCard
            label="AI matches"
            value={formatCompact(m.aiMatches)}
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>
        <CsatResponsesChart data={dashboard.candidateIntake} demoFallback={!isLive} />
      </ModuleShell>
    );
  }

  if (pageId === "pipeline") {
    const steps = [
      { label: "Leads", value: funnel.leads },
      { label: "Clients", value: funnel.clients },
      { label: "Jobs", value: funnel.jobs },
      { label: "Candidates", value: funnel.candidates },
      { label: "Interviews", value: funnel.interviews },
      { label: "Placements", value: funnel.placements },
    ];
    const max = Math.max(1, ...steps.map((step) => step.value));
    return (
      <ModuleShell title="Recruitment pipeline" subtitle={sourceNote}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <StageRow key={step.label} label={step.label} count={step.value} max={max} />
          ))}
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "matches") {
    return (
      <ModuleShell title="AI Matches" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="AI matches"
            value={formatCompact(m.aiMatches)}
            hint="4-pass scoring"
            icon={<Sparkles className="h-4 w-4" />}
          />
          <MetricCard
            label="Today"
            value={formatCompact(dashboard.kpis.aiMatchesToday.value)}
            hint={dashboard.kpis.aiMatchesToday.footnote}
            icon={<Sparkles className="h-4 w-4" />}
          />
          <MetricCard
            label="Active jobs"
            value={formatCompact(m.activeJobs)}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard
            label="Avg shortlist"
            value={`${(
              dashboard.timeToShortlist.reduce((sum, row) => sum + row.minutes, 0) /
              Math.max(1, dashboard.timeToShortlist.length)
            ).toFixed(1)}m`}
            hint="Minutes to AI shortlist"
            icon={<Kanban className="h-4 w-4" />}
          />
        </div>
        <FirstReplyTimeChart data={dashboard.timeToShortlist} demoFallback={!isLive} />
      </ModuleShell>
    );
  }

  if (pageId === "interviews") {
    return (
      <ModuleShell title="Interviews" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Scheduled"
            value={formatCompact(m.interviewsScheduled)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <MetricCard
            label="Total interviews"
            value={formatCompact(m.totalInterviews)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <MetricCard
            label="Candidates"
            value={formatCompact(m.totalCandidates)}
            icon={<UserRoundSearch className="h-4 w-4" />}
          />
          <MetricCard
            label="Open tasks"
            value={formatCompact(m.openTasks)}
            icon={<Inbox className="h-4 w-4" />}
          />
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "placements") {
    return (
      <ModuleShell title="Placements" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Placements"
            value={formatCompact(m.totalPlacements)}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <MetricCard
            label="Last 30 days"
            value={formatCompact(dashboard.kpis.placements30d.value)}
            hint={dashboard.kpis.placements30d.footnote}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <MetricCard
            label="Active jobs"
            value={formatCompact(m.activeJobs)}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard
            label="Clients"
            value={formatCompact(m.totalClients)}
            icon={<Building2 className="h-4 w-4" />}
          />
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "inbox") {
    return (
      <ModuleShell title="Inbox & tasks" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricCard
            label="Open tasks"
            value={formatCompact(m.openTasks)}
            icon={<Inbox className="h-4 w-4" />}
          />
          <MetricCard
            label="Interviews due"
            value={formatCompact(m.interviewsScheduled)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <MetricCard
            label="Mode"
            value={mode === "live" ? "Live" : "Demo"}
            hint={sourceNote}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>
        <ActivityList items={activityFeed} />
      </ModuleShell>
    );
  }

  if (pageId === "reports") {
    return (
      <ModuleShell title="Reports" subtitle={sourceNote}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Leads" value={formatCompact(funnel.leads)} icon={<Target className="h-4 w-4" />} />
          <MetricCard label="Jobs" value={formatCompact(funnel.jobs)} icon={<Briefcase className="h-4 w-4" />} />
          <MetricCard
            label="Candidates"
            value={formatCompact(funnel.candidates)}
            icon={<UserRoundSearch className="h-4 w-4" />}
          />
          <MetricCard
            label="Placements"
            value={formatCompact(funnel.placements)}
            icon={<UserCheck className="h-4 w-4" />}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ConversationVolumeChart data={dashboard.applicationVolume} demoFallback={!isLive} />
          </div>
          <ChannelBreakdownChart
            data={dashboard.hireSources}
            delta={dashboard.hireSourcesDelta}
            demoFallback={!isLive}
          />
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Billing" subtitle={sourceNote}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Placements billed"
          value={formatCompact(m.totalPlacements)}
          hint="Join events tracked"
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Active clients"
          value={formatCompact(m.totalClients)}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Recruiters"
          value={formatCompact(m.activeRecruiters)}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Open tasks"
          value={formatCompact(m.openTasks)}
          icon={<Inbox className="h-4 w-4" />}
        />
      </div>
      <ActivityList items={activityFeed} />
    </ModuleShell>
  );
}
