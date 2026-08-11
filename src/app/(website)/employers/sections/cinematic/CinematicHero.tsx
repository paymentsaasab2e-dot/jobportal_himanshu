'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { formatCompact, type EmployerLandingMetrics } from '@/lib/employers/landingMetrics';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';
import { AppLocale, localizePath } from '@/lib/i18n';
import { AmbientGrid, DemoOrLive, LightBlobs, SoftGlow } from './CinematicShared';

function FloatChip({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute rounded-2xl border border-white/80 bg-white/80 px-3.5 py-2.5 text-sm text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl ${className}`}
      animate={reduce ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export function CinematicHero({ data }: { data: EmployerLandingMetrics }) {
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const m = data.metrics;

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-[#F8FAFF] px-4 pb-16 pt-28 text-slate-900 sm:px-6 md:pt-32">
      <AmbientGrid />
      <LightBlobs />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-indigo-600">
            The Intelligent Recruitment Operating System
          </p>
          <h1 className="text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-slate-900">
            Recruitment,
            <br />
            <span className="bg-linear-to-r from-blue-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 lg:mx-0 md:text-lg">
            Connect leads, clients, candidates, jobs, interviews and placements through one
            intelligent workspace.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href={trialHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-8 text-base font-semibold text-white shadow-[0_12px_32px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(79,70,229,0.45)] active:scale-[0.98]"
            >
              Start Free
              <ArrowRight size={16} />
            </Link>
            <a
              href="#os-journey"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 text-base font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              Explore Platform
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-center gap-x-8 gap-y-4 lg:justify-start">
            {[
              { label: 'Active Jobs', value: m.activeJobs },
              { label: 'Candidates', value: m.totalCandidates },
              { label: 'AI Matches', value: m.aiMatches },
              { label: 'Placements', value: m.totalPlacements },
            ].map((item) => (
              <div key={item.label} className="min-w-[4.5rem]">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 md:text-3xl">
                  {formatCompact(item.value)}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center lg:justify-start">
            <DemoOrLive mode={data.mode} />
          </div>
          <div className="mt-3 flex justify-center lg:justify-start">
            <Link href={demoHref} className="text-sm text-indigo-600 underline-offset-4 hover:underline">
              Talk to our team
            </Link>
          </div>
        </div>

        {/* Light product UI */}
        <div className="relative mx-auto h-[440px] w-full max-w-lg sm:h-[500px] lg:mx-0 lg:max-w-none">
          <SoftGlow className="left-1/4 top-1/4 h-48 w-48" color="rgba(124,58,237,0.2)" />

          <motion.div
            className="absolute inset-x-4 top-8 bottom-10 rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:inset-x-8"
            style={{ transform: 'rotateY(-6deg) rotateX(4deg)' }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  HRYantra Command Center
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">Live recruitment ops</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Active Jobs', value: formatCompact(m.activeJobs), color: 'text-blue-600' },
                { label: 'AI Matches', value: formatCompact(m.aiMatches), color: 'text-violet-600' },
                { label: 'Interviews', value: '48', color: 'text-cyan-600' },
                { label: 'Placements', value: '18', color: 'text-pink-600' },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {row.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${row.color}`}>{row.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-linear-to-r from-blue-50 via-violet-50 to-pink-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Recruitment Pipeline
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                <span className="text-blue-600">●</span> Leads{' '}
                <span className="text-slate-300">→</span>{' '}
                <span className="text-violet-600">Clients</span>{' '}
                <span className="text-slate-300">→</span>{' '}
                <span className="text-pink-600">Interviews</span>
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white">
                <div className="w-[35%] bg-blue-500" />
                <div className="w-[30%] bg-violet-500" />
                <div className="w-[35%] bg-pink-500" />
              </div>
            </div>
          </motion.div>

          <FloatChip className="right-0 top-2 sm:right-2" delay={0.2}>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-white">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="font-semibold text-slate-800">AI Match 96%</span>
            </span>
          </FloatChip>

          <FloatChip className="bottom-16 left-0 sm:left-2" delay={0.5}>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-medium">18 Interviews Today</span>
            </span>
          </FloatChip>

          <FloatChip className="bottom-2 right-4 sm:right-8" delay={0.8}>
            <span className="font-medium text-pink-600">+ Placement Completed</span>
          </FloatChip>

          <FloatChip className="left-1/2 top-[42%] -translate-x-1/2 sm:left-auto sm:right-[-0.5rem] sm:top-36 sm:translate-x-0" delay={1.1}>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-linear-to-r from-violet-500 to-pink-500" />
              <span className="font-medium text-violet-700">ARIA is analyzing…</span>
            </span>
          </FloatChip>
        </div>
      </div>
    </section>
  );
}
