'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion';
import { formatCompact, type EmployerLandingMetrics } from '@/lib/employers/landingMetrics';
import {
  AmbientGrid,
  DemoOrLive,
  FadeIn,
  LightBlobs,
  SectionEyebrow,
  SoftGlow,
} from './CinematicShared';

const WORDS = ['CRM.', 'Recruitment.', 'AI.', 'Operations.', 'Automation.'] as const;
const WORD_COLORS = [
  'from-blue-600 to-indigo-500',
  'from-violet-600 to-purple-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-pink-500',
] as const;

const RECRUIT_FLOW = [
  'JOB',
  'AI MATCHING',
  'CANDIDATES',
  'SCREENING',
  'INTERVIEW',
  'CLIENT REVIEW',
  'PLACEMENT',
] as const;

const AUTO_NODES = [
  'NEW LEAD',
  'ASSIGN RECRUITER',
  'CREATE FOLLOW-UP',
  'MEETING',
  'CONVERT CLIENT',
  'CREATE JOB',
  'AI MATCH',
  'INTERVIEW',
  'CLIENT REVIEW',
  'PLACEMENT',
] as const;

const BRAIN_NODES = [
  'LEADS',
  'CLIENTS',
  'JOBS',
  'CANDIDATES',
  'INTERVIEWS',
  'PLACEMENTS',
  'ACTIVITIES',
  'DOCUMENTS',
] as const;

const FEATURE_CATS = [
  'CRM',
  'Recruitment',
  'AI',
  'Operations',
  'Platform',
  'Enterprise',
] as const;

const STAGE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', bar: 'bg-pink-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
];

function StatementSection() {
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(WORDS.length - 1, Math.floor(v * WORDS.length * 1.15));
    setActive(idx);
  });

  return (
    <section ref={ref} id="os-journey" className="relative flex min-h-[160vh] items-start bg-white">
      <div className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center px-6">
        <AmbientGrid />
        <LightBlobs />
        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
          Introduction
        </p>
        <h2 className="text-center text-[clamp(2.8rem,8vw,6.5rem)] font-semibold tracking-[-0.05em] text-slate-900">
          One platform.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-8">
          {WORDS.map((w, i) => (
            <motion.span
              key={w}
              className={`bg-linear-to-r ${WORD_COLORS[i]} bg-clip-text text-[clamp(1.4rem,3.5vw,2.75rem)] font-medium tracking-tight text-transparent`}
              animate={{
                opacity: i <= active ? 1 : 0.2,
                y: i <= active ? 0 : 12,
                filter: i === active ? 'saturate(1.2)' : 'saturate(0.7)',
              }}
              transition={{ duration: 0.35 }}
            >
              {w}
            </motion.span>
          ))}
        </div>
        <svg className="mt-8 h-8 w-[min(90vw,520px)]" viewBox="0 0 520 32" fill="none" aria-hidden>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#2563EB" />
              <stop offset="0.5" stopColor="#7C3AED" />
              <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <motion.path
            d="M10 16 H510"
            stroke="url(#lineGrad)"
            strokeWidth="2"
            strokeDasharray="8 8"
            animate={{ strokeDashoffset: [0, -32] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
        <motion.h3
          className="mt-6 bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-center text-[clamp(2.4rem,7vw,5rem)] font-semibold tracking-[-0.05em] text-transparent"
          animate={{ opacity: active >= WORDS.length - 1 ? 1 : 0.25, scale: active >= WORDS.length - 1 ? 1 : 0.96 }}
        >
          Connected.
        </motion.h3>
      </div>
    </section>
  );
}

function ProblemSolutionSection() {
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const chaos = useTransform(scrollYProgress, [0.1, 0.45], [1, 0]);
  const unity = useTransform(scrollYProgress, [0.35, 0.65], [0, 1]);
  const chaosItems = [
    { label: 'Excel', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { label: 'WhatsApp', color: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'Email', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'CVs', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    { label: 'Job Boards', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { label: 'Notes', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { label: 'Calendar', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  ];

  return (
    <section ref={ref} className="relative min-h-[140vh] bg-[#F1F5F9]">
      <div className="sticky top-0 flex min-h-[100svh] items-center overflow-hidden px-6 py-20">
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-2">
          <div className="relative min-h-[320px]">
            <motion.div style={{ opacity: chaos }} className="absolute inset-0">
              <p className="mb-8 text-2xl font-semibold tracking-tight text-slate-800 md:text-3xl">
                Too many tools.
              </p>
              {chaosItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  className={`absolute rounded-xl border px-3 py-2 text-sm font-medium shadow-sm ${item.color}`}
                  style={{
                    left: `${10 + ((i * 17) % 60)}%`,
                    top: `${20 + ((i * 23) % 55)}%`,
                  }}
                  animate={{
                    x: [0, (i % 2 ? 18 : -14), 0],
                    y: [0, (i % 3 ? -12 : 16), 0],
                    rotate: [0, i % 2 ? 6 : -5, 0],
                  }}
                  transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
                >
                  {item.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div style={{ opacity: unity }} className="relative flex flex-col justify-center">
            <SectionEyebrow>The solution</SectionEyebrow>
            <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900">
              One intelligent system.
            </h2>
            <p className="mt-5 max-w-md text-slate-600">
              Chaos collapses into HRYantra — a single operating system for relationships, hiring,
              intelligence, and outcomes.
            </p>
            <div className="relative mt-10 h-48 overflow-hidden rounded-[2rem] border border-indigo-100 bg-linear-to-br from-blue-50 via-violet-50 to-pink-50 shadow-[0_24px_60px_rgba(79,70,229,0.12)]">
              <AmbientGrid />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-white bg-white/80 px-8 py-5 text-center shadow-lg backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
                    HRYantra
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Recruitment OS</p>
                </div>
              </div>
              {['Leads', 'Jobs', 'AI', 'Placements'].map((n, i) => (
                <motion.span
                  key={n}
                  className="absolute rounded-full border border-white bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
                  style={{ left: `${12 + i * 22}%`, top: `${18 + (i % 2) * 55}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                >
                  {n}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CrmPipelineSection({ data }: { data: EmployerLandingMetrics }) {
  const stages = [
    { key: 'NEW', count: data.leadStages.NEW },
    { key: 'QUALIFIED', count: data.leadStages.QUALIFIED },
    { key: 'MEETING', count: data.leadStages.MEETING },
    { key: 'PROPOSAL', count: data.leadStages.PROPOSAL },
    { key: 'CLIENT', count: data.leadStages.CLIENT },
  ] as const;
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden bg-[#EEF2FF] py-24 md:py-32">
      <AmbientGrid />
      <SoftGlow className="left-1/4 top-10 h-64 w-64" color="rgba(37,99,235,0.15)" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeIn>
          <SectionEyebrow>CRM</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,4.2rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900">
            Every relationship has a next move.
          </h2>
        </FadeIn>

        <div className="mt-16 flex flex-col items-stretch gap-0 md:flex-row md:items-center md:justify-between md:gap-2">
          {stages.map((stage, i) => {
            const c = STAGE_COLORS[i];
            return (
              <React.Fragment key={stage.key}>
                <button
                  type="button"
                  onMouseEnter={() => setHover(stage.key)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(stage.key)}
                  onBlur={() => setHover(null)}
                  className={`group relative flex flex-1 flex-col items-center rounded-2xl border ${c.border} ${c.bg} bg-white px-4 py-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${c.text}`}>
                    {stage.key}
                  </span>
                  <span className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-slate-900 md:text-5xl">
                    {stage.count}
                  </span>
                  <span className="mt-2 h-1.5 w-12 overflow-hidden rounded-full bg-white/80">
                    <motion.span
                      className={`block h-full ${c.bar}`}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                    />
                  </span>
                  <AnimatePresence>
                    {hover === stage.key && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-1/2 top-[calc(100%+12px)] z-20 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xl md:top-auto md:bottom-[calc(100%+12px)]"
                      >
                        <p className={`text-xs font-semibold ${c.text}`}>{stage.key} workspace</p>
                        <ul className="mt-2 space-y-1.5 text-[12px] text-slate-500">
                          <li>Follow-up queued</li>
                          <li>Meeting available</li>
                          <li>Activity timeline</li>
                          <li>AI next-best action</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                {i < stages.length - 1 && (
                  <div className="flex h-8 items-center justify-center text-indigo-400 md:h-auto md:px-1">
                    <motion.span
                      animate={{ opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                    >
                      ↓
                    </motion.span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-8">
          <DemoOrLive mode={data.mode} />
        </div>
      </div>
    </section>
  );
}

function RecruitmentFlowSection() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % RECRUIT_FLOW.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#F5F3FF] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <SectionEyebrow>Recruitment</SectionEyebrow>
          <h2 className="mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900">
            From requirement to placement.
          </h2>
        </FadeIn>

        <div className="relative mt-16 overflow-x-auto pb-4">
          <div className="flex min-w-[720px] items-center justify-between gap-2">
            {RECRUIT_FLOW.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <React.Fragment key={label}>
                  <motion.div
                    animate={{
                      scale: active ? 1.06 : 1,
                      backgroundColor: active ? '#4F46E5' : done ? '#EEF2FF' : '#FFFFFF',
                      color: active ? '#fff' : '#0f172a',
                      borderColor: active ? '#4F46E5' : '#E2E8F0',
                    }}
                    className="relative flex h-24 w-28 flex-col items-center justify-center rounded-2xl border px-2 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
                    {active && (
                      <motion.span
                        layoutId="candidate-pip"
                        className="absolute -top-2 h-3 w-3 rounded-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                      />
                    )}
                  </motion.div>
                  {i < RECRUIT_FLOW.length - 1 && (
                    <div className="h-px flex-1 bg-linear-to-r from-indigo-200 to-pink-200" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Candidates move stage-to-stage inside one command flow — not across disconnected tools.
        </p>
      </div>
    </section>
  );
}

function AiMatchingSection({ data }: { data: EmployerLandingMetrics }) {
  const matches = [
    { id: '01', score: 96, color: 'from-blue-500 to-emerald-400' },
    { id: '02', score: 92, color: 'from-violet-500 to-blue-400' },
    { id: '03', score: 89, color: 'from-cyan-500 to-indigo-400' },
    { id: '04', score: 84, color: 'from-pink-500 to-violet-400' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#ECFEFF] py-24 md:py-32">
      <AmbientGrid />
      <SoftGlow className="left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2" color="rgba(6,182,212,0.2)" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <FadeIn className="text-center">
          <SectionEyebrow>AI Matching</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Intelligence that shortlists for you.
          </h2>
        </FadeIn>

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_0.9fr_1fr]">
          <FadeIn className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Requirement
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">Java Developer</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>Mumbai</li>
              <li>5+ Years</li>
              <li>Spring Boot</li>
              <li>Microservices</li>
              <li>AWS</li>
            </ul>
          </FadeIn>

          <div className="relative flex h-64 items-center justify-center">
            <motion.div
              className="absolute h-44 w-44 rounded-full bg-linear-to-br from-blue-400/30 via-violet-400/30 to-pink-400/30 blur-md"
              animate={{ scale: [1, 1.12, 1], rotate: [0, 40, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute h-28 w-28 rounded-full border-2 border-white bg-linear-to-br from-blue-500 via-violet-500 to-pink-500 shadow-[0_20px_50px_rgba(124,58,237,0.35)]"
              animate={{ boxShadow: ['0 20px 50px rgba(124,58,237,0.3)', '0 20px 70px rgba(37,99,235,0.4)', '0 20px 50px rgba(124,58,237,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative z-10 text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">AI</p>
              <p className="text-sm font-semibold">MATCH</p>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            {matches.map((c, i) => (
              <FadeIn key={c.id} delay={i * 0.08}>
                <div className="flex items-center gap-4">
                  <span className="w-28 text-sm text-slate-500">Candidate {c.id}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={`h-full rounded-full bg-linear-to-r ${c.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${c.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-emerald-600">
                    {c.score}%
                  </span>
                </div>
              </FadeIn>
            ))}
            <p className="pt-3 text-sm text-slate-500">
              {formatCompact(Math.min(24, data.metrics.activeJobs))} candidates matched ·{' '}
              <DemoOrLive mode={data.mode} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageStorySection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative min-h-[70vh] overflow-hidden rounded-[2.5rem] shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80"
            alt="Team collaborating in a bright modern workspace"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/55 to-transparent" />
          <div className="relative z-10 flex min-h-[70vh] max-w-xl flex-col justify-center p-8 md:p-14">
            <FadeIn>
              <SectionEyebrow>The human side of AI</SectionEyebrow>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900">
                Technology handles the complexity.
                <br />
                Your team handles the decisions.
              </h2>
            </FadeIn>
          </div>

          <motion.div
            className="absolute bottom-10 right-8 hidden w-56 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-xl backdrop-blur md:block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              AI Matching
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">24 candidates found</p>
            <p className="text-xs text-emerald-600">96% average match</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BrainSection({ data }: { data: EmployerLandingMetrics }) {
  const [active, setActive] = useState<string>('CANDIDATES');
  const panels: Record<string, Array<{ label: string; value: string }>> = {
    LEADS: [
      { label: 'Active leads', value: formatCompact(data.metrics.activeLeads) },
      { label: 'New stage', value: String(data.leadStages.NEW) },
      { label: 'Qualified', value: String(data.leadStages.QUALIFIED) },
    ],
    CLIENTS: [
      { label: 'Clients', value: formatCompact(data.metrics.totalClients) },
      { label: 'From pipeline', value: String(data.leadStages.CLIENT) },
    ],
    JOBS: [
      { label: 'Active jobs', value: formatCompact(data.metrics.activeJobs) },
      { label: 'Total jobs', value: formatCompact(data.metrics.totalJobs) },
      { label: 'Applications', value: formatCompact(data.metrics.applications) },
    ],
    CANDIDATES: [
      { label: 'Profiles', value: formatCompact(data.metrics.totalCandidates) },
      { label: 'AI matches', value: formatCompact(data.metrics.aiMatches) },
      { label: 'Applications', value: formatCompact(data.metrics.applications) },
    ],
    INTERVIEWS: [
      { label: 'Total interviews', value: formatCompact(data.metrics.totalInterviews) },
      { label: 'Scheduled', value: formatCompact(data.metrics.interviewsScheduled) },
    ],
    PLACEMENTS: [{ label: 'Placements', value: formatCompact(data.metrics.totalPlacements) }],
    ACTIVITIES: [
      { label: 'Open tasks', value: formatCompact(data.metrics.openTasks) },
      { label: 'Recruiters', value: formatCompact(data.metrics.activeRecruiters) },
    ],
    DOCUMENTS: [
      { label: 'Document AI', value: 'Available' },
      { label: 'KYC / agreements', value: 'In workspace' },
    ],
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-white py-24 md:py-28">
      <AmbientGrid />
      <LightBlobs />
      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <FadeIn>
          <SectionEyebrow>HRYantra Brain</SectionEyebrow>
          <h2 className="mt-4 text-[clamp(2.2rem,5.5vw,4.2rem)] font-semibold tracking-[-0.04em] text-slate-900">
            Your recruitment business has a brain.
          </h2>
        </FadeIn>

        <div className="relative mx-auto mt-16 flex h-[420px] max-w-3xl items-center justify-center md:h-[480px]">
          <motion.div
            className="absolute h-52 w-52 rounded-full bg-linear-to-br from-blue-400 via-violet-500 to-pink-400 opacity-90 blur-[2px] md:h-60 md:w-60"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute h-40 w-40 rounded-full bg-white/70 backdrop-blur-md md:h-48 md:w-48"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative z-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-600">HRYantra</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              BRAIN
            </p>
          </div>

          {BRAIN_NODES.map((node, i) => {
            const angle = (i / BRAIN_NODES.length) * Math.PI * 2 - Math.PI / 2;
            const r = 170;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const on = active === node;
            return (
              <button
                key={node}
                type="button"
                onClick={() => setActive(node)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm transition md:text-[11px] ${
                  on
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-md'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                }`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              >
                {node}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:grid-cols-3"
          >
            {(panels[active] || []).map((row) => (
              <div key={row.label} className="border-t border-slate-100 pt-3 text-left">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{row.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{row.value}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6">
          <DemoOrLive mode={data.mode} />
        </div>
      </div>
    </section>
  );
}

export function CinematicBodyPartA({ data }: { data: EmployerLandingMetrics }) {
  return (
    <>
      <StatementSection />
      <ProblemSolutionSection />
      <CrmPipelineSection data={data} />
      <RecruitmentFlowSection />
      <AiMatchingSection data={data} />
      <ImageStorySection />
      <BrainSection data={data} />
    </>
  );
}

export { AUTO_NODES, FEATURE_CATS };
