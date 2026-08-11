"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Linkedin,
  Mic2,
  ScanSearch,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

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

const PHASE1_CORE = [
  { title: "Job search & apply", line: "Find roles and apply in one place", icon: Briefcase },
  { title: "Candidate dashboard", line: "Track applications, views, and progress", icon: LayoutDashboard },
  { title: "Profile + CV upload", line: "Build a recruiter-ready profile", icon: FileText },
  { title: "AI Resume Builder", line: "Improve resume sections with AI", icon: Sparkles },
  { title: "ATS check", line: "See how ATS-friendly your CV is", icon: ScanSearch },
  { title: "Job match", line: "Roles that fit your skills", icon: Target },
  { title: "LMS / courses", line: "Learn skills tied to hiring goals", icon: GraduationCap },
  { title: "Mock interview AI", line: "Practice interviews with scoring", icon: Mic2 },
];

const PHASE1_PREMIUM = [
  {
    title: "AI Resume Review",
    detail: "ATS score, keyword gaps, and actionable improvement tips.",
    badge: "Best starter",
    href: "/services/ai-resume-review",
    icon: ScanSearch,
  },
  {
    title: "Job-Specific CV Optimization",
    detail: "Tailor your CV to one job description for higher match scores.",
    badge: "High convert",
    href: "/services/job-specific-cv-optimization",
    icon: Target,
  },
  {
    title: "Mock Interview",
    detail: "AI or expert practice sessions with structured feedback.",
    badge: "Interview bait",
    href: "/services/mock-interview",
    icon: Mic2,
  },
  {
    title: "LinkedIn Optimization",
    detail: "Stronger headline, about section, and recruiter visibility.",
    badge: "Profile boost",
    href: "/services/linkedin-profile-optimization",
    icon: Linkedin,
  },
  {
    title: "Skill Assessment",
    detail: "Scorecard, strengths/weaknesses, and a learning path.",
    badge: "Readiness",
    href: "/services/skill-assessment",
    icon: ClipboardCheck,
  },
  {
    title: "Premium / Certified Courses",
    detail: "Unlock premium and certified LMS paths with token packs.",
    badge: "Learning upsell",
    href: "/services/upskilling-certification",
    icon: GraduationCap,
  },
  {
    title: "Resume Writing Upgrade",
    detail: "Expert rewrite with revisions — highest-ticket candidate service.",
    badge: "Highest ticket",
    href: "/services/resume-writing-upgrade",
    icon: FileText,
  },
];

const TOKEN_PACKS = [
  { name: "Starter", line: "Light resume tools & LMS unlocks", price: "Entry" },
  { name: "Plus", line: "Interview prep + course unlocks", price: "Popular" },
  { name: "Pro", line: "Mock sessions + certified courses", price: "Power" },
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

export default function ServicesPage() {
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
              <Link
                href="/whatsapp"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#9333ea] px-9 py-4 text-lg font-medium text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]"
              >
                Start Your Journey
              </Link>
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
                Free product tools to get started — then unlock premium services when you&apos;re ready
                to convert interviews.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {["ATS score", "Mock interview", "CV upgrade", "Courses"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Core free bait */}
          <div className="fade-in-up mb-16">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                Core features
              </h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                Included free
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PHASE1_CORE.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#28A8E1]/35 hover:shadow-[0_24px_48px_-28px_rgba(40,168,225,0.45)]"
                  >
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#28A8E1]/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8F6FC] to-white text-[#28A8E1] ring-1 ring-[#28A8E1]/15 transition group-hover:scale-105 group-hover:from-[#28A8E1] group-hover:to-[#1A86B3] group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-slate-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold tracking-tight text-slate-900">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.line}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium services */}
          <div className="fade-in-up mb-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                  Premium services
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 md:text-base">
                  High-intent offerings employees unlock when they&apos;re ready to convert.
                </p>
              </div>
              <Link
                href="/services/ai-resume-review"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#176F96] transition hover:text-[#28A8E1]"
              >
                Browse catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PHASE1_PREMIUM.map((svc, index) => {
                const Icon = svc.icon;
                const featured = index === 0 || index === 6;
                return (
                  <Link
                    key={svc.title}
                    href={svc.href}
                    className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] border p-6 transition duration-300 hover:-translate-y-1 ${
                      featured
                        ? "border-[#28A8E1]/35 bg-gradient-to-br from-[#0F5A7A] via-[#176F96] to-[#28A8E1] text-white shadow-[0_28px_56px_-32px_rgba(15,90,122,0.7)]"
                        : "border-slate-200/90 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] hover:border-[#28A8E1]/40 hover:shadow-[0_28px_56px_-28px_rgba(40,168,225,0.35)]"
                    }`}
                  >
                    {!featured ? (
                      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#28A8E1]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                    ) : null}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                          featured
                            ? "bg-white/15 text-white ring-1 ring-white/25"
                            : "bg-[#E8F6FC] text-[#28A8E1] ring-1 ring-[#28A8E1]/15 group-hover:bg-[#28A8E1] group-hover:text-white"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          featured
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : "bg-[#E8F6FC] text-[#176F96] ring-1 ring-[#28A8E1]/15"
                        }`}
                      >
                        {svc.badge}
                      </span>
                    </div>
                    <h4
                      className={`text-xl font-bold tracking-tight ${
                        featured ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {svc.title}
                    </h4>
                    <p
                      className={`mt-2 flex-1 text-sm leading-relaxed ${
                        featured ? "text-white/80" : "text-slate-600"
                      }`}
                    >
                      {svc.detail}
                    </p>
                    <span
                      className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
                        featured ? "text-white" : "text-[#28A8E1]"
                      }`}
                    >
                      View service
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Token packs */}
          <div className="fade-in-up relative overflow-hidden rounded-[1.75rem] border border-[#28A8E1]/20 bg-slate-950 p-6 text-white shadow-[0_32px_64px_-36px_rgba(15,23,42,0.55)] md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#28A8E1]/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl"
            />
            <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7DD3FC]">
                  Token packs
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">Upsell ladder</h3>
                <p className="mt-2 max-w-lg text-sm text-slate-300">
                  Unlock AI CV edits, ATS checks, mock interviews, and premium courses.
                </p>
              </div>
              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-[#E8F6FC]"
              >
                See packs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative z-10 grid gap-3 md:grid-cols-3">
              {TOKEN_PACKS.map((pack, index) => (
                <div
                  key={pack.name}
                  className={`rounded-2xl border p-5 backdrop-blur ${
                    index === 1
                      ? "border-[#28A8E1]/50 bg-[#28A8E1]/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">{pack.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        index === 1
                          ? "bg-[#28A8E1] text-white"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {pack.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{pack.line}</p>
                </div>
              ))}
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
    </div>
  );
}
