'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { formatCompact, type EmployerLandingMetrics } from '@/lib/employers/landingMetrics';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';
import { AppLocale, localizePath } from '@/lib/i18n';
import {
  AmbientGrid,
  DemoOrLive,
  FadeIn,
  LightBlobs,
  LivePulse,
  SectionEyebrow,
  SoftGlow,
} from './CinematicShared';
import { AUTO_NODES, FEATURE_CATS } from './CinematicBodyA';

const SEARCH_PHRASE = 'Find senior Java developers in Mumbai';
const FUTURE_WORDS = ['SEARCH', 'MATCH', 'UNDERSTAND', 'PREDICT', 'ACT'] as const;

const NODE_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-violet-50 border-violet-200 text-violet-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
  'bg-teal-50 border-teal-200 text-teal-800',
];

function SmartSearchSection() {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'type' | 'parse' | 'results'>('type');

  useEffect(() => {
    let cancelled = false;
    let typeId: ReturnType<typeof setInterval> | undefined;
    let parseTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleTimer: ReturnType<typeof setTimeout> | undefined;

    const runCycle = () => {
      if (cancelled) return;
      setTyped('');
      setPhase('type');
      let i = 0;
      typeId = setInterval(() => {
        if (cancelled) return;
        i += 1;
        setTyped(SEARCH_PHRASE.slice(0, i));
        if (i >= SEARCH_PHRASE.length) {
          if (typeId) clearInterval(typeId);
          setPhase('parse');
          parseTimer = setTimeout(() => {
            if (cancelled) return;
            setPhase('results');
            cycleTimer = setTimeout(runCycle, 4200);
          }, 1200);
        }
      }, 40);
    };

    runCycle();
    return () => {
      cancelled = true;
      if (typeId) clearInterval(typeId);
      if (parseTimer) clearTimeout(parseTimer);
      if (cycleTimer) clearTimeout(cycleTimer);
    };
  }, []);

  const chips = [
    { label: 'Senior', color: 'bg-blue-100 text-blue-700' },
    { label: 'Java', color: 'bg-violet-100 text-violet-700' },
    { label: 'Mumbai', color: 'bg-cyan-100 text-cyan-700' },
    { label: 'Spring Boot', color: 'bg-pink-100 text-pink-700' },
    { label: 'Available this week', color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#ECFEFF] py-24 md:py-32">
      <AmbientGrid />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <FadeIn>
          <SectionEyebrow>Smart Search</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Ask HRYantra anything.
          </h2>
        </FadeIn>

        <div className="relative mx-auto mt-12 rounded-[1.75rem] border border-white bg-white p-2 shadow-[0_24px_60px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3 rounded-[1.35rem] bg-slate-50 px-5 py-4 text-left">
            <span className="text-cyan-500">◈</span>
            <p className="min-h-[1.5rem] flex-1 font-mono text-sm text-slate-800 md:text-base">
              {typed || <span className="text-slate-400">Ask HRYantra anything...</span>}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-linear-to-b from-blue-500 to-violet-500 align-middle" />
            </p>
          </div>
        </div>

        <div className="mt-10 min-h-[180px]">
          <AnimatePresence mode="wait">
            {phase === 'parse' && (
              <motion.div
                key="parse"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap justify-center gap-2"
              >
                {chips.map((c) => (
                  <span
                    key={c.label}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${c.color}`}
                  >
                    {c.label}
                  </span>
                ))}
              </motion.div>
            )}
            {phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative mx-auto h-40 max-w-2xl"
              >
                <p className="mb-6 text-sm font-medium text-emerald-600">
                  AI found 24 matching profiles
                </p>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 h-12 w-[min(90%,420px)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-md"
                    initial={{ y: 40, opacity: 0, scale: 0.96 }}
                    animate={{ y: i * 18, opacity: 1 - i * 0.12, scale: 1 - i * 0.02 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex h-full items-center justify-between px-4 text-sm">
                      <span className="text-slate-600">Candidate #{1042 + i * 17}</span>
                      <span className="font-semibold text-emerald-600">{96 - i * 4}%</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function CommandCenterSection({ data }: { data: EmployerLandingMetrics }) {
  const stats = [
    { label: 'Active Jobs', value: formatCompact(data.metrics.activeJobs), color: 'text-blue-600' },
    { label: 'Interviews Today', value: '18', color: 'text-violet-600' },
    { label: 'Follow-ups', value: '46', color: 'text-orange-600' },
    { label: 'Pending Approvals', value: '7', color: 'text-pink-600' },
    { label: 'Placements', value: formatCompact(data.metrics.totalPlacements), color: 'text-emerald-600' },
  ];
  const dots = ['bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-emerald-500', 'bg-cyan-500'];

  return (
    <section className="relative overflow-hidden bg-[#EEF2FF] py-24 md:py-32">
      <AmbientGrid />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FadeIn>
            <SectionEyebrow>Live Operations</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)] font-semibold tracking-[-0.04em] text-slate-900">
              Your recruitment business, in real time.
            </h2>
          </FadeIn>
          <LivePulse />
        </div>

        <div className="mt-14 grid gap-10 rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_60px_rgba(37,99,235,0.1)] md:p-10 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-indigo-100 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {s.label}
                </p>
                <p className={`mt-2 text-4xl font-bold tabular-nums tracking-tight md:text-5xl ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Activity stream
              </p>
              <DemoOrLive mode={data.mode} />
            </div>
            <ul className="space-y-4">
              {data.activityFeed.map((row, i) => (
                <motion.li
                  key={`${row.time}-${row.text}`}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-4 border-b border-slate-200/70 pb-3 text-sm last:border-0"
                >
                  <span className="w-12 shrink-0 font-mono text-indigo-500">{row.time}</span>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dots[i % dots.length]}`} />
                  <span className="text-slate-600">{row.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection({ data }: { data: EmployerLandingMetrics }) {
  const funnel = [
    { label: 'Leads', value: data.funnel.leads, color: 'from-blue-500 to-blue-400' },
    { label: 'Clients', value: data.funnel.clients, color: 'from-indigo-500 to-indigo-400' },
    { label: 'Jobs', value: data.funnel.jobs, color: 'from-violet-500 to-violet-400' },
    { label: 'Candidates', value: data.funnel.candidates, color: 'from-cyan-500 to-cyan-400' },
    { label: 'Interviews', value: data.funnel.interviews, color: 'from-pink-500 to-pink-400' },
    { label: 'Placements', value: data.funnel.placements, color: 'from-emerald-500 to-emerald-400' },
  ];
  const max = Math.max(...funnel.map((f) => f.value), 1);
  const trend = [42, 55, 48, 70, 66, 82, 90, 78, 95, 88, 102, 110];

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <SectionEyebrow>Data Visualization</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-[-0.04em] text-slate-900">
            See the engine, not just the numbers.
          </h2>
        </FadeIn>

        <div className="mt-14 rounded-[2rem] border border-slate-200 bg-linear-to-br from-slate-50 via-white to-indigo-50/40 p-6 md:p-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-6 text-sm font-semibold text-slate-500">Recruitment funnel</p>
              <div className="space-y-3">
                {funnel.map((row, i) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="w-24 text-xs uppercase tracking-[0.12em] text-slate-400">
                      {row.label}
                    </span>
                    <div className="h-8 flex-1 overflow-hidden rounded-md bg-white">
                      <motion.div
                        className={`flex h-full items-center rounded-md bg-linear-to-r ${row.color} px-3 text-xs font-semibold text-white`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(12, (row.value / max) * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.06 }}
                      >
                        {formatCompact(row.value)}
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-6 text-sm font-semibold text-slate-500">Placement trend</p>
              <svg viewBox="0 0 360 160" className="h-44 w-full" aria-label="Placement trend chart">
                <defs>
                  <linearGradient id="ptLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(79,70,229,0.3)" />
                    <stop offset="100%" stopColor="rgba(79,70,229,0)" />
                  </linearGradient>
                </defs>
                {(() => {
                  const pts = trend.map((v, i) => {
                    const x = (i / (trend.length - 1)) * 340 + 10;
                    const y = 140 - (v / 120) * 120;
                    return `${x},${y}`;
                  });
                  const line = pts.join(' ');
                  const area = `10,140 ${line} 350,140`;
                  return (
                    <>
                      <polygon points={area} fill="url(#ptLight)" />
                      <polyline
                        points={line}
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  );
                })()}
              </svg>
              <p className="mt-2 text-xs text-slate-400">
                Trend visualization · {data.mode === 'live' ? 'scaled from live aggregates' : 'demo series'}
              </p>

              <p className="mb-4 mt-10 text-sm font-semibold text-slate-500">AI matching intensity</p>
              <div className="flex h-28 items-end gap-2">
                {[62, 74, 58, 81, 90, 70, 95, 88].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-md bg-linear-to-t from-violet-500 to-cyan-400"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AutomationSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % AUTO_NODES.length), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#FFF7ED] py-24 md:py-32">
      <SoftGlow className="right-10 top-20 h-64 w-64" color="rgba(249,115,22,0.18)" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeIn>
          <SectionEyebrow className="!text-orange-600">Automation</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,3.8rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Workflows that move work forward.
          </h2>
        </FadeIn>

        <div className="relative mt-14 overflow-x-auto rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_20px_50px_rgba(249,115,22,0.1)] backdrop-blur pb-6">
          <div className="flex min-w-[980px] items-center gap-0">
            {AUTO_NODES.map((node, i) => {
              const on = i === active;
              return (
                <React.Fragment key={node}>
                  <motion.div
                    animate={{
                      scale: on ? 1.06 : 1,
                      boxShadow: on ? '0 0 0 3px rgba(249,115,22,0.25)' : 'none',
                    }}
                    className={`flex h-20 w-[7.5rem] shrink-0 items-center justify-center rounded-xl border px-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] ${NODE_COLORS[i % NODE_COLORS.length]}`}
                  >
                    {node}
                  </motion.div>
                  {i < AUTO_NODES.length - 1 && (
                    <div className="relative h-px w-6 shrink-0 bg-orange-200">
                      <motion.span
                        className="absolute -top-1 h-2 w-2 rounded-full bg-orange-500"
                        animate={{ left: on ? '100%' : '0%' }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Active node:{' '}
          <span className="font-semibold text-orange-700">{AUTO_NODES[active]}</span>
        </p>
      </div>
    </section>
  );
}

function AriaSection({ data }: { data: EmployerLandingMetrics }) {
  const lines = useMemo(
    () => [
      { role: 'user' as const, text: 'What needs my attention today?' },
      {
        role: 'aria' as const,
        text: `You have ${data.metrics.openTasks > 0 ? Math.min(12, data.metrics.openTasks) : 12} follow-ups, 4 interviews and 2 client reviews. Your highest priority is the Java Developer requirement.`,
      },
      { role: 'user' as const, text: 'Show me the candidates.' },
      {
        role: 'aria' as const,
        text: '24 anonymized profiles match the requirement — ranked by AI fit.',
      },
    ],
    [data.metrics.openTasks],
  );
  const [shown, setShown] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setShown((s) => (s >= lines.length ? 1 : s + 1));
    }, 2200);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <section className="relative overflow-hidden bg-[#F5F3FF] py-24 md:py-32">
      <AmbientGrid />
      <SoftGlow className="left-10 top-20 h-64 w-64" color="rgba(124,58,237,0.18)" />
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <FadeIn className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue-500 via-violet-500 to-pink-500 shadow-lg">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <SectionEyebrow className="!text-violet-600">ARIA</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)] font-semibold tracking-[-0.045em] text-slate-900">
            Meet ARIA.
          </h2>
          <p className="mt-3 text-slate-600">Your AI workspace assistant.</p>
        </FadeIn>

        <div className="mt-12 space-y-4 rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_60px_rgba(124,58,237,0.12)] md:p-8">
          {lines.slice(0, shown).map((line, i) => (
            <motion.div
              key={`${line.role}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  line.role === 'user'
                    ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white'
                    : 'border border-violet-100 bg-violet-50 text-slate-700'
                }`}
              >
                {line.role === 'aria' && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                    ARIA
                  </p>
                )}
                {line.text}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Controlled product demonstration</p>
      </div>
    </section>
  );
}

function AiUsageAndCoins({ data }: { data: EmployerLandingMetrics }) {
  return (
    <section className="relative overflow-hidden bg-[#F0FDFA] py-24 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">
        <FadeIn>
          <SectionEyebrow className="!text-teal-600">Intelligence in motion</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Live AI usage
          </h2>
          <div className="mt-10 space-y-8">
            {[
              { label: 'CVs analyzed', value: data.metrics.totalCandidates, color: 'text-blue-600' },
              { label: 'Matches generated', value: data.metrics.aiMatches, color: 'text-violet-600' },
              {
                label: 'Jobs enhanced',
                value: Math.round(data.metrics.activeJobs * 0.6),
                color: 'text-teal-600',
              },
            ].map((row) => (
              <div key={row.label} className="border-b border-teal-100 pb-6">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{row.label}</p>
                <p className={`mt-2 text-4xl font-bold tabular-nums md:text-5xl ${row.color}`}>
                  {formatCompact(row.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DemoOrLive mode={data.mode} />
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="flex flex-col items-center justify-center">
          <SectionEyebrow className="!text-cyan-600">AI Coins</SectionEyebrow>
          <div className="relative mt-8 flex h-64 w-64 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-200"
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            />
            <svg className="absolute inset-2" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="6" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#coinGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                whileInView={{ strokeDashoffset: 70 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4 }}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#06B6D4" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative z-10 rounded-full bg-white/80 px-6 py-8 text-center shadow-lg backdrop-blur">
              <p className="text-4xl font-bold tabular-nums text-slate-900">12,450</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
                AI Coins
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            {['CV AI', 'Matching', 'Documents', 'ARIA', 'Job Creation'].map((l) => (
              <span key={l} className="rounded-full border border-cyan-100 bg-white px-3 py-1">
                {l}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Demonstration wallet — no private balances exposed
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

function ModesSection() {
  const [mode, setMode] = useState<'agency' | 'standalone'>('agency');
  const agency = ['Clients', 'Recruiters', 'Candidates', 'Placements', 'Commission', 'Targets'];
  const standalone = ['Hiring', 'Candidates', 'Interviews', 'Approvals', 'Analytics', 'Assessments'];
  const items = mode === 'agency' ? agency : standalone;

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="text-center">
          <SectionEyebrow>Product modes</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold tracking-[-0.04em] text-slate-900">
            One product. Two operating worlds.
          </h2>
        </FadeIn>

        <div className="mx-auto mt-10 flex max-w-md rounded-full border border-slate-200 bg-slate-50 p-1">
          {(['agency', 'standalone'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold uppercase tracking-[0.12em] transition ${
                mode === m
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-14 grid max-w-5xl items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div
            className={`rounded-3xl border p-6 transition ${
              mode === 'agency'
                ? 'border-blue-200 bg-blue-50/80 shadow-lg'
                : 'border-slate-100 bg-slate-50 opacity-45'
            }`}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Agency</p>
            {agency.map((item) => (
              <div key={item} className="border-l-2 border-blue-300 px-4 py-2.5 text-lg font-medium text-slate-800">
                {item}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <div className="rounded-full border border-indigo-100 bg-white px-6 py-8 text-center shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">HRYantra</p>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'agency' ? 'Agency OS' : 'Hiring OS'}
              </p>
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 transition ${
              mode === 'standalone'
                ? 'border-violet-200 bg-violet-50/80 shadow-lg'
                : 'border-slate-100 bg-slate-50 opacity-45'
            }`}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
              Standalone
            </p>
            {standalone.map((item) => (
              <div
                key={item}
                className="border-l-2 border-violet-300 px-4 py-2.5 text-lg font-medium text-slate-800"
              >
                {item}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full grid gap-3 sm:grid-cols-2 md:hidden"
            >
              {items.map((item) => (
                <div
                  key={item}
                  className="border-l-2 border-indigo-300 bg-indigo-50/50 px-4 py-3 text-lg font-medium"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function EnterpriseSection() {
  const orgs = ['Company A', 'Company B', 'Company C', 'Company D'];
  const controls = ['Modules', 'Plans', 'AI Usage', 'Tickets', 'Organizations', 'Product Lines'];

  return (
    <section className="relative overflow-hidden bg-[#FDF4FF] py-24 md:py-28">
      <AmbientGrid />
      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <FadeIn>
          <SectionEyebrow className="!text-fuchsia-600">Enterprise / HQ</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Multi-tenant architecture, visualized.
          </h2>
        </FadeIn>

        <div className="relative mx-auto mt-16 h-[360px] max-w-3xl rounded-[2rem] border border-white bg-white/70 shadow-[0_24px_60px_rgba(236,72,153,0.1)] backdrop-blur">
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-indigo-100 bg-linear-to-br from-blue-50 to-violet-50 px-8 py-6 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
              HRYantra HQ
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {controls.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-slate-500"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          {orgs.map((org, i) => {
            const positions = [
              { left: '8%', top: '12%' },
              { left: '72%', top: '10%' },
              { left: '10%', top: '72%' },
              { left: '70%', top: '70%' },
            ];
            const colors = [
              'border-blue-200 bg-blue-50 text-blue-700',
              'border-violet-200 bg-violet-50 text-violet-700',
              'border-pink-200 bg-pink-50 text-pink-700',
              'border-cyan-200 bg-cyan-50 text-cyan-700',
            ];
            return (
              <motion.div
                key={org}
                className={`absolute rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${colors[i]}`}
                style={positions[i]}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              >
                {org}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureJourneySection() {
  const [cat, setCat] = useState<(typeof FEATURE_CATS)[number]>('CRM');
  const visuals: Record<(typeof FEATURE_CATS)[number], string[]> = {
    CRM: ['Lead pipeline', 'Follow-ups', 'Client convert', 'Agreements'],
    Recruitment: ['Jobs', 'AI match', 'Interviews', 'Placements'],
    AI: ['Brain', 'ARIA', 'Smart search', 'Document AI'],
    Operations: ['Tasks', 'Meetings', 'Approvals', 'Live feed'],
    Platform: ['Departments', 'Roles', 'Notifications', 'Reports'],
    Enterprise: ['HQ control', 'Plans', 'Tenants', 'AI coins'],
  };
  const accents = {
    CRM: 'from-blue-500 to-indigo-500',
    Recruitment: 'from-violet-500 to-purple-500',
    AI: 'from-cyan-500 to-blue-500',
    Operations: 'from-emerald-500 to-teal-500',
    Platform: 'from-orange-500 to-amber-500',
    Enterprise: 'from-pink-500 to-fuchsia-500',
  };

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <SectionEyebrow>Feature journey</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Explore the operating system.
          </h2>
        </FadeIn>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
          {FEATURE_CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                cat === c
                  ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-10 min-h-[280px] rounded-[2rem] border border-slate-200 bg-linear-to-br from-slate-50 to-indigo-50/40 p-8 md:p-12"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">{cat}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visuals[cat].map((v, i) => (
                <div key={v} className="border-t border-slate-200 pt-4">
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">{v}</p>
                  <motion.div
                    className={`mt-4 h-1.5 rounded-full bg-linear-to-r ${accents[cat]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${60 + i * 10}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function ImageProductSection() {
  return (
    <section className="relative overflow-hidden bg-[#F1F5F9] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative min-h-[70vh] overflow-hidden rounded-[2.5rem] shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <Image
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2000&q=80"
            alt="Professionals collaborating in a bright office"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-white via-white/40 to-transparent" />
          <div className="relative z-10 flex min-h-[70vh] flex-col justify-end gap-6 p-8 md:flex-row md:items-end md:justify-between md:p-12">
            <FadeIn className="max-w-md">
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-[-0.04em] text-slate-900">
                Built into the workday — not beside it.
              </h2>
            </FadeIn>
            <div className="relative h-40 w-full max-w-sm">
              <motion.div
                className="absolute right-0 top-0 w-56 rounded-xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                  AI Match
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">Candidate #1088 · 94%</p>
              </motion.div>
              <motion.div
                className="absolute bottom-0 left-0 w-52 rounded-xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              >
                <LivePulse label="Notification" />
                <p className="mt-2 text-sm text-slate-700">Interview confirmed · 4:30 PM</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FutureSection() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % FUTURE_WORDS.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-linear-to-b from-white via-[#EEF2FF] to-[#F5F3FF] px-6 text-center">
      <LightBlobs />
      <div className="relative z-10 max-w-4xl">
        <FadeIn>
          <h2 className="text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-slate-900">
            The future of recruitment is{' '}
            <span className="bg-linear-to-r from-blue-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              connected.
            </span>
          </h2>
        </FadeIn>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 md:gap-5">
          {FUTURE_WORDS.map((w, idx) => (
            <React.Fragment key={w}>
              <motion.span
                animate={{
                  opacity: idx === i ? 1 : 0.3,
                  scale: idx === i ? 1.08 : 1,
                }}
                className={`text-lg font-semibold tracking-[0.2em] md:text-2xl ${
                  idx === i
                    ? 'bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent'
                    : 'text-slate-400'
                }`}
              >
                {w}
              </motion.span>
              {idx < FUTURE_WORDS.length - 1 && <span className="text-slate-300">→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {['AI', 'CRM', 'ATS', 'Analytics', 'Automation', 'Intelligence'].map((l) => (
            <motion.span
              key={l}
              className="rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 shadow-sm"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3 + (l.length % 3), repeat: Infinity }}
            >
              {l}
            </motion.span>
          ))}
        </div>
        <p className="mt-16 text-xs font-bold uppercase tracking-[0.28em] text-indigo-600">HRYantra</p>
        <p className="mt-3 text-lg text-slate-500">The intelligent recruitment operating system.</p>
      </div>
    </section>
  );
}

function FinalCta() {
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-blue-600 via-violet-600 to-pink-500 py-28 text-center text-white md:py-36">
      <SoftGlow className="left-1/4 top-10 h-64 w-64" color="rgba(255,255,255,0.2)" />
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <FadeIn>
          <h2 className="text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.045em]">
            Ready to make recruitment intelligent?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/85 md:text-lg">
            Bring your entire recruitment operation into one connected AI workspace.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={trialHref}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Start Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href={demoHref}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-8 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Talk to Our Team
            </Link>
          </div>
        </FadeIn>

        <motion.div
          className="mx-auto mt-14 hidden max-w-md rounded-2xl border border-white/30 bg-white/15 p-4 text-left backdrop-blur-xl sm:block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            HRYantra preview
          </p>
          <p className="mt-2 text-sm text-white/90">Leads → AI Match → Interviews → Placement</p>
        </motion.div>
      </div>
    </section>
  );
}

export function CinematicBodyPartB({ data }: { data: EmployerLandingMetrics }) {
  return (
    <>
      <SmartSearchSection />
      <CommandCenterSection data={data} />
      <AnalyticsSection data={data} />
      <AutomationSection />
      <AriaSection data={data} />
      <AiUsageAndCoins data={data} />
      <ModesSection />
      <EnterpriseSection />
      <FeatureJourneySection />
      <ImageProductSection />
      <FutureSection />
      <FinalCta />
    </>
  );
}
