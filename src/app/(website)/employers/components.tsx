"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Pencil,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Rocket,
  PlusCircle,
  Target,
  Search,
  MapPin,
  PlayCircle,
  Home,
  Building2,
  BarChart2,
  Package,
  GraduationCap,
  Code2,
  TrendingUp,
  BadgeDollarSign,
  Users,
  Cpu,
  Database,
  Building,
  MessageSquare,
  Globe,
  Wand2,
  PieChart,
  Brain,
  Bot,
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  FileSearch,
  CalendarCheck,
  BadgeCheck,
  ScanSearch
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { getApiBaseUrl } from "@/lib/api-base";

import {
  connectedBusinessFlow,
  employerAiFeatures,
  employerDeepDiveModules,
  employerIntegrationGroups,
  employerMobileHighlights,
  employerModules,
  employerPlatformSignals,
  employerProblems,
  employerRoles,
  employerSolutions,
  employerTrustBand,
  type DeepDiveModule,
  type ModuleCard,
} from "./data";

const containerClass = "mx-auto max-w-[1240px] px-6";
const primaryCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#28A8DF] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(40,168,223,0.22)] transition-all hover:-translate-y-0.5 hover:bg-sky-500";
const secondaryCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50";
const demoHref =
  "mailto:support@saasab2e.com?subject=Book%20a%20SAASA%20B2E%20Employer%20Demo";
const talkHref =
  "mailto:support@saasab2e.com?subject=Talk%20to%20the%20SAASA%20B2E%20team";

const getSuggestionLabel = (suggestion: any) =>
  suggestion?.title ||
  suggestion?.name ||
  suggestion?.label ||
  suggestion?.value ||
  suggestion?.query ||
  "";

const buildExploreJobsUrl = (title: string, location: string) => {
  const params = new URLSearchParams();
  const normalizedTitle = title.trim();
  const normalizedLocation = location.trim();

  if (normalizedTitle) params.append("q", normalizedTitle);
  if (normalizedLocation) params.append("location", normalizedLocation);

  return params.toString() ? `/explore-jobs?${params.toString()}` : "/explore-jobs";
};

const employerNav = [
  { href: "#ecosystem", label: "Ecosystem" },
  { href: "#modules", label: "Modules" },
  { href: "#connected-flow", label: "Business Flow" },
  { href: "#roles", label: "Roles" },
  { href: "#integrations", label: "Readiness" },
] as const;

const heroHighlights = [
  "Recruitment, people ops, payroll, CRM, analytics, and mobile in one employer system",
  "Leadership visibility without juggling separate tools",
  "Training continuity from skill-gap signals to learning recommendations",
] as const;

const modulePersonality = {
  recruitos: {
    eyebrow: "Pipeline velocity",
    summary:
      "Approvals, AI JDs, publishing, shortlisting, interviews, invoicing, and onboarding handoff.",
    chips: ["Manager approvals", "AI shortlisting", "Interview ops"],
  },
  peoplecore: {
    eyebrow: "Workforce structure",
    summary:
      "Records, attendance, assets, leave, performance, and training continuity in one employee core.",
    chips: ["Employee 360", "Biometric + GPS", "Training records"],
  },
  payflow: {
    eyebrow: "Finance confidence",
    summary:
      "Attendance-linked payroll, reminders, compliance exports, and payslip transparency.",
    chips: ["Late mark logic", "Bonus inputs", "Tally / SAP ready"],
  },
  flowcrm: {
    eyebrow: "Conversion momentum",
    summary:
      "Lead capture, assignment, follow-up discipline, quotations, and conversion reporting.",
    chips: ["Meta + Google", "WhatsApp capture", "Quote workflows"],
  },
  commandiq: {
    eyebrow: "Executive clarity",
    summary:
      "Cross-module dashboards, attrition watch, budget alerts, skill gaps, and training ROI.",
    chips: ["Founder view", "Skill-gap signals", "Exportable reports"],
  },
} as const;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base font-medium leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function EmployerHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className={`${containerClass} flex items-center justify-between py-3.5`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/SAASA%20Logo.png"
              alt="SAASA B2E"
              width={122}
              height={34}
              className="h-8 w-auto"
            />
            <span className="hidden rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 sm:inline-flex">
              Employer Ecosystem
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {employerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950 sm:inline-flex"
          >
            Back to Job Portal
          </Link>
          <a
            href="https://employers.hryantra.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#28A8DF] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(40,168,223,0.22)] transition-all hover:-translate-y-0.5 hover:bg-sky-500"
          >
            Book Demo
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function HeroControlCenter() {
  const RecruitIcon = employerModules[0].icon;
  const PeopleIcon = employerModules[1].icon;
  const PayrollIcon = employerModules[2].icon;
  const CrmIcon = employerModules[3].icon;
  const InsightsIcon = employerModules[4].icon;

  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      <div className="absolute -left-8 top-8 h-36 w-36 rounded-full bg-sky-300/18 blur-3xl" />
      <div className="absolute -right-8 bottom-8 h-40 w-40 rounded-full bg-orange-200/24 blur-3xl" />

      <div className="relative rounded-[34px] border border-slate-200 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.11)]">
        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/90 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              SAASA Employer OS
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Hiring, people ops, payroll, CRM, analytics, and training continuity in one command view.
            </p>
          </div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            Live control
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200">
                  RecruitOS Pipeline
                </p>
                <p className="mt-1 text-lg font-bold">
                  18 open roles, 46 shortlisted, 14 interviews booked
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-sky-200">
                <RecruitIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Line manager approvals",
                  value: "6 pending",
                  tone: "bg-amber-400",
                },
                {
                  label: "Candidate matching",
                  value: "AI assisted",
                  tone: "bg-sky-400",
                },
                {
                  label: "Offer to onboarding handoff",
                  value: "4 this week",
                  tone: "bg-emerald-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                    <span className="text-sm font-medium text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      PayFlow
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      98%
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      payroll run ready
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <PayrollIcon className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      FlowCRM
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      +146
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      captured leads this week
                    </p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">
                    <CrmIcon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    CommandIQ
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-950">
                    Leadership view
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <InsightsIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Attrition risk alerts",
                    value: "2 flagged",
                    icon: PeopleIcon,
                  },
                  {
                    label: "Skill-gap watch",
                    value: "LMS ready",
                    icon: PeopleIcon,
                  },
                  {
                    label: "CRM conversion velocity",
                    value: "18% higher",
                    icon: CrmIcon,
                  },
                  {
                    label: "Budget watchlist",
                    value: "1 payroll center",
                    icon: InsightsIcon,
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <div className="flex items-center gap-2 text-slate-500">
                        <ItemIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-sky-100 bg-sky-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-sky-600 shadow-sm">
                <PeopleIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  PeopleCore
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Records, attendance, tasks, and employee actions stay synced.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
                <InsightsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Training continuity
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Skill gaps, training records, and learning prompts feed performance and analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechCircuit({ searchMode }: { searchMode: 'search' | 'ai' }) {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${
        searchMode === 'ai' ? 'opacity-40' : 'opacity-50'
      }`}
      style={{ 
        maskImage: 'radial-gradient(circle at center, transparent 15%, black 85%)',
        WebkitMaskImage: 'radial-gradient(circle at center, transparent 15%, black 85%)'
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="aiGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Circuit Lines */}
        {[
          "M0,200 L400,200 L500,100 L1440,100",
          "M0,400 L300,400 L450,550 L1000,550 L1150,400 L1440,400",
          "M0,600 L600,600 L750,450 L1440,450",
          "M0,100 L200,100 L350,250 L800,250 L950,100 L1440,100",
          "M1440,700 L1000,700 L800,500 L0,500"
        ].map((path, i) => (
          <g key={i}>
            <path d={path} stroke={searchMode === 'ai' ? '#7c2d12' : '#cbd5e1'} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path 
              key={`${searchMode}-${i}`}
              d={path} 
              stroke={searchMode === 'ai' ? '#ea580c' : '#39ade2'} 
              strokeWidth="0.6" 
              fill="none" 
              strokeDasharray="2000, 2000"
              className="animate-circuit-fill"
              filter="url(#aiGlow)"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            <circle cx={400} cy={200} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={500} cy={100} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={600} cy={600} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={750} cy={450} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function HeroSection() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<'search' | 'ai'>('search');
  const [heroSearch, setHeroSearch] = useState({ title: '', location: '' });
  const [wordIndex, setWordIndex] = useState(0);
  const [locIndex, setLocIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  const rotatingWords = ["Job Pipeline", "Candidate Profiles", "System Logs", "Market Intelligence"];
  const rotatingLocations = ["All Locations", "Hybrid Teams", "Onsite Centers", "Remote Clusters"];
  const rotatingAIPrompts = [
    "create a job for Senior Frontend Engineer in Mumbai with 15k budget",
    "draft a JD for Marketing Manager with 5 years experience",
    "generate recruitment report for Q1 hiring velocity",
    "analyze attrition risks in Tech department",
    "find best fit candidates for Java dev role from CV bank",
    "schedule interviews for HR executive shortlisted profiles"
  ];

  useEffect(() => {
    const interval = setInterval(() => setWordIndex(p => p + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => setLocIndex(p => p + 1), 3000);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (heroSearch.title.trim().length < 2 || searchMode !== "search") {
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/jobs/recommend?q=${encodeURIComponent(heroSearch.title.trim())}`);
        if (!response.ok) return;

        const result = await response.json();
        setSuggestions(result.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Employer hero recommendation fetch failed", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [heroSearch.title, searchMode]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (heroSearch.location.trim().length < 1 || searchMode !== "search") {
        setShowLocSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/jobs/location-recommend?q=${encodeURIComponent(heroSearch.location.trim())}`);
        if (!response.ok) return;

        const result = await response.json();
        setLocSuggestions(result.data || []);
        setShowLocSuggestions(true);
      } catch (error) {
        console.error("Employer hero location recommendation fetch failed", error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [heroSearch.location, searchMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchMode === "ai") {
      router.push("/login?redirect=%2Fleads");
      return;
    }

    router.push(buildExploreJobsUrl(heroSearch.title, heroSearch.location));
  };

  const applyTitleSuggestion = (value: string, shouldSearch = false) => {
    const normalizedValue = value.trim();
    setHeroSearch(prev => ({ ...prev, title: normalizedValue }));
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.setSelectionRange(normalizedValue.length, normalizedValue.length);
    });

    if (shouldSearch) {
      router.push(buildExploreJobsUrl(normalizedValue, heroSearch.location));
    }
  };

  const applyLocationSuggestion = (value: string, shouldSearch = false) => {
    const normalizedValue = value.trim();
    setHeroSearch(prev => ({ ...prev, location: normalizedValue }));
    setShowLocSuggestions(false);

    requestAnimationFrame(() => {
      locationInputRef.current?.focus();
      locationInputRef.current?.setSelectionRange(normalizedValue.length, normalizedValue.length);
    });

    if (shouldSearch) {
      router.push(buildExploreJobsUrl(heroSearch.title, normalizedValue));
    }
  };

  return (
    <section className="relative pt-12 pb-12 lg:pt-20 lg:pb-20 overflow-hidden bg-white border-b border-slate-100 flex items-center justify-center">

      <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slideAndStay {
            0% { transform: translateY(100%) rotateX(-90deg); opacity: 0; }
            14% { transform: translateY(0) rotateX(0deg); opacity: 1; }
            86% { transform: translateY(0) rotateX(0deg); opacity: 1; }
            100% { transform: translateY(-100%) rotateX(90deg); opacity: 0; }
          }
          @keyframes circuitFill {
            0% { stroke-dashoffset: 2000; }
            100% { stroke-dashoffset: 0; }
          }
          .animate-circuit-fill {
            animation: circuitFill 10s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          .rolling-text {
            display: inline-block;
            perspective: 1200px;
            height: 1.5em;
            overflow: hidden;
            vertical-align: middle;
            width: 100%;
          }
          .rolling-word {
            display: block;
            animation: slideAndStay 3s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            transform-origin: left center -10px;
            white-space: nowrap;
          }
      `}} />
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
        <TechCircuit searchMode={searchMode} />
        
        {/* Subtle modern background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(40,168,225,0.08)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />
        <div className="absolute top-0 right-1/4 -mt-[10%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 -ml-[10%] w-[600px] h-[600px] bg-sky-400/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-[12px] font-black uppercase tracking-[0.18em] text-sky-700">HR Yantra AI - Powered Job Search</span>
            </div>

            <h1 className="text-4xl md:text-[3.75rem] font-black tracking-tight text-slate-900 mb-5 leading-[1.12]">
              Find the job that<br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600">
                fits you perfectly.
              </span>
            </h1>

            <p className="text-[17px] text-slate-500 font-medium max-w-2xl leading-relaxed">
              HR Yantra AI matches you to roles that suit your skills, experience &amp; goals - so every application counts.
            </p>
          </div>

          {/* Sync Search Box Style from homepage */}
          <form 
            onSubmit={handleSearchSubmit}
            className={`w-full rounded-[32px] sm:rounded-full p-3.5 shadow-2xl ring-1 mb-14 flex flex-col sm:flex-row gap-3 relative z-20 group transition-all duration-700 ease-in-out ${
              searchMode === 'ai' 
              ? 'bg-slate-950 ring-white/10 shadow-[0_0_50px_-12px_rgba(37,99,235,0.3)]' 
              : 'bg-white/90 backdrop-blur-2xl ring-slate-900/5 shadow-[0_24px_60px_-15px_rgba(40,168,223,0.2)]'
            }`}
          >
            {searchMode === 'search' ? (
              <>
                <div className="flex-1 flex items-center bg-transparent rounded-[24px] sm:rounded-full px-6 border border-transparent focus-within:bg-slate-50/80 transition-colors min-h-[64px] relative">
                  <Search className="h-6 w-6 text-sky-500 mr-4 shrink-0 group-focus-within:scale-110 transition-transform" />
                  <div className="relative flex-1 flex items-center h-full text-left">
                    <input 
                      type="text" 
                      placeholder=""
                      ref={titleInputRef}
                      className="w-full bg-transparent border-none outline-none text-slate-900 font-semibold text-[17px] relative z-10"
                      value={heroSearch.title}
                      onChange={e => setHeroSearch({...heroSearch, title: e.target.value})}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {!heroSearch.title && (
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-semibold text-[17px] rolling-text">
                          <span key={wordIndex} className="rolling-word">{rotatingWords[wordIndex % rotatingWords.length]}</span>
                        </span>
                      </div>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-4 min-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2">
                          {suggestions.map((suggestion, index) => {
                            const suggestionLabel = getSuggestionLabel(suggestion);
                            if (!suggestionLabel) return null;

                            return (
                              <button
                                key={suggestion.id || index}
                                type="button"
                                onClick={() => applyTitleSuggestion(suggestionLabel, true)}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left"
                              >
                                <div className="flex-1 pr-4">
                                  <p className="font-bold text-slate-900 text-[16px] leading-tight">{suggestionLabel}</p>
                                  {suggestion.company && (
                                    <p className="mt-1 text-sm text-slate-500">{suggestion.company}</p>
                                  )}
                                </div>
                                {suggestion.isAiSuggestion && (
                                  <div className="flex items-center justify-center p-2 rounded-lg bg-violet-50 border border-violet-100/50">
                                    <Sparkles className="w-4 h-4 text-violet-600" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block w-[1.5px] h-12 bg-slate-200/80 my-auto rounded-full shrink-0"></div>
                <div className="flex-1 flex items-center bg-transparent rounded-[24px] sm:rounded-full px-6 border border-transparent focus-within:bg-slate-50/80 transition-colors min-h-[64px] relative">
                  <MapPin className="h-6 w-6 text-slate-400 mr-4 shrink-0 group-focus-within:text-sky-500 transition-colors" />
                  <div className="relative flex-1 flex items-center h-full text-left">
                    <input 
                      type="text" 
                      placeholder=""
                      ref={locationInputRef}
                      className="w-full bg-transparent border-none outline-none text-slate-900 font-semibold text-[17px] relative z-10"
                      value={heroSearch.location}
                      onChange={e => setHeroSearch({...heroSearch, location: e.target.value})}
                      onFocus={() => locSuggestions.length > 0 && setShowLocSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                    />
                    {!heroSearch.location && (
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-semibold text-[17px] rolling-text">
                          <span key={locIndex} className="rolling-word">{rotatingLocations[locIndex % rotatingLocations.length]}</span>
                        </span>
                      </div>
                    )}
                    {showLocSuggestions && locSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-4 min-w-[320px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2">
                          {locSuggestions.map((suggestion, index) => {
                            const suggestionLabel = getSuggestionLabel(suggestion);
                            if (!suggestionLabel) return null;

                            return (
                              <button
                                key={suggestion.id || index}
                                type="button"
                                onClick={() => applyLocationSuggestion(suggestionLabel, true)}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left"
                              >
                                <div className="flex-1 pr-4">
                                  <p className="font-bold text-slate-900 leading-tight">{suggestionLabel}</p>
                                </div>
                                {suggestion.isAi && (
                                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
               <div className="flex-1 flex flex-col justify-center px-7 min-h-[64px] relative">
                  <div className="flex items-center">
                    <div className="relative mr-5 shrink-0 flex items-center h-7">
                      {/* Gradient Masked Sparkles Icon mirroring homepage branding */}
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-600" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\'/%3E%3Cpath d=\'M5 3v4\'/%3E%3Cpath d=\'M3 5h4\'/%3E%3Cpath d=\'M21 17v4\'/%3E%3Cpath d=\'M19 19h4\'/%3E%3C/svg%3e")', maskSize: 'contain', maskRepeat: 'no-repeat' }}></div>
                      {heroSearch.title === '' && (
                        <div className="absolute -right-3 w-[2px] h-7 bg-purple-400 animate-[pulse_1s_infinite]"></div>
                      )}
                    </div>
                    <div className="relative flex-1 flex items-center h-full text-left">
                       <input 
                        type="text" 
                        className="w-full bg-transparent border-none outline-none text-white font-semibold text-[18px] relative z-10"
                        value={heroSearch.title}
                        onChange={e => setHeroSearch({...heroSearch, title: e.target.value})}
                      />
                      {!heroSearch.title && (
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                          <span className="text-slate-500 font-semibold text-[18px] rolling-text">
                            <span key={wordIndex} className="rolling-word">{rotatingAIPrompts[wordIndex % rotatingAIPrompts.length]}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            )}

            <div className="flex items-center gap-3 shrink-0 pr-1">
               <div className={`hidden sm:flex items-center rounded-full p-1 relative min-w-[160px] min-h-[64px] transition-colors duration-700 ${
                  searchMode === 'ai' ? 'bg-white/10' : 'bg-slate-100'
                }`}>
                  <div 
                    className={`absolute top-1 bottom-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-in-out ${
                      searchMode === 'search' 
                      ? 'left-1 w-[calc(50%-4px)] bg-white shadow-sm' 
                      : 'left-[calc(50%+2px)] w-[calc(50%-4px)] bg-gradient-to-br from-[#2563EB] to-[#9333EA] shadow-md'
                    }`}
                  />
                <button 
                  type="button" 
                  onClick={() => setSearchMode('search')} 
                  className={`relative z-10 flex items-center justify-center w-[50%] h-full rounded-full transition-colors ${searchMode === 'search' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}
                >
                  <Pencil className="w-5.5 h-5.5" />
                </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchMode('ai')} 
                    className={`relative z-10 flex items-center justify-center w-[50%] h-full rounded-full transition-colors ${searchMode === 'ai' ? 'text-white' : 'text-slate-500'}`}
                  >
                    <Image 
                      src="/ai2yantra-removebg.png" 
                      alt="AI" 
                      width={36} 
                      height={36} 
                      className={`object-contain transition-all ${searchMode === 'ai' ? 'brightness-0 invert' : 'brightness-0'}`} 
                    />
                  </button>
               </div>
               <button type="submit" className={`rounded-[24px] sm:rounded-full px-8 py-4 sm:py-0 font-bold text-[17px] tracking-wide transition-all duration-700 flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] shrink-0 min-h-[64px] w-full sm:w-[155px] ${searchMode === 'ai' ? 'bg-gradient-to-br from-[#2563EB] to-[#9333EA] hover:brightness-110 text-white shadow-purple-500/20' : 'bg-slate-900 hover:bg-sky-500 text-white shadow-slate-900/10'}`}>
                  {searchMode === 'ai' ? (
                    <>
                      <span>Portal</span>
                      <Image 
                        src="/ai2yantra-removebg.png" 
                        alt="AI" 
                        width={40} 
                        height={40} 
                        className="object-contain brightness-0 invert" 
                      />
                    </>
                  ) : (
                    <><Search className="w-5 h-5" /> Search</>
                  )}
               </button>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
}

function AiStatsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cards = useMemo(() => [
    {
      title: "AI Draft",
      tagline: "Job descriptions decoded",
      desc: "Generate high-impact, SEO-optimized JDs in seconds using autonomous industry-trained models.",
      icon: Wand2,
      iconColor: "bg-purple-600 shadow-purple-200",
      showArrow: false
    },
    {
      title: "MatchEngine",
      tagline: "Top talent decoded",
      desc: "Identify the perfect candidates from millions of hidden profiles with specialized precision matching.",
      icon: Brain,
      iconColor: "bg-blue-600 shadow-blue-200",
      showArrow: false
    },
    {
      title: "CommandIQ",
      tagline: "System intelligence decoded",
      desc: "Monitor your entire recruitment funnel with live visual dashboards and attrition-risk signals.",
      icon: LayoutDashboard,
      iconColor: "bg-indigo-600 shadow-indigo-200",
      showArrow: false
    },
    {
      title: "Campus Connect",
      tagline: "Fresh talent decoded",
      desc: "Plan, brand, and hire from top campuses with specialized autonomous campus hiring workflows.",
      icon: GraduationCap,
      iconColor: "bg-emerald-600 shadow-emerald-200",
      showArrow: false
    },
    {
      title: "ROI Pulse",
      tagline: "Cost efficiency decoded",
      desc: "Track cost-per-hire and agency performance with automated budget oversight and ROI analysis.",
      icon: PieChart,
      iconColor: "bg-rose-600 shadow-rose-200",
      showArrow: false
    },
    {
      title: "GlobalReach",
      tagline: "Passive talent decoded",
      desc: "Access worldwide talent pools with autonomous multi-channel job distribution and sourcing.",
      icon: Globe,
      iconColor: "bg-sky-600 shadow-sky-200",
      showArrow: false
    },
    {
      title: "SkillSense",
      tagline: "Expertise gaps decoded",
      desc: "Identify internal skill shortages and trigger automated learning paths with AI domain mapping.",
      icon: Cpu,
      iconColor: "bg-violet-600 shadow-violet-200",
      showArrow: false
    },
    {
      title: "InterviewBot",
      tagline: "Selection velocity decoded",
      desc: "Pre-screen candidates with autonomous technical assessments and selection workflows.",
      icon: Bot,
      iconColor: "bg-amber-600 shadow-amber-200",
      showArrow: false
    }
  ], []);

  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    let targetScroll = 0;
    let currentScroll = 0;
    let rafId: number;

    const handleScroll = () => {
      if (!containerRef.current || !scrollRef.current) return;
      
      const { top, height } = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate progress (0 to 1) through the sticky section
      const progress = Math.max(0, Math.min(1, -top / (height - viewportHeight)));
      
      const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      targetScroll = progress * maxScroll;
    };

    const render = () => {
      if (scrollRef.current) {
        // LERP for smooth, damped scrolling
        currentScroll += (targetScroll - currentScroll) * 0.08;
        scrollRef.current.scrollTop = currentScroll;
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('scroll', handleScroll);
    rafId = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isInView]);

  return (
    <section ref={containerRef} className="relative h-[350vh] bg-[#F8FAFC]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center border-y border-slate-100">
        <div className={`${containerClass} relative z-10 w-full`}>
          <div className="grid lg:grid-cols-[420px_1fr] gap-16 lg:gap-24 items-center">
            
            {/* Left Side: Value Prop */}
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000 self-center text-left">
              <h2 className="text-[40px] lg:text-[56px] font-semibold text-slate-900 mb-10 leading-[1.1] tracking-tight">
                Experience the <br/> one-stop solution
              </h2>

              <div className="space-y-6 mb-12">
                {[
                  "Single sign-on",
                  "Smart recommendations",
                  "24/7 AI System Support"
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-semibold text-slate-600 group-hover:text-slate-950 transition-colors">{text}</p>
                  </div>
                ))}
              </div>

              <button className="px-10 py-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:brightness-110 active:scale-[0.98] transition-all text-[17px]">
                Request demo
              </button>
            </div>

            {/* Right Side: Service Cards Grid with Sticky-Linked Scroll */}
            <div 
              ref={scrollRef}
              className="h-[80vh] overflow-hidden px-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 py-4"
            >
              <div className="grid sm:grid-cols-2 gap-6 pb-20">
                {cards.map((card, idx) => (
                  <div key={idx} className="relative group bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100/50 hover:shadow-[0_25px_60px_rgba(15,23,42,0.1)] transition-all duration-300 flex flex-col min-h-[280px]">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${card.iconColor} flex items-center justify-center text-white shadow-lg`}>
                        <card.icon className="w-7 h-7" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-slate-950 mb-1">{card.title}</h3>
                    <p className="text-[15px] font-medium text-slate-400 tracking-tight mb-4">{card.tagline}</p>
                    
                    <div className="w-full h-px bg-slate-100 mb-6"></div>
                    
                    <p className="text-[15px] font-medium leading-relaxed text-slate-500">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBandSection() {
  return (
    <section className="pb-4">
      <div className={containerClass}>
        <div className="rounded-[32px] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {employerTrustBand.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#28A8DF] shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function EcosystemCard({ module }: { module: ModuleCard }) {
  const Icon = module.icon;

  return (
    <Link
      href={`#${module.id}`}
      className="group relative block overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.09)]"
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${module.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {module.label}
          </p>
          <h3 className="mt-2 text-[1.6rem] font-black tracking-tight text-slate-950">
            {module.name}
          </h3>
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br ${module.accent} text-white shadow-lg ${module.glow}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
        {module.description}
      </p>

      <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Business outcome
        </p>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">
          {module.outcome}
        </p>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
        Explore module
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function EcosystemOverviewSection() {
  return (
    <section id="ecosystem" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <SectionHeading
          eyebrow="Ecosystem Overview"
          title="Five connected products. One employer operating layer."
          description="SAASA B2E combines hiring, workforce operations, payroll, CRM, and executive reporting so teams can move faster without stitching together separate tools."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
          {employerModules.map((module) => (
            <EcosystemCard key={module.id} module={module} />
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Training continuity
            </p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              LMS signals stay connected to performance and workforce planning.
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              Skill gaps can trigger learning recommendations, training records stay visible, and
              CommandIQ can read that growth data alongside hiring, payroll, and people operations.
            </p>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-slate-950 px-6 py-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
              Why it matters
            </p>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-200">
              Hiring, onboarding, development, payroll closure, CRM follow-through, and leadership reporting
              all stay inside the same operating story.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhyCompaniesNeedThisSection() {
  return (
    <section className="py-20">
      <div className={containerClass}>
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[36px] border border-rose-100 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-500">
              Why companies need this
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Disconnected tools create invisible operating drag.
            </h2>
            <div className="mt-7 space-y-3">
              {employerProblems.slice(0, 5).map((problem) => (
                <div
                  key={problem}
                  className="flex gap-3 rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-3.5"
                >
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <p className="text-sm font-medium leading-7 text-slate-700">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] bg-slate-950 p-8 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
              The SAASA B2E answer
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              From manpower request to payroll closure, with CRM and decision visibility built in.
            </h2>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-300">
              SAASA B2E replaces fragmented workflows with one company-facing system built for
              modern employers, HR teams, recruiters, operations leaders, payroll teams, and founders.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {employerSolutions.map((solution) => (
                <div
                  key={solution}
                  className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-300" />
                    <p className="text-sm font-medium leading-7 text-slate-200">
                      {solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {employerPlatformSignals.slice(0, 5).map((signal) => {
                const Icon = signal.icon;

                return (
                  <div
                    key={signal.label}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon className="h-4 w-4 text-sky-300" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                        {signal.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">
                      {signal.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepDiveShowcase({ module }: { module: DeepDiveModule }) {
  const Icon = module.icon;
  const personality = modulePersonality[module.id as keyof typeof modulePersonality];

  return (
    <div
      className={`rounded-[34px] border border-slate-200 bg-gradient-to-br ${module.surface} p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br ${module.accent} text-white shadow-lg`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {module.name}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Connected workflow design
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
          {module.label}
        </span>
      </div>

      <div className="mt-5 rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {personality.eyebrow}
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">
              {personality.summary}
            </p>
          </div>
          <div
            className={`hidden rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white sm:inline-flex ${module.accent}`}
          >
            {module.label}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {personality.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {module.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-xl font-black text-slate-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Workflow
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {module.workflow.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {step}
              </span>
              {index !== module.workflow.length - 1 ? (
                <MoveRight className="h-4 w-4 text-slate-400" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Operational coverage
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {module.capabilities.slice(3).map((capability) => (
              <span
                key={capability}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold tracking-[0.05em] text-slate-700"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
            AI + control note
          </p>
          <p className="mt-4 text-base font-semibold leading-8 text-white">
            {module.insight}
          </p>
          <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Business outcome
            </p>
            <p className="mt-2 text-sm font-medium leading-7 text-slate-200">
              {module.outcome}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDeepDiveSection() {
  return (
    <section id="modules" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <SectionHeading
          eyebrow="Product Deep Dive"
          title="Designed as one business system, not five isolated software tabs."
          description="Each module solves a clear business function, but the real value shows up in the handoffs: hiring into onboarding, attendance into payroll, CRM into reporting, and skill gaps into learning action."
        />

        <div className="mt-14 space-y-12">
          {employerDeepDiveModules.map((module, index) => (
            <div
              key={module.id}
              id={module.id}
              className="scroll-mt-28 grid items-center gap-8 lg:grid-cols-2"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm">
                  {module.kicker}
                </div>
                <h3 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {module.headline}
                </h3>
                <p className="mt-4 text-base font-medium leading-8 text-slate-600">
                  {module.description}
                </p>

                <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Business outcome
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">
                    {module.outcome}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {module.capabilities.slice(0, 3).map((capability) => (
                    <div
                      key={capability}
                      className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#28A8DF]" />
                        <p className="text-sm font-medium leading-7 text-slate-700">
                          {capability}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <DeepDiveShowcase module={module} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConnectedBusinessFlowSection() {
  return (
    <section id="connected-flow" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <SectionHeading
          eyebrow="Connected Business Flow"
          title="Lead to analyze. One operational chain."
          description="The ecosystem works because every module hands context forward. Demand enters, hiring closes, employees move into operations, payroll runs with live inputs, and leadership sees the whole picture in one command layer."
        />

        <div className="mt-12 rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="grid gap-3 xl:grid-cols-7">
            {connectedBusinessFlow.map((step, index) => (
              <div key={step.title} className="flex items-stretch gap-4 xl:block">
                <div className="flex min-w-[56px] flex-col items-center xl:mb-4 xl:flex-row xl:items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white shadow-lg">
                    {index + 1}
                  </div>
                  {index !== connectedBusinessFlow.length - 1 ? (
                    <div className="ml-0 mt-3 h-full w-px bg-gradient-to-b from-[#28A8DF] to-slate-200 xl:ml-4 xl:mt-0 xl:h-px xl:flex-1 xl:w-auto" />
                  ) : null}
                </div>
                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 xl:h-full">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Stage {index + 1}
                  </p>
                  <h3 className="mt-3 text-xl font-black text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-4 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
              Workforce improvement loop
            </p>
            <p className="mt-2 text-sm font-medium leading-7 text-slate-200">
              Skill-gap signals and training records can feed learning recommendations, improve employee growth visibility,
              and flow back into CommandIQ for stronger hiring and workforce decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RoleBasedControlSection() {
  return (
    <section id="roles" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[34px] bg-slate-950 p-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
              Role-based control
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              Visibility for every role. Exposure only where it belongs.
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-slate-300">
              Give owners, HR, recruiters, managers, finance, and employees the exact control they need
              without losing auditability or company data isolation.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Role-based access and functional control",
                "Founder visibility across hiring, people ops, payroll, CRM, and training signals",
                "Audit trails with company data isolation built in",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-sky-300" />
                  <p className="text-sm font-medium leading-7 text-slate-200">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {employerRoles.map((role) => {
              const Icon = role.icon;

              return (
                <article
                  key={role.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-sky-50 text-[#28A8DF] shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                    {role.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                    {role.summary}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AiLayerSection() {
  return (
    <section className="py-20">
      <div className={containerClass}>
        <div className="overflow-hidden rounded-[38px] border border-slate-200 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
              <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                AI layer
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Useful AI, not ornamental AI.
              </h2>
              <p className="mt-4 text-base font-medium leading-8 text-slate-300">
                SAASA B2E applies AI where it reduces repetitive work or improves decision quality:
                sharper JDs, faster shortlists, payroll checks, practical workforce signals, and
                learning recommendations tied to skill gaps.
              </p>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Why this feels credible
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "AI where it reduces repetitive operational work",
                    "Human approval where governance still matters",
                    "Signals tied to real workflows, records, and business outcomes",
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-300" />
                      <p className="text-sm font-medium leading-7 text-slate-200">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-7 sm:grid-cols-2 xl:grid-cols-3">
              {employerAiFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/10 text-sky-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-slate-300">
                      {feature.copy}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <SectionHeading
            eyebrow="Integrations and Readiness"
            title="Built for operations, not just demos."
            description="SAASA B2E is designed to sit inside real company workflows with communication channels, finance systems, biometric devices, mobile usage, APIs, and export-ready reporting."
          />

          <div className="rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Operational trust layer
            </p>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">
              Readiness across communication, finance, devices, and exports.
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {employerIntegrationGroups.map((group) => {
                const Icon = group.icon;

                return (
                  <article
                    key={group.title}
                    className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#28A8DF] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-950">
                      {group.title}
                    </h4>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold tracking-[0.05em] text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-950 px-5 py-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                Enterprise confidence
              </p>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-200">
                Role-based access, audit trails, company data isolation, exportable reports,
                payroll visibility, and connected mobile usage help the platform stay operationally
                credible beyond the sales narrative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MobileCompanionSection() {
  return (
    <section className="py-20">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_22px_55px_rgba(15,23,42,0.1)]">
              <div className="mx-auto w-full max-w-[17rem] rounded-[34px] border border-slate-200 bg-slate-950 p-3 shadow-2xl">
                <div className="rounded-[28px] bg-white p-4">
                  <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-200" />
                  <div className="mt-4 rounded-[24px] bg-sky-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                      Mobile companion
                    </p>
                    <p className="mt-2 text-base font-black text-slate-950">
                      Approvals, attendance, tasks, and payroll visibility anywhere.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      "Recruiter: interview slots synced",
                      "Manager: 4 leave approvals",
                      "Finance: payroll run reminder",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Mobile Companion"
              title="One connected experience across desktop and mobile."
              description="Approvals, attendance, records, payroll visibility, alerts, and self-service actions do not have to wait for someone to return to a laptop."
            />

            <div className="mt-7 grid gap-3">
              {employerMobileHighlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#28A8DF]" />
                    <p className="text-sm font-medium leading-7 text-slate-700">
                      {highlight}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section id="final-cta" className="scroll-mt-28 py-20">
      <div className={containerClass}>
        <div className="overflow-hidden rounded-[42px] border border-slate-200 bg-[linear-gradient(135deg,#eff8ff_0%,#ffffff_52%,#fff8ef_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 p-8 lg:grid-cols-[0.96fr_1.04fr] lg:p-10">
            <div className="max-w-xl">
              <div className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
                Final CTA
              </div>
              <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Give employers one connected system for hiring, operations, payroll, CRM, analytics, and learning continuity.
              </h2>
              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
                SAASA B2E is built for HR heads, recruiters, operations teams, payroll leaders,
                managers, and founders who want sharper control without juggling disconnected tools.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Recruit to payroll continuity",
                  "Role-based control",
                  "Training intelligence",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                Ready for a live walkthrough
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-tight">
                Book a demo around your employer workflow.
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "See RecruitOS, PeopleCore, PayFlow, FlowCRM, and CommandIQ in one flow",
                  "Review founder, HR, recruiter, finance, and manager visibility",
                  "Understand LMS continuity from skill gaps to learning action",
                  "Discuss integrations, mobile usage, and operational rollout",
                ].map((item) => (
                  <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-300" />
                      <p className="text-sm font-medium leading-7 text-slate-200">
                        {item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <a href={demoHref} className={primaryCtaClass}>
                  Book Demo
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href={talkHref} className={secondaryCtaClass}>
                  Talk to Our Team
                </a>
                <Link href="#ecosystem" className={secondaryCtaClass}>
                  Explore the SAASA Ecosystem
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecruitmentFlowSection() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<HTMLButtonElement>(null);

  const steps = [
    {
      icon: ClipboardList,
      label: "Requisition",
      action: "Digital intake",
      aiTag: "One-click request",
      detail: "Hiring needs are captured through a structured digital form with direct budget validation.",
      outcome: "No manual follow-ups.",
      bg: "bg-sky-500",
    },
    {
      icon: Wand2,
      label: "Intelligent JD",
      action: "AI generation",
      aiTag: "Precision drafting",
      detail: "CommandIQ drafts professional, skill-aligned job descriptions that eliminate bias.",
      outcome: "Drafted in 5 seconds.",
      bg: "bg-slate-900",
    },
    {
      icon: Globe,
      label: "Deployment",
      action: "Omnichannel publish",
      aiTag: "Global reach",
      detail: "Instantly broadcast your role to all top job boards through a single unified API.",
      outcome: "Automated distribution.",
      bg: "bg-slate-900",
    },
    {
      icon: ScanSearch,
      label: "Smart Match",
      action: "Automated ranking",
      aiTag: "Top profiles first",
      detail: "Our matching engine scores candidates to surface the best fits immediately.",
      outcome: "90% faster screening.",
      bg: "bg-slate-900",
    },
    {
      icon: FileSearch,
      label: "Assessment",
      action: "AI evaluation",
      aiTag: "Skill-based scoring",
      detail: "Objective skills assessments are automatically administered and scored.",
      outcome: "Unbiased scoring.",
      bg: "bg-slate-900",
    },
    {
      icon: CalendarCheck,
      label: "Interview",
      action: "Coordination",
      aiTag: "Auto-scheduling",
      detail: "Automated scheduling handles calendar sync and structured data capture.",
      outcome: "Zero friction booking.",
      bg: "bg-slate-900",
    },
    {
      icon: BadgeCheck,
      label: "Onboarding",
      action: "Position closed",
      aiTag: "Success secured",
      detail: "The final match is secured with digital offer management and seamless transition.",
      outcome: "Hiring complete.",
      bg: "bg-emerald-500",
      isSuccess: true,
    },
  ];

  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % steps.length);
    }, 3800);
  };

  useEffect(() => {
    if (isInView) {
      resetTimer();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isInView, active]); // restart timer when active changes or view state changes

  // Center the active step in the scrollable sidebar
  useEffect(() => {
    if (isInView && activeStepRef.current && scrollRef.current) {
      // scrollIntoView can sometimes shift the entire layout if not careful. 
      // Using manual smooth scroll of just the parent container ensures no page jump.
      const parent = scrollRef.current;
      const child = activeStepRef.current;
      const scrollPos = child.offsetTop - (parent.clientHeight / 2) + (child.clientHeight / 2);
      
      parent.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [active, isInView]);

  const s = steps[active];
  const Icon = s.icon;

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className={containerClass}>
        {/* Professional Header - Ultra Compact */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-5 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              Recruitment Intelligence
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 leading-[1.1]">
              Targeted lifecycle.<br />
              <span className="text-slate-400">Total recruitment control.</span>
            </h2>
          </div>
          <p className="text-base font-semibold text-slate-500 max-w-sm leading-relaxed md:border-l md:border-slate-200 md:pl-10">
            One connected operating system for HR leaders who demand speed and professional clarity.
          </p>
        </div>

        {/* Harmonized Grid Layout */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-10 items-center overflow-hidden">
          
          {/* Timeline Reel - Center Focus Scrolling with Correct Padding */}
          <div className="relative h-[320px] group">
            {/* Top/Bottom Fade effects */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white via-white/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />

            <div 
              ref={scrollRef}
              className="flex flex-col gap-2 h-full overflow-y-auto pl-6 pr-4 scrollbar-none py-[120px]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {steps.map((step, i) => {
                const isActive = active === i;
                return (
                  <button
                    key={step.label}
                    ref={isActive ? activeStepRef : null}
                    onClick={() => { setActive(i); resetTimer(); }}
                    className={`shrink-0 flex items-center gap-4 p-3.5 rounded-2xl text-left transition-all duration-700 ${
                      isActive 
                        ? "bg-slate-950 shadow-xl text-white scale-[1.08] z-30" 
                        : "opacity-30 scale-[0.85] grayscale hover:opacity-50 hover:grayscale-0"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isActive ? "bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-400"
                    }`}>
                      <StepIcon i={i} icon={step.icon} active={isActive} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-black tracking-widest uppercase transition-colors duration-300 truncate`}>
                        {step.label}
                      </p>
                      <p className={`text-[9.5px] font-bold mt-1 uppercase tracking-wider transition-colors ${isActive ? "text-sky-400" : "text-slate-400"}`}>
                        {step.aiTag}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Card View - Highly Compact & Professional */}
          <div className="relative h-[320px]">
             {/* Background decorative element */}
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-slate-50 rounded-full blur-3xl -z-10" />
             
            <div
              key={active}
              className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.05)] h-full animate-in fade-in zoom-in-95 duration-700 ease-out flex flex-col justify-center"
            >
              <div className="flex gap-8 items-start">
                {/* Scaled-down Icon Box */}
                <div className={`shrink-0 w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-lg transition-all duration-700 ${s.bg} shadow-slate-200/20`}>
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Phase {active + 1}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${s.bg} animate-pulse`} />
                  </div>
                  
                  {/* Professional, Unbolded/Medium Weight Title */}
                  <h3 className="text-2xl md:text-3xl font-medium text-slate-900 tracking-tight leading-tight mb-4">
                    {s.action}
                  </h3>
                  
                  <p className="text-base font-medium text-slate-500 leading-relaxed max-w-lg mb-8">
                    {s.detail}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-lg">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span className="text-[11px] font-black uppercase tracking-[0.1em]">{s.aiTag}</span>
                    </div>
                    
                    <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${s.isSuccess ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${s.isSuccess ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{s.outcome}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continuous Progress Indicator - High-Fidelity Fill */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                     Workflow Progression
                  </span>
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                     {Math.round(((active + 1) / steps.length) * 100)}% Complete
                  </div>
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-slate-900 transition-all duration-1000 ease-in-out"
                    style={{ width: `${((active + 1) / steps.length) * 100}%` }}
                  />
                  {/* Subtle phase markers */}
                  <div className="absolute top-0 left-0 w-full h-full flex justify-between px-0.5 pointer-events-none">
                    {steps.map((_, i) => (
                      <div key={i} className="w-px h-full bg-white/30" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepIcon({ i, icon: Icon, active }: { i: number, icon: any, active: boolean }) {
  return <Icon className={`w-5 h-5 transition-transform duration-500 ${active ? "scale-110" : "scale-90"}`} />;
}




function EmployerFooter() {
  return null;
}

export function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-950">
      <main>
        <HeroSection />
        <AiStatsSection />
        <RecruitmentFlowSection />
      </main>
    </div>
  );
}
