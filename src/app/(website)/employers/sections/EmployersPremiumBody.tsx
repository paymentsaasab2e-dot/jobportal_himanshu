'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  Coins,
  Search,
  Sparkles,
  Target,
  UserRoundSearch,
  Workflow,
} from 'lucide-react';
import {
  DEMO_LANDING_METRICS,
  formatCompact,
  type EmployerLandingMetrics,
} from '@/lib/employers/landingMetrics';
import {
  automationNodes,
  brainNodes,
  featuresByCategory,
  phase2Categories,
  productModes,
} from '../employersPhase2Features';
import { AppLocale, localizePath } from '@/lib/i18n';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';
import {
  GridBackdrop,
  SectionEyebrow,
  SectionHeading,
  SectionLead,
  SectionShell,
  usePrefersReducedMotion,
} from './_shared';

function useLandingMetrics() {
  const [data, setData] = useState<EmployerLandingMetrics>(DEMO_LANDING_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/employers/landing-metrics', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.data?.metrics) setData(json.data as EmployerLandingMetrics);
      } catch {
        /* keep demo */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

function MetricSkeleton() {
  return <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" />;
}

function LiveBadge({ mode }: { mode: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {mode === 'live' ? 'Live aggregates' : 'Product demo data'}
    </span>
  );
}

/** Full-width live stats */
function LivePlatformStats({ data, loading }: { data: EmployerLandingMetrics; loading: boolean }) {
  const items = [
    { label: 'Active Jobs', value: data.metrics.activeJobs },
    { label: 'Candidates', value: data.metrics.totalCandidates },
    { label: 'Clients', value: data.metrics.totalClients },
    { label: 'Interviews', value: data.metrics.totalInterviews },
    { label: 'Placements', value: data.metrics.totalPlacements },
    { label: 'AI Matches', value: data.metrics.aiMatches },
  ];

  return (
    <SectionShell id="live-stats" dark className="bg-slate-950 py-14 md:py-16">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionEyebrow light>Live Platform</SectionEyebrow>
            <SectionHeading
              light
              className="!text-3xl md:!text-4xl"
              lines={[{ text: 'The Recruitment Engine Behind Your Business' }]}
            />
          </div>
          <LiveBadge mode={data.mode} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur"
            >
              {loading ? (
                <MetricSkeleton />
              ) : (
                <p className="text-2xl font-black tabular-nums text-white md:text-3xl">
                  {formatCompact(item.value)}
                </p>
              )}
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function CrmInteractivePipeline({ data }: { data: EmployerLandingMetrics }) {
  const stages = [
    { key: 'NEW', label: 'New' },
    { key: 'CONTACTED', label: 'Contacted' },
    { key: 'QUALIFIED', label: 'Qualified' },
    { key: 'MEETING', label: 'Meeting' },
    { key: 'PROPOSAL', label: 'Proposal' },
    { key: 'CLIENT', label: 'Client' },
  ] as const;
  const [active, setActive] = useState<(typeof stages)[number]['key']>('NEW');
  const feed = data.activityFeed.slice(0, 5);

  return (
    <SectionShell id="crm" className="bg-[#F4F7FB]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <SectionEyebrow>CRM & Revenue</SectionEyebrow>
            <SectionHeading lines={[{ text: 'Every Lead Has a Next Move.' }]} />
            <SectionLead>
              An interactive revenue pipeline — from capture to client — with stage counts from safe
              platform aggregates.
            </SectionLead>

            <div className="mt-8 flex flex-col gap-2">
              {stages.map((stage, index) => {
                const count = data.leadStages[stage.key] || 0;
                const isActive = active === stage.key;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setActive(stage.key)}
                    className={`group flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition ${
                      isActive
                        ? 'border-orange-300 bg-orange-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{stage.label}</span>
                    </div>
                    <span className="text-xl font-black tabular-nums text-slate-900">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">
                Live CRM activity
              </p>
              <LiveBadge mode={data.mode} />
            </div>
            <div className="space-y-3">
              {feed.map((item) => (
                <div
                  key={item.time + item.text}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-[10px] font-mono text-slate-500">{item.time}</p>
                    <p className="text-sm text-slate-200">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Activity labels are anonymized. No lead, client, or candidate identities are shown.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function RecruitmentCommandCenter({ data }: { data: EmployerLandingMetrics }) {
  const matches = [
    { id: '#1042', score: 96 },
    { id: '#1088', score: 92 },
    { id: '#1114', score: 89 },
    { id: '#1201', score: 84 },
  ];

  return (
    <SectionShell id="recruitment" dark className="bg-[#070B14]">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Recruitment Engine</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'From Job Creation to Placement.' }]} />
          <SectionLead light>
            One command center for jobs, anonymized candidates, and multi-pass AI matching.
          </SectionLead>
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              Recruitment command center
            </p>
            <LiveBadge mode={data.mode} />
          </div>

          <div className="grid gap-0 lg:grid-cols-3">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2 text-slate-300">
                <Briefcase className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wide">Jobs</span>
              </div>
              <p className="text-3xl font-black text-white">{formatCompact(data.metrics.activeJobs)}</p>
              <p className="mt-1 text-sm text-slate-400">Active openings</p>
              <div className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                <p className="text-sm font-bold text-sky-100">Java Developer</p>
                <p className="mt-1 text-xs text-sky-200/80">Mumbai · 5+ yrs · Spring Boot</p>
              </div>
            </div>

            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2 text-slate-300">
                <UserRoundSearch className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wide">Candidates</span>
              </div>
              <p className="text-3xl font-black text-white">
                {formatCompact(data.metrics.totalCandidates)}
              </p>
              <p className="mt-1 text-sm text-slate-400">Profiles in workspace</p>
              <div className="mt-5 space-y-2">
                {matches.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-300">Candidate {m.id}</span>
                    <span className="font-bold text-emerald-300">{m.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-300">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wide">AI Match</span>
              </div>
              <p className="text-3xl font-black text-white">{formatCompact(data.metrics.aiMatches)}</p>
              <p className="mt-1 text-sm text-slate-400">Match events</p>
              <div className="mt-5 space-y-3">
                {matches.map((m) => (
                  <div key={m.id}>
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>{m.id}</span>
                      <span>{m.score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(data.funnel).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white/5 px-3 py-3 text-center">
                <p className="text-lg font-black text-white">{formatCompact(value)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {key}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function AiBrainCinematic({ data }: { data: EmployerLandingMetrics }) {
  const [node, setNode] = useState('Candidates');
  const panels: Record<string, { title: string; rows: Array<{ label: string; value: string }> }> = {
    Candidates: {
      title: 'Candidate Intelligence',
      rows: [
        { label: 'Profiles analyzed', value: formatCompact(data.metrics.totalCandidates) },
        { label: 'AI matches', value: formatCompact(data.metrics.aiMatches) },
        { label: 'Applications', value: formatCompact(data.metrics.applications) },
      ],
    },
    Jobs: {
      title: 'Job Intelligence',
      rows: [
        { label: 'Active jobs', value: formatCompact(data.metrics.activeJobs) },
        { label: 'Total jobs', value: formatCompact(data.metrics.totalJobs) },
        { label: 'Candidates matched', value: formatCompact(data.metrics.aiMatches) },
      ],
    },
    Leads: {
      title: 'Lead Intelligence',
      rows: [
        { label: 'Active leads', value: formatCompact(data.metrics.activeLeads) },
        { label: 'Clients', value: formatCompact(data.metrics.totalClients) },
        { label: 'Open tasks', value: formatCompact(data.metrics.openTasks) },
      ],
    },
    Interviews: {
      title: 'Interview Intelligence',
      rows: [
        { label: 'Total interviews', value: formatCompact(data.metrics.totalInterviews) },
        { label: 'Scheduled', value: formatCompact(data.metrics.interviewsScheduled) },
        { label: 'Placements', value: formatCompact(data.metrics.totalPlacements) },
      ],
    },
  };
  const panel = panels[node] || panels.Candidates;

  return (
    <SectionShell id="brain" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>HRYantra Brain</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'Meet the Intelligence Behind HRYantra.' }]} />
          <SectionLead light>
            Click a node to inspect anonymized intelligence panels powered by safe aggregates.
          </SectionLead>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto flex min-h-[380px] w-full max-w-xl items-center justify-center">
            <div className="absolute inset-[16%] rounded-full border border-indigo-400/20" />
            <div className="absolute z-20 flex h-40 w-40 flex-col items-center justify-center rounded-full border border-indigo-300/40 bg-indigo-500/20 text-center shadow-[0_0_80px_rgba(99,102,241,0.4)] backdrop-blur">
              <Bot className="mb-2 h-8 w-8 text-indigo-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                HRYantra
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200">
                Brain
              </span>
            </div>
            {brainNodes.map((label, index) => {
              const angle = (index / brainNodes.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 40;
              const y = 50 + Math.sin(angle) * 40;
              const key = label;
              const isActive = node === key || (key === 'Candidates' && !panels[node]);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNode(panels[label] ? label : 'Candidates')}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur transition ${
                    isActive
                      ? 'border-indigo-300 bg-indigo-400/30 text-white'
                      : 'border-white/15 bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-6 backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
              {panel.title}
            </p>
            <div className="mt-5 space-y-3">
              {panel.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <span className="text-xl font-black text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function SmartSearchConsole({ data }: { data: EmployerLandingMetrics }) {
  const [query, setQuery] = useState('Find senior Java developers in Mumbai available this week');
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setStep(3);
      return;
    }
    const t = window.setInterval(() => setStep((s) => (s >= 3 ? 0 : s + 1)), 1800);
    return () => window.clearInterval(t);
  }, [reduced]);

  return (
    <SectionShell id="smart-search" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>Smart Search</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Ask Your Recruitment Data Anything.' }]} />
          <SectionLead>
            Natural language becomes structured filters — then anonymized match counts.
          </SectionLead>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl md:p-8">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-5 w-5 text-sky-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 md:text-base"
              aria-label="Smart search demo"
            />
          </div>

          <AnimatePresence mode="wait">
            {step >= 1 ? (
              <motion.div
                key="parse"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300">
                  Interpreting query
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Experience: Senior', 'Skill: Java', 'Location: Mumbai', 'Availability: This Week'].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold"
                      >
                        {chip}
                      </span>
                    ),
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {step >= 2 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">AI found</p>
                <p className="mt-1 text-3xl font-black text-white">24 matching profiles</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Workspace candidates</p>
                <p className="mt-1 text-3xl font-black text-emerald-300">
                  {formatCompact(data.metrics.totalCandidates)}
                </p>
              </div>
            </div>
          ) : null}

          {step >= 3 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {['#1042 · 96%', '#1088 · 92%', '#1114 · 89%'].map((row) => (
                <div
                  key={row}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-sm text-slate-200"
                >
                  Candidate {row}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}

function OperationsCommand({ data }: { data: EmployerLandingMetrics }) {
  const today = [
    { label: 'Tasks', value: data.metrics.openTasks },
    { label: 'Interviews', value: data.metrics.interviewsScheduled },
    { label: 'Leads', value: data.metrics.activeLeads },
    { label: 'Jobs', value: data.metrics.activeJobs },
    { label: 'Placements', value: data.metrics.totalPlacements },
    { label: 'Recruiters', value: data.metrics.activeRecruiters },
  ];

  return (
    <SectionShell id="operations" className="bg-[#F7FAFC]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Operations Hub</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Know What Is Happening Before Someone Tells You.' }]} />
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300">Today</p>
            <LiveBadge mode={data.mode} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {today.map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center">
                <p className="text-2xl font-black tabular-nums">{formatCompact(row.value)}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {row.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Recruitment funnel
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(data.funnel).map(([key, value], index, arr) => (
                <React.Fragment key={key}>
                  <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-center">
                    <p className="text-lg font-black">{formatCompact(value)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-violet-200">{key}</p>
                  </div>
                  {index < arr.length - 1 ? <span className="text-slate-600">→</span> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function AutomationGraph() {
  const reduced = usePrefersReducedMotion();
  return (
    <SectionShell id="automation" dark className="bg-[#070B14]">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Automation</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'Let Your Workflow Run Itself.' }]} />
        </div>
        <div className="mt-10 overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-max flex-col gap-3 md:min-w-0 md:grid md:grid-cols-4 lg:grid-cols-6">
            {automationNodes.map((node, index) => (
              <motion.div
                key={node}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-3 py-4 text-center"
              >
                <Workflow className="mx-auto mb-2 h-4 w-4 text-amber-200" />
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-50">{node}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function AiCoinsWallet() {
  const bars = [
    { label: 'CV Parsing', pct: 78 },
    { label: 'AI Matching', pct: 62 },
    { label: 'Document AI', pct: 44 },
    { label: 'Job Creation', pct: 36 },
  ];
  return (
    <SectionShell id="ai-coins" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionEyebrow>AI Coins</SectionEyebrow>
            <SectionHeading lines={[{ text: 'AI That Scales With Your Business.' }]} />
            <SectionLead>
              Metered AI usage with a tenant wallet. Demo usage bars — live wallet balances stay
              private to authenticated tenants.
            </SectionLead>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">
                  AI Wallet
                </p>
                <p className="mt-2 text-4xl font-black">12,450</p>
                <p className="text-sm text-slate-400">AI Coins (demo)</p>
              </div>
              <Coins className="h-10 w-10 text-indigo-300" />
            </div>
            <div className="mt-8 space-y-4">
              {bars.map((bar) => (
                <div key={bar.label}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{bar.label}</span>
                    <span>{bar.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.pct}%` }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function ProductModesInteractive() {
  const [mode, setMode] = useState<'agency' | 'standalone'>('agency');
  const active = productModes[mode];
  return (
    <SectionShell id="modes" className="bg-[#F4F7FB]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>Product Modes</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Built for Every Recruitment Business Model.' }]} />
        </div>
        <div className="mx-auto mt-8 flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(['agency', 'standalone'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                mode === key ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              {productModes[key].title}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h3 className="text-2xl font-black text-slate-900">{active.title}</h3>
            <p className="mt-2 text-slate-600">{active.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {active.points.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  {point}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}

function PremiumFeatureExplorer() {
  const [active, setActive] = useState(phase2Categories[0].id);
  const features = useMemo(() => featuresByCategory(active), [active]);
  const selected = features[0];
  const [featureId, setFeatureId] = useState(selected?.id || '');
  const detail = features.find((f) => f.id === featureId) || selected;

  useEffect(() => {
    setFeatureId(features[0]?.id || '');
  }, [active, features]);

  return (
    <SectionShell id="features" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Feature Explorer</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'Explore the Full Phase 2 Workspace.' }]} />
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.7fr_1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            {phase2Categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActive(cat.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active === cat.id ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300">
              Capabilities
            </p>
            <div className="mt-4 grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {features.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeatureId(f.id)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    featureId === f.id
                      ? 'border-sky-400/40 bg-sky-400/15 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {f.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 p-6">
            <Target className="mb-4 h-6 w-6 text-sky-300" />
            <h3 className="text-xl font-black text-white">{detail?.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{detail?.description}</p>
            {detail?.highlight ? (
              <span className="mt-4 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                Core capability
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function LiveActivityStream({ data }: { data: EmployerLandingMetrics }) {
  return (
    <SectionShell id="live" className="bg-white">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <SectionHeading className="!text-3xl" lines={[{ text: 'HRYantra Live' }]} />
          <LiveBadge mode={data.mode} />
        </div>
        <div className="space-y-3">
          {data.activityFeed.map((item) => (
            <div
              key={item.time + item.text}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span className="font-mono text-xs text-slate-400">{item.time}</span>
              <p className="text-sm font-medium text-slate-800">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function FinalCta() {
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  return (
    <SectionShell id="cta" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
        <SectionEyebrow light>Get Started</SectionEyebrow>
        <SectionHeading
          light
          lines={[
            { text: "HRYantra doesn't just store your recruitment data." },
            { text: 'It understands it, connects it, and acts on it.' },
          ]}
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={trialHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#28A8E1] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_40px_rgba(40,168,225,0.4)]"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white"
          >
            Explore Platform
          </a>
          <Link href={demoHref} className="inline-flex px-5 py-3 text-sm font-semibold text-slate-300">
            Talk to Our Team
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersPremiumBody() {
  const { data, loading } = useLandingMetrics();

  return (
    <>
      <LivePlatformStats data={data} loading={loading} />
      <CrmInteractivePipeline data={data} />
      <RecruitmentCommandCenter data={data} />
      <AiBrainCinematic data={data} />
      <SmartSearchConsole data={data} />
      <OperationsCommand data={data} />
      <AutomationGraph />
      <AiCoinsWallet />
      <ProductModesInteractive />
      <PremiumFeatureExplorer />
      <LiveActivityStream data={data} />
      <FinalCta />
    </>
  );
}
