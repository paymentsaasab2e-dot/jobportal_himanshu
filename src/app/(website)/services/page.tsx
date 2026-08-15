"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  GraduationCap,
  Mic2,
  Shield,
  Sparkles,
  Target,
  Users,
  UsersRound,
  Wallet,
  Zap,
  Lock,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AppLocale, localizePath } from "@/lib/i18n";

const styles = `
  .svc-gradient-text,
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(to right, #4f46e5, #9333ea, #db2777);
  }
  .fade-in-up {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fade-in-up.visible {
    opacity: 1;
    transform: translateY(0);
  }
  @keyframes fadeIn {
      to { opacity: 1; }
  }
  .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  .hero-bg-glow {
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(252, 252, 253, 0) 70%);
      z-index: 0;
      pointer-events: none;
  }
`;

type FeatureItem = {
  title: string;
  line: string;
  detail: string;
  icon: typeof Briefcase;
  href: string;
  requiresAuth?: boolean;
};

/** Phase 1 employee features shown on /services */
const PHASE1_FEATURES: FeatureItem[] = [
  {
    title: "Job search & apply",
    line: "Find roles and apply in one place",
    detail: "Browse live openings, filter by role and location, and apply with your profile.",
    icon: Briefcase,
    href: "/searchjobs",
    requiresAuth: false,
  },
  {
    title: "AI Resume Builder",
    line: "Build a stronger CV with AI",
    detail: "Create and improve your resume with AI guidance built for ATS and recruiters.",
    icon: Sparkles,
    href: "/lms/resume-builder",
    requiresAuth: true,
  },
  {
    title: "Mock interview AI",
    line: "Practice interviews with scoring",
    detail: "Run AI mock sessions, get feedback, and prepare for real interviews.",
    icon: Mic2,
    href: "/lms/interview-prep",
    requiresAuth: true,
  },
  {
    title: "Become an interviewer",
    line: "Conduct interviews and earn",
    detail: "Apply to become an interviewer and start taking mock interview sessions.",
    icon: Users,
    href: "/lms/interview-prep/become-interviewer",
    requiresAuth: true,
  },
  {
    title: "Courses",
    line: "Learn skills tied to hiring goals",
    detail: "Explore LMS courses published for candidates — learn and unlock premium paths.",
    icon: GraduationCap,
    href: "/courses",
    requiresAuth: false,
  },
  {
    title: "Events",
    line: "Join live career events",
    detail: "Discover workshops, webinars, and hiring events you can register for.",
    icon: CalendarDays,
    href: "/community?tab=events",
    requiresAuth: false,
  },
  {
    title: "Communities",
    line: "Connect, share, and grow",
    detail: "Join communities and feeds to network with peers, mentors, and talent circles.",
    icon: UsersRound,
    href: "/community",
    requiresAuth: true,
  },
];

const PHASE2_MODULES = [
  {
    title: "CRM & Revenue",
    items: ["Leads & follow-ups", "Client CRM", "Contacts", "Smart search"],
    icon: Target,
  },
  {
    title: "Recruitment Engine",
    items: ["AI job wizard", "Bulk CV intake", "4-pass AI matching", "Pipeline · Interviews · Placements"],
    icon: Briefcase,
  },
  {
    title: "Operations Hub",
    items: ["Command dashboard", "Reports", "Tasks & inbox", "Billing / invoices"],
    icon: BarChart3,
  },
  {
    title: "Platform & Control",
    items: ["Team + RBAC", "Portal sync (Employees)", "HQ tab/module control", "Agency or standalone"],
    icon: Shield,
  },
];

const PHASE2_AI = [
  { title: "AI Job Creation", line: "Job post in minutes from a short brief", icon: Sparkles },
  { title: "4-pass AI Matching", line: "Ranked shortlists with explainable scores", icon: Zap },
  { title: "Bulk CV parse", line: "Resume intake + duplicate detection", icon: FileText },
  { title: "Pre-screen assessments", line: "AI screening tests tied to each role", icon: ClipboardCheck },
  { title: "ARIA / Workspace brief", line: "Daily “what needs attention” AI operator", icon: Bot },
  { title: "Placement + billing", line: "Track hires, invoices, and revenue", icon: Wallet },
];

const PHASE2_PLANS = [
  { name: "Starter", line: "Small teams hiring their first roles" },
  { name: "Professional", line: "Growing hiring + HR in one workspace" },
  { name: "Enterprise", line: "Complex ops, multi-team, HQ control" },
];

function AuthInterceptModal({
  isOpen,
  onClose,
  title,
  description,
  redirectUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  redirectUrl: string;
}) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;

  if (!isOpen) return null;

  const handleContinue = () => {
    sessionStorage.setItem("postLoginRedirect", redirectUrl);
    router.push(localizePath("/whatsapp", locale));
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="services-auth-modal-title"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50">
          <Lock className="h-7 w-7 text-[#28A8DF]" />
        </div>
        <h2
          id="services-auth-modal-title"
          className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          {title}
        </h2>
        <p className="mb-8 text-center text-[15px] font-medium leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
          >
            Continue with WhatsApp Login
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authConfig, setAuthConfig] = useState({
    title: "Sign in to continue",
    description: "Log in to open this feature on your account.",
    redirectUrl: "/candidate-dashboard",
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
      entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.12 },
    );
    const els = document.querySelectorAll(".fade-in-up");
    els.forEach((el) => observer.observe(el));
    return () => els.forEach((el) => observer.unobserve(el));
  }, []);

  const openFeature = (
    href: string,
    title: string,
    requiresAuth = true,
    description = `Sign in to open ${title} and continue where you left off.`,
  ) => {
    if (isAuthLoading) return;
    const target = localizePath(href, locale);
    if (!requiresAuth || isAuthenticated) {
      router.push(target);
      return;
    }
    setAuthConfig({
      title: `Sign in for ${title}`,
      description,
      redirectUrl: target,
    });
    setIsAuthModalOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#fcfcfd] font-sans text-[#111827]">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Hero — text only (resume mockup removed) */}
      <header className="relative overflow-hidden pb-20 pt-[140px] md:pb-28 md:pt-[160px]">
        <div className="hero-bg-glow" />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6">
          <div className="w-full max-w-6xl animate-fade-in text-center opacity-0">
            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(40,168,225,0.28)] bg-white px-6 py-2.5 shadow-[0_10px_28px_rgba(40,168,225,0.18)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#28A8E1]" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1B6FA8] md:text-sm">
                HR Yantra: Connect. Value. Grow.
              </span>
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-[1.12] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              <span className="block md:whitespace-nowrap">Transforming HR into Value for</span>
              <span className="gradient-text block">Talent and Enterprise.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl">
              Where Visionary Entrepreneurs and Top Talent Connect, Grow, and Scale.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  openFeature(
                    "/candidate-dashboard",
                    "your journey",
                    true,
                    "Sign in to open your dashboard and start using HR Yantra features.",
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#9333ea] px-9 py-4 text-lg font-medium text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]"
              >
                Start Your Journey
              </button>
              <a
                href="#candidate-services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-9 py-4 text-lg font-medium shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition hover:bg-gray-100"
              >
                Explore AI Tools
                <ArrowDown className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Employee */}
      <section
        id="candidate-services"
        className="relative scroll-mt-24 overflow-hidden border-t border-slate-200/60 bg-[#F4F8FB] py-24 md:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_-10%,rgba(40,168,225,0.14),transparent),radial-gradient(ellipse_60%_40%_at_90%_0%,rgba(15,90,122,0.08),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="fade-in-up mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="h-1.5 w-10 rounded-full bg-[#28A8E1]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#176F96]">
                  Employee
                </p>
            </div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]">
                Everything employees need to{" "}
                <span className="bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A] bg-clip-text text-transparent">
                  stand out
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Phase 1 tools for your career. Signed in? We open the feature. Not signed in?
                We&apos;ll ask you to log in first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[
                "Job search",
                "Resume AI",
                "Mock interview",
                "Interviewer",
                "Courses",
                "Events",
                "Communities",
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="fade-in-up">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {PHASE1_FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => openFeature(item.href, item.title, item.requiresAuth !== false)}
                    className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white p-6 text-left shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-[#28A8E1]/40 hover:shadow-[0_28px_56px_-28px_rgba(40,168,225,0.35)]"
                  >
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#28A8E1]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F6FC] text-[#28A8E1] ring-1 ring-[#28A8E1]/15 transition group-hover:bg-[#28A8E1] group-hover:text-white">
                        <Icon className="h-5 w-5" />
                </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums text-slate-300">
                        {item.requiresAuth !== false ? (
                          <Lock className="h-3 w-3 text-slate-300 group-hover:text-[#28A8E1]" />
                        ) : null}
                        {String(index + 1).padStart(2, "0")}
                      </span>
                </div>
                    <h4 className="text-xl font-bold tracking-tight text-slate-900">{item.title}</h4>
                    <p className="mt-1.5 text-sm font-medium text-[#176F96]">{item.line}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#28A8E1]">
                      {item.requiresAuth !== false && !isAuthenticated
                        ? "Log in to open"
                        : "Open feature"}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Entrepreneurs */}
      <section
        id="employer-services"
        className="relative scroll-mt-24 overflow-hidden border-y border-slate-800/10 bg-slate-950 py-24 md:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_-10%,rgba(245,158,11,0.18),transparent),radial-gradient(ellipse_50%_40%_at_10%_20%,rgba(56,189,248,0.1),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="fade-in-up mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="h-1.5 w-10 rounded-full bg-amber-400" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  Entrepreneurs
                </p>
              </div>
              <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl md:leading-[1.1]">
                Run hiring end-to-end in{" "}
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  one workspace
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                Leads, jobs, AI matching, interviews, placements, and billing — bridged to the Employee
                portal.
              </p>
                  </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {["AI matching", "Bulk CV", "Pipeline", "Billing"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur"
                >
                  {chip}
                </span>
              ))}
                </div>
              </div>
              
          {/* Modules */}
          <div className="fade-in-up mb-16">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
                Core modules
              </h3>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/20">
                Full stack
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {PHASE2_MODULES.map((mod, index) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.title}
                    className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_48px_-32px_rgba(0,0,0,0.6)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-amber-400/35 hover:bg-white/[0.07]"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/15 opacity-0 blur-2xl transition group-hover:opacity-100" />
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20 transition group-hover:scale-105 group-hover:bg-amber-400 group-hover:text-slate-950">
                        <Icon className="h-5 w-5" />
              </div>
                      <span className="text-[10px] font-bold tabular-nums text-slate-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                </div>
                    <h3 className="text-[15px] font-bold tracking-tight text-white">{mod.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {mod.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                </div>
                );
              })}
                </div>
              </div>
              
          {/* Premium AI */}
          <div className="fade-in-up mb-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">
                  Premium AI
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 md:text-base">
                  Coin-powered tools that turn entrepreneur demos into conversions.
                </p>
              </div>
              <Link
                href="/employers"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300 transition hover:text-amber-200"
              >
                Entrepreneurs product tour
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PHASE2_AI.map((item, index) => {
                const Icon = item.icon;
                const featured = index === 0 || index === 1;
                return (
                  <div
                    key={item.title}
                    className={`group relative flex items-start gap-3.5 overflow-hidden rounded-[1.35rem] border p-5 transition duration-300 hover:-translate-y-0.5 ${
                      featured
                        ? "border-amber-400/30 bg-gradient-to-br from-amber-400/15 via-white/[0.06] to-transparent"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                        featured
                          ? "bg-amber-400 text-slate-950"
                          : "bg-white/5 text-sky-300 ring-1 ring-white/10 group-hover:bg-sky-400/20"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold tracking-tight text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.line}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plans + CTA */}
          <div className="fade-in-up grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl"
              />
              <div className="relative z-10 mb-5 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-amber-300 ring-1 ring-white/10">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Plans
                  </p>
                  <h3 className="text-xl font-black text-white">Entrepreneurs plans</h3>
                </div>
              </div>
              <div className="relative z-10 grid gap-3 sm:grid-cols-3">
                {PHASE2_PLANS.map((plan, index) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border p-4 ${
                      index === 1
                        ? "border-amber-400/40 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white">{plan.name}</p>
                      {index === 1 ? (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-950">
                          Popular
                        </span>
                      ) : null}
            </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{plan.line}</p>
          </div>
                ))}
        </div>
              <p className="relative z-10 mt-5 text-xs text-slate-500">
                Includes AI coins, HQ tab/module control, and agency vs standalone modes.
              </p>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-amber-400/30 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 p-6 text-slate-950 shadow-[0_32px_64px_-36px_rgba(245,158,11,0.55)] md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/25 blur-2xl"
              />
              <div className="relative z-10">
                <Users className="mb-3 h-7 w-7" />
                <h3 className="text-2xl font-black tracking-tight">Demo the full ATS + CRM</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-900/75">
                  AI job creation, ranked matching, bulk CV parse, placements, and billing — trial to
                  paid when you&apos;re ready.
                </p>
                </div>
              <div className="relative z-10 mt-6 flex flex-col gap-2">
                <Link
                  href="/employers"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Explore Entrepreneurs product
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/employers#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-950/15 bg-white/40 px-5 py-3 text-sm font-semibold text-slate-950 backdrop-blur transition hover:bg-white/70"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="fade-in-up grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[#28A8E1]/25 bg-gradient-to-br from-[#E8F6FC] to-white p-7 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#176F96]">
                Employees
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Unlock premium coaching when you&apos;re ready
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Start with AI CV tools and mock interviews — then upgrade with token packs and expert
                services.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href="#candidate-services"
                  className="inline-flex items-center gap-2 rounded-full bg-[#28A8E1] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Browse employee services
                </a>
            <Link
                  href="/explore-jobs"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
                  Explore jobs
            </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-7 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                Entrepreneurs
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Book a demo or start your trial
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Run leads, hiring, matching, interviews, and placements in one AI-powered ATS + CRM.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
            <Link
                  href="/employers"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
            >
                  Entrepreneurs tour
                  <GitBranch className="h-4 w-4" />
            </Link>
                <a
                  href="#employer-services"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  See Entrepreneurs
                </a>
              </div>
            </div>
          </div>

          <p className="fade-in-up mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
            <Award className="h-3.5 w-3.5" />
            HRYantra by SAASA B2E · Connect. Value. Grow.
          </p>
        </div>
      </section>
      <AuthInterceptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authConfig.title}
        description={authConfig.description}
        redirectUrl={authConfig.redirectUrl}
      />
    </div>
  );
}
