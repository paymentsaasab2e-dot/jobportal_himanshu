'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Receipt,
  Sparkles,
  Target,
  UserCheck,
  Users,
  Wallet,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  formatCompact,
} from '@/lib/employers/landingMetrics';
import { useLandingMetrics } from './cinematic/useLandingMetrics';
import {
  featuresByCategory,
  highlightFeatures,
  hrmsComparisonRows,
  phase2Categories,
  phase2Features,
  productModes,
  type Phase2CategoryId,
} from '../employersPhase2Features';
import { AppLocale, localizePath } from '@/lib/i18n';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';

const HOW_IT_WORKS_SLIDES = [
  {
    id: 'crm',
    number: '01',
    label: 'CRM',
    titleLead: 'CRM — From Leads to Clients, ',
    titleAccent: 'All in One Place',
    description:
      'Manage the complete customer journey from the first lead to a successful client conversion.',
    steps: [
      {
        step: '01',
        title: 'Capture the lead',
        detail:
          'Bring leads from inbound forms, imports, campaigns, or manual CRM entries into one workspace.',
      },
      {
        step: '02',
        title: 'Follow up',
        detail:
          'Manage calls, WhatsApp, emails, meetings, notes, and follow-up activities from the lead profile.',
      },
      {
        step: '03',
        title: 'Qualify the lead',
        detail: 'Identify qualified prospects based on requirements, interest, and business potential.',
      },
      {
        step: '04',
        title: 'Schedule meetings',
        detail: 'Plan client meetings, record discussions, and track meeting outcomes.',
      },
      {
        step: '05',
        title: 'Manage the opportunity',
        detail:
          'Move qualified leads through the sales pipeline and manage proposals, requirements, and negotiations.',
      },
      {
        step: '06',
        title: 'Convert to client',
        detail:
          'Convert successful opportunities into client accounts while keeping all communication and history connected.',
      },
    ],
  },
  {
    id: 'recruitment',
    number: '02',
    label: 'Recruitment',
    titleLead: 'Recruitment — From Candidates to Hires, ',
    titleAccent: 'Made Simple',
    description:
      'Manage the complete recruitment journey from creating a job to successfully hiring a candidate.',
    steps: [
      {
        step: '01',
        title: 'Create the job',
        detail: 'Create job openings, define requirements, generate JDs with AI, and publish jobs.',
      },
      {
        step: '02',
        title: 'Receive applications',
        detail: 'Collect candidates from job portals, career pages, referrals, and your candidate portal.',
      },
      {
        step: '03',
        title: 'Screen candidates',
        detail: 'Review resumes, skills, experience, and candidate profiles to identify suitable applicants.',
      },
      {
        step: '04',
        title: 'Shortlist candidates',
        detail: 'Use AI matching and recruiter evaluation to shortlist the most relevant candidates.',
      },
      {
        step: '05',
        title: 'Conduct interviews',
        detail:
          'Schedule interviews, manage interview rounds, collect feedback, and track candidate progress.',
      },
      {
        step: '06',
        title: 'Select the candidate',
        detail: 'Compare interview feedback and move the best-fit candidate to the selection stage.',
      },
      {
        step: '07',
        title: 'Complete the hire',
        detail:
          'Manage offer details, joining information, and convert the selected candidate into an employee.',
      },
    ],
  },
  {
    id: 'employee',
    number: '03',
    label: 'Employee',
    titleLead: 'Employee Management — From Onboarding to Growth, ',
    titleAccent: 'All in One',
    description:
      'Manage the employee lifecycle from joining to everyday workforce management and development.',
    steps: [
      {
        step: '01',
        title: 'Start onboarding',
        detail:
          'Move new hires into onboarding and collect employee information, documents, and required details.',
      },
      {
        step: '02',
        title: 'Create employee profile',
        detail:
          'Maintain a centralized employee record with personal, professional, and employment information.',
      },
      {
        step: '03',
        title: 'Track attendance',
        detail: 'Manage daily attendance, working hours, shifts, late marks, and attendance records.',
      },
      {
        step: '04',
        title: 'Manage leave',
        detail: 'Handle leave applications, balances, approvals, and leave history.',
      },
      {
        step: '05',
        title: 'Track performance',
        detail: 'Set goals, manage reviews, track performance, and monitor employee progress.',
      },
      {
        step: '06',
        title: 'Support employee growth',
        detail: 'Manage training, development, skills, and career growth within the organization.',
      },
    ],
  },
  {
    id: 'payroll',
    number: '04',
    label: 'Payroll',
    titleLead: 'Payroll — From Calculation to Payment, ',
    titleAccent: 'Effortlessly',
    description: 'Manage the complete payroll cycle from employee salary data to final payment.',
    steps: [
      {
        step: '01',
        title: 'Set up salary',
        detail: 'Configure employee salary structures, allowances, deductions, and payroll details.',
      },
      {
        step: '02',
        title: 'Collect attendance & leave data',
        detail:
          'Bring attendance, working days, overtime, leave, and other payroll inputs into the payroll cycle.',
      },
      {
        step: '03',
        title: 'Calculate payroll',
        detail: 'Automatically calculate earnings, deductions, taxes, and final salary amounts.',
      },
      {
        step: '04',
        title: 'Verify payroll',
        detail: 'Review payroll calculations, identify exceptions, and approve the payroll before processing.',
      },
      {
        step: '05',
        title: 'Generate payslips',
        detail: 'Generate employee payslips with complete salary and deduction details.',
      },
      {
        step: '06',
        title: 'Process payment',
        detail: 'Complete salary payments and maintain payroll records for every employee.',
      },
    ],
  },
] as const;

const CORE_MODULES = [
  {
    title: 'CRM',
    icon: Target,
    items: [
      'Leads, merge & convert',
      'Follow-ups & meetings',
      'Client CRM + contacts',
      'Agreements & KYC AI',
    ],
  },
  {
    title: 'Recruitment',
    icon: Briefcase,
    items: [
      'Jobs + public apply',
      'Bulk CV intake & AI matching',
      'Interviews & shortlists',
      'Offers & placements',
    ],
  },
  {
    title: 'Employee',
    icon: Users,
    items: [
      'Onboarding & employee profiles',
      'Attendance & leave',
      'Performance tracking',
      'Training & growth',
    ],
  },
  {
    title: 'Payroll',
    icon: Wallet,
    items: [
      'Salary structures & setup',
      'Attendance-linked payroll',
      'Payslips & deductions',
      'Payment processing',
    ],
  },
];

const AI_TOOLS = [
  { title: 'AI Job Creation', line: 'Prompt-to-posting with titles, JD, skills, and salary hints.', icon: Sparkles },
  { title: '4-pass AI Matching', line: 'Ranked shortlists with explainable scores across CV, skills, and fit.', icon: Zap },
  { title: 'Bulk CV parse', line: 'ZIP intake, resume parsing, and duplicate detection.', icon: Briefcase },
  { title: 'ARIA / Workspace brief', line: 'Daily “what needs attention” operator for your tenant.', icon: Bot },
  { title: 'Document + KYC AI', line: 'Extract structured fields from agreements and identity docs.', icon: Wallet },
  { title: 'Smart Search', line: 'Ask HRYantra in natural language across jobs, leads, and candidates.', icon: Target },
];

const PLANS = [
  { name: 'Starter', line: 'Core CRM + hiring for boutique teams', badge: 'Entry' },
  { name: 'Professional', line: 'AI matching, full-cycle hiring, and billing', badge: 'Popular' },
  { name: 'Enterprise', line: 'HQ analytics, Brain, SSO options, dedicated support', badge: 'Scale' },
];

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2.5">
      <span className={`h-1.5 w-10 rounded-full ${dark ? 'bg-amber-400' : 'bg-[#28A8E1]'}`} />
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
          dark ? 'text-amber-300' : 'text-[#176F96]'
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function DemoBadge({ mode, loading }: { mode: string; loading?: boolean }) {
  if (loading) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
        Loading live data…
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
        mode === 'live'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
          : 'bg-[#E8F6FC] text-[#176F96] ring-[#28A8E1]/15'
      }`}
    >
      {mode === 'live' ? 'Live aggregates' : 'Product demo data'}
    </span>
  );
}

export function EmployersServicesStyleBody() {
  const { data, loading } = useLandingMetrics();
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const m = data.metrics;
  const availableCount = phase2Features.filter((f) => f.available).length;

  const [howItWorksIndex, setHowItWorksIndex] = useState(0);
  const [howItWorksDir, setHowItWorksDir] = useState(1);
  const [howItWorksPaused, setHowItWorksPaused] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [mode, setMode] = useState<'agency' | 'standalone'>('agency');
  const [cat, setCat] = useState<Phase2CategoryId>('crm');
  const [searchTyped, setSearchTyped] = useState('');
  const [searchPhase, setSearchPhase] = useState<'type' | 'chips' | 'results'>('type');
  const [ariaShown, setAriaShown] = useState(1);

  const autoNodes = ['Lead', 'Assign', 'Follow-up', 'Meeting', 'Client', 'Job', 'Match', 'Interview', 'Place', 'Invoice'];

  useEffect(() => {
    const b = setInterval(() => setAutoStep((s) => (s + 1) % autoNodes.length), 1100);
    const c = setInterval(() => setAriaShown((s) => (s >= 4 ? 1 : s + 1)), 2200);
    return () => {
      clearInterval(b);
      clearInterval(c);
    };
  }, [autoNodes.length]);

  useEffect(() => {
    if (howItWorksPaused) return undefined;
    const id = setInterval(() => {
      setHowItWorksDir(1);
      setHowItWorksIndex((i) => (i === HOW_IT_WORKS_SLIDES.length - 1 ? 0 : i + 1));
    }, 7000);
    return () => clearInterval(id);
  }, [howItWorksPaused]);

  useEffect(() => {
    const phrase = 'Find senior Java developers in Mumbai';
    let cancelled = false;
    let typeId: ReturnType<typeof setInterval> | undefined;
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      if (cancelled) return;
      setSearchTyped('');
      setSearchPhase('type');
      let i = 0;
      typeId = setInterval(() => {
        if (cancelled) return;
        i += 1;
        setSearchTyped(phrase.slice(0, i));
        if (i >= phrase.length) {
          if (typeId) clearInterval(typeId);
          setSearchPhase('chips');
          t1 = setTimeout(() => {
            if (!cancelled) setSearchPhase('results');
            t2 = setTimeout(run, 4200);
          }, 1100);
        }
      }, 36);
    };
    run();
    return () => {
      cancelled = true;
      if (typeId) clearInterval(typeId);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, []);

  const catFeatures = useMemo(() => highlightFeatures(cat, 8), [cat]);
  const allCatFeatures = useMemo(() => featuresByCategory(cat), [cat]);

  const glanceModules = [
    {
      title: 'CRM',
      cards: [
        { label: 'New Leads', value: formatCompact(m.activeLeads), icon: Target, color: 'text-[#176F96]', bg: 'bg-[#E8F6FC]' },
        { label: 'Active Clients', value: formatCompact(m.totalClients), icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Follow-ups Due', value: formatCompact(data.leadStages.QUALIFIED), icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Meetings Today', value: formatCompact(data.leadStages.MEETING), icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-50' },
      ],
    },
    {
      title: 'Recruitment',
      cards: [
        { label: 'Open Jobs', value: formatCompact(m.activeJobs), icon: Briefcase, color: 'text-[#176F96]', bg: 'bg-[#E8F6FC]' },
        { label: 'New Candidates', value: formatCompact(m.totalCandidates), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Shortlisted', value: formatCompact(m.aiMatches), icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Interviews Today', value: formatCompact(m.totalInterviews), icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
      ],
    },
    {
      title: 'Employee',
      cards: [
        { label: 'Total Staff', value: '248', icon: Users, color: 'text-[#176F96]', bg: 'bg-[#E8F6FC]' },
        { label: 'Working Today', value: '219', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'On Leave', value: '18', icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Requests Pending', value: '11', icon: ClipboardCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
      ],
    },
    {
      title: 'Payroll',
      cards: [
        { label: 'Payroll Processed', value: '248', icon: Wallet, color: 'text-[#176F96]', bg: 'bg-[#E8F6FC]' },
        { label: 'Payslips Ready', value: '248', icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Salary Pending', value: '11', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Compliance Due', value: '6', icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ],
    },
  ];

  return (
    <div className="bg-[#fcfcfd] text-[#111827]">
      {/* Stats */}
      <section id="overview" className="scroll-mt-24 border-t border-slate-200/60 bg-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              HRYantra glance
            </p>
            <DemoBadge mode={data.mode} loading={loading} />
          </div>
          <div className="grid gap-8">
            {glanceModules.map((module) => (
              <div key={module.title}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
                  {module.title}
                </p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={`${module.title}-skel-${i}`}
                          className="h-[72px] animate-pulse rounded-[1.25rem] border border-gray-200/80 bg-slate-100"
                        />
                      ))
                    : module.cards.map((s) => {
                        const Icon = s.icon;
                        return (
                          <div
                            key={`${module.title}-${s.label}`}
                            className="flex items-center gap-3 rounded-[1.25rem] border border-gray-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                              <Icon className={`h-5 w-5 ${s.color}`} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xl font-bold tracking-tight text-gray-900">{s.value}</p>
                              <p className="text-xs font-medium text-gray-500">{s.label}</p>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden border-t border-slate-200/60 bg-[#F4F8FB] py-20 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_-10%,rgba(40,168,225,0.14),transparent),radial-gradient(ellipse_60%_40%_at_90%_0%,rgba(15,90,122,0.08),transparent)]"
        />
        <div
          className="relative z-10 mx-auto max-w-7xl px-6"
          onMouseEnter={() => setHowItWorksPaused(true)}
          onMouseLeave={() => setHowItWorksPaused(false)}
        >
          <div className="relative overflow-hidden">
            <Eyebrow>How it works</Eyebrow>
            <AnimatePresence mode="wait" custom={howItWorksDir}>
              <motion.div
                key={HOW_IT_WORKS_SLIDES[howItWorksIndex].id}
                custom={howItWorksDir}
                initial={{ opacity: 0, x: howItWorksDir * 56 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: howItWorksDir * -56 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                      {HOW_IT_WORKS_SLIDES[howItWorksIndex].titleLead}
                      <span className="bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A] bg-clip-text text-transparent">
                        {HOW_IT_WORKS_SLIDES[howItWorksIndex].titleAccent}
                      </span>
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                      {HOW_IT_WORKS_SLIDES[howItWorksIndex].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous module"
                      onClick={() => {
                        setHowItWorksDir(-1);
                        setHowItWorksIndex((i) => (i === 0 ? HOW_IT_WORKS_SLIDES.length - 1 : i - 1));
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#28A8E1]/40 hover:text-[#176F96]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next module"
                      onClick={() => {
                        setHowItWorksDir(1);
                        setHowItWorksIndex((i) => (i === HOW_IT_WORKS_SLIDES.length - 1 ? 0 : i + 1));
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#28A8E1]/40 hover:text-[#176F96]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {HOW_IT_WORKS_SLIDES[howItWorksIndex].steps.map((item) => (
                    <div
                      key={`${HOW_IT_WORKS_SLIDES[howItWorksIndex].id}-${item.step}`}
                      className="rounded-[1.35rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm"
                    >
                      <p className="text-[11px] font-black tabular-nums text-[#28A8E1]">{item.step}</p>
                      <h4 className="mt-2 text-[15px] font-bold tracking-tight text-slate-900">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Core modules */}
      <section className="border-t border-slate-200/60 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>Core modules</Eyebrow>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                All-in-one solutions for{' '}
                <span className="bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A] bg-clip-text text-transparent">
                  human-related hurdles.
                </span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                To build a friction-free business, an entrepreneur needs to eliminate dependency on
                manual human control.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['CRM', 'Recruitment', 'Employee', 'Payroll'].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CORE_MODULES.map((mod, index) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[#28A8E1]/40 hover:shadow-[0_28px_56px_-28px_rgba(40,168,225,0.35)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F6FC] text-[#28A8E1] ring-1 ring-[#28A8E1]/15 transition group-hover:bg-[#28A8E1] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-slate-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold tracking-tight text-slate-900">{mod.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {mod.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium AI */}
      <section className="relative overflow-hidden border-t border-slate-200/60 bg-gradient-to-b from-[#E8F6FC] via-white to-[#F4F8FB] py-20 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_85%_-5%,rgba(40,168,225,0.22),transparent),radial-gradient(ellipse_45%_40%_at_5%_90%,rgba(15,90,122,0.08),transparent)]"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-2xl">
            <Eyebrow>Premium AI</Eyebrow>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Intelligence that{' '}
              <span className="bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A] bg-clip-text text-transparent">
                shortlists for you
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Coin-powered tools that already exist in the employer workspace — not vapourware.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_TOOLS.map((item, index) => {
              const Icon = item.icon;
              const featured = index < 2;
              return (
                <div
                  key={item.title}
                  className={`flex items-start gap-3.5 rounded-[1.35rem] border p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    featured
                      ? 'border-[#28A8E1]/35 bg-gradient-to-br from-white via-[#E8F6FC]/80 to-white ring-1 ring-[#28A8E1]/10'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      featured
                        ? 'bg-[#28A8E1] text-white shadow-sm shadow-[#28A8E1]/25'
                        : 'bg-[#E8F6FC] text-[#28A8E1] ring-1 ring-[#28A8E1]/15'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.line}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smart search + ARIA */}
      <section className="border-t border-slate-200/60 bg-[#F4F8FB] py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] md:p-8">
            <Eyebrow>Smart Search</Eyebrow>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Ask HRYantra anything.</h2>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800">
              {searchTyped || <span className="text-slate-400">Ask HRYantra anything…</span>}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#28A8E1] align-middle" />
            </div>
            {searchPhase !== 'type' && (
              <div className="mt-4 flex flex-wrap gap-2">
                {['Senior', 'Java', 'Mumbai', 'Spring Boot', 'This week'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[#E8F6FC] px-3 py-1 text-xs font-semibold text-[#176F96]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
            {searchPhase === 'results' && (
              <p className="mt-4 text-sm font-semibold text-emerald-600">
                {formatCompact(m.totalCandidates)} candidates on platform
              </p>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] md:p-8">
            <Eyebrow>ARIA</Eyebrow>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Meet ARIA.</h2>
            <p className="mt-2 text-sm text-slate-500">Your AI workspace assistant.</p>
            <div className="mt-6 space-y-3">
              {[
                { role: 'user', text: 'What needs my attention today?' },
                {
                  role: 'aria',
                  text: `You have ${Math.min(12, m.openTasks || 12)} follow-ups, 4 interviews, and 2 client reviews. Highest priority: Java Developer.`,
                },
                { role: 'user', text: 'Show me the candidates.' },
                { role: 'aria', text: `${formatCompact(m.totalCandidates)} anonymized profiles match — ranked by AI fit.` },
              ]
                .slice(0, ariaShown)
                .map((line, i) => (
                  <div key={i} className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm ${
                        line.role === 'user'
                          ? 'bg-[#28A8E1] text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {line.role === 'aria' && (
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#176F96]">ARIA</p>
                      )}
                      {line.text}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Operations + activity */}
      <section className="border-t border-slate-200/60 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Live operations</Eyebrow>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Your recruitment business,{' '}
                <span className="bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A] bg-clip-text text-transparent">
                  in real time
                </span>
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Active jobs', value: formatCompact(m.activeJobs) },
                { label: 'Interviews', value: formatCompact(m.interviewsScheduled) },
                { label: 'Open tasks', value: formatCompact(m.openTasks) },
                { label: 'Applications', value: formatCompact(m.applications) },
                { label: 'Recruiters', value: formatCompact(m.activeRecruiters) },
                { label: 'Placements', value: formatCompact(m.totalPlacements) },
              ].map((row) => (
                <div key={row.label} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{row.label}</p>
                  <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Activity stream
              </p>
              <ul className="space-y-3">
                {(loading ? [] : data.activityFeed).map((row) => (
                  <li key={`${row.time}-${row.text}`} className="flex gap-3 border-b border-slate-100 pb-3 text-sm last:border-0">
                    <span className="w-12 shrink-0 font-mono text-[#176F96]">{row.time}</span>
                    <span className="text-slate-600">{row.text}</span>
                  </li>
                ))}
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  ))
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Automation + coins + modes */}
      <section className="border-t border-slate-200/60 bg-[#F4F8FB] py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Automation</Eyebrow>
          <h2 className="mb-8 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Workflows that move work forward.
          </h2>
          <div className="mb-12 overflow-x-auto rounded-[1.75rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex min-w-[860px] items-center gap-2">
              {autoNodes.map((node, i) => (
                <React.Fragment key={node}>
                  <div
                    className={`flex h-16 min-w-[5.5rem] items-center justify-center rounded-xl border px-2 text-center text-[10px] font-bold uppercase ${
                      i === autoStep
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {node}
                  </div>
                  {i < autoNodes.length - 1 && <div className="h-px w-4 bg-slate-200" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white bg-white p-6 md:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#28A8E1]" />
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  {data.mode === 'live' ? 'Platform AI' : 'AI Coins'}
                </p>
              </div>
              <p className="text-4xl font-black tabular-nums text-slate-900">
                {data.mode === 'live' ? formatCompact(m.aiMatches) : '12,450'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {data.mode === 'live'
                  ? 'Total AI matches across live tenant workspaces'
                  : 'Demonstration wallet — no private balances'}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ['CV parsing', '████████░░'],
                  ['AI matching', '██████░░░░'],
                  ['Document AI', '████░░░░░░'],
                  ['Job creation', '███░░░░░░░'],
                ].map(([label, bar]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-600">{label}</p>
                    <p className="mt-1 font-mono text-[11px] tracking-widest text-[#176F96]">{bar}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white bg-white p-6 md:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Product modes</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Agency or standalone</h3>
              <div className="mt-4 flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {(['agency', 'standalone'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`flex-1 rounded-full py-2 text-sm font-bold capitalize ${
                      mode === key ? 'bg-[#28A8E1] text-white' : 'text-slate-500'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600">{productModes[mode].description}</p>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {productModes[mode].points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature explorer */}
      <section id="features" className="border-t border-slate-200/60 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Feature explorer</Eyebrow>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Explore the operating system.
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            {allCatFeatures.length} capabilities in this category · {availableCount}+ across the platform.
          </p>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {phase2Categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  cat === c.id
                    ? 'bg-[#28A8E1] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">{phase2Categories.find((c) => c.id === cat)?.tagline}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catFeatures.map((f, index) => (
              <div
                key={f.id}
                className={`rounded-[1.35rem] border p-5 transition hover:-translate-y-0.5 ${
                  f.highlight
                    ? 'border-[#28A8E1]/35 bg-gradient-to-br from-[#0F5A7A] via-[#176F96] to-[#28A8E1] text-white'
                    : 'border-slate-200 bg-white hover:border-[#28A8E1]/40'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`text-[10px] font-bold tabular-nums ${f.highlight ? 'text-white/60' : 'text-slate-300'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {f.highlight && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                      Highlight
                    </span>
                  )}
                </div>
                <p className={`text-[15px] font-bold ${f.highlight ? 'text-white' : 'text-slate-900'}`}>{f.title}</p>
                <p className={`mt-1.5 text-sm leading-relaxed ${f.highlight ? 'text-white/80' : 'text-slate-500'}`}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-slate-200/60 bg-[#F4F8FB] py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow>Why HRYantra</Eyebrow>
          <h2 className="mb-8 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Spreadsheets and generic ATS vs. one OS.
          </h2>
          <div className="overflow-x-auto rounded-[1.75rem] border border-white bg-white shadow-sm">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-5 py-4">Capability</th>
                  <th className="px-5 py-4">Spreadsheets</th>
                  <th className="px-5 py-4">Generic ATS</th>
                  <th className="px-5 py-4 text-[#176F96]">HRYantra</th>
                </tr>
              </thead>
              <tbody>
                {hrmsComparisonRows.map((row) => (
                  <tr key={row.capability} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.capability}</td>
                    <td className="px-5 py-3.5 text-slate-400">{row.spreadsheets ? 'Yes' : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {row.genericAts === true ? 'Yes' : row.genericAts === 'partial' ? 'Partial' : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-600">Yes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Plans + CTA */}
      <section id="pricing" className="border-t border-slate-200/60 bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F6FC] text-[#28A8E1]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Plans</p>
                  <h3 className="text-xl font-black text-slate-900">Entrepreneurs plans</h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {PLANS.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border p-4 ${
                      index === 1 ? 'border-[#28A8E1]/40 bg-[#E8F6FC]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          index === 1 ? 'bg-[#28A8E1] text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{plan.line}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-slate-500">
                Includes AI coins, HQ tab/module control, and agency vs standalone modes.
              </p>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-amber-400/30 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 p-6 text-slate-950 shadow-[0_32px_64px_-36px_rgba(245,158,11,0.55)] md:p-8">
              <div>
                <Users className="mb-3 h-7 w-7" />
                <h3 className="text-2xl font-black tracking-tight">Ready to make recruitment intelligent?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-900/75">
                  Bring leads, jobs, AI matching, interviews, and placements into one connected workspace.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href={trialHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={demoHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-950/15 bg-white/40 px-5 py-3 text-sm font-semibold text-slate-950 backdrop-blur transition hover:bg-white/70"
                >
                  Talk to Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
