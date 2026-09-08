"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { BlurRevealHeading } from "./BlurRevealText";
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from "@/lib/employers/constants";
import { AppLocale, localizePath } from "@/lib/i18n";

const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fdashboard";

const heroAccentStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #0ea5e9 0%, #3b82f6 50%, #4f46e5 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.05em",
};

function EmployersHeroCircuit() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50"
      aria-hidden="true"
      style={{
        maskImage: "radial-gradient(circle at center, transparent 15%, black 85%)",
        WebkitMaskImage: "radial-gradient(circle at center, transparent 15%, black 85%)",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <filter id="employersHeroCircuitGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[
          "M0,200 L400,200 L500,100 L1440,100",
          "M0,400 L300,400 L450,550 L1000,550 L1150,400 L1440,400",
          "M0,600 L600,600 L750,450 L1440,450",
          "M0,100 L200,100 L350,250 L800,250 L950,100 L1440,100",
          "M1440,700 L1000,700 L800,500 L0,500",
        ].map((path, i) => (
          <g key={path}>
            <path d={path} stroke="#cbd5e1" strokeWidth="0.3" fill="none" opacity="0.15" />
            <path
              d={path}
              stroke="#39ade2"
              strokeWidth="0.6"
              fill="none"
              strokeDasharray="2000, 2000"
              className="employers-hero-circuit-fill"
              filter="url(#employersHeroCircuitGlow)"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            <circle cx={400} cy={200} r="1.5" fill="#39ade2" opacity="0.3" />
            <circle cx={500} cy={100} r="1.5" fill="#39ade2" opacity="0.3" />
            <circle cx={600} cy={600} r="1.5" fill="#39ade2" opacity="0.3" />
            <circle cx={750} cy={450} r="1.5" fill="#39ade2" opacity="0.3" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function EmployersHeroSection() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);

  return (
    <section className="relative flex flex-col items-center justify-start overflow-hidden bg-white px-4 pb-16 pt-24 text-slate-900 sm:px-6 md:pb-20 md:pt-28">
      <style>{`
        @keyframes employersHeroCircuitFill {
          0% { stroke-dashoffset: 2000; }
          100% { stroke-dashoffset: 0; }
        }
        .employers-hero-circuit-fill {
          animation: employersHeroCircuitFill 10s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>
      <EmployersHeroCircuit />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(40,168,225,0.08)_0%,rgba(255,255,255,0)_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-0 right-1/4 -mt-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 -ml-[10%] h-[600px] w-[600px] rounded-full bg-sky-400/10 blur-[150px]"
        aria-hidden="true"
      />

      <aside className="relative z-10 mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-sky-200/80 bg-gradient-to-r from-sky-50 to-indigo-50 px-4 py-2 shadow-sm">
        <span className="flex h-2 w-2 shrink-0 rounded-full bg-sky-500 animate-pulse" />
        <span className="whitespace-nowrap text-center text-[12px] font-black uppercase tracking-[0.18em] text-sky-700">
          HR Yantra: An AI-driven HRMS ecosystem, just a click away
        </span>
        <a
          href="#overview"
          className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-sky-700 transition-all hover:text-indigo-600 active:scale-95"
          aria-label="Explore the employer platform overview"
        >
          Explore platform
          <ArrowRight size={12} />
        </a>
      </aside>

      <BlurRevealHeading
        as="h1"
        triggerOnView={false}
        className="relative z-10 mb-6 flex w-full max-w-7xl flex-col items-center gap-0 px-4 text-center text-[clamp(2.125rem,5.8vw,4.75rem)] font-black leading-none tracking-[-0.04em]"
        lines={[
          {
            text: "Hire smarter. Pay faster.",
            lineClassName: "whitespace-nowrap",
            charStyle: heroAccentStyle,
          },
          {
            text: "Manage effortlessly.",
            lineClassName: "whitespace-nowrap -mt-1 sm:-mt-2",
            charStyle: heroAccentStyle,
          },
        ]}
      />

      <p className="relative z-10 mb-10 max-w-2xl px-4 text-center text-sm font-medium leading-relaxed text-slate-500 md:text-base">
        HR Yantra powers your CRM, talent acquisition, payroll, and employee lifecycle with
        intelligent AI automation—all at the click of a button.
      </p>

      <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href={trialHref}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[#FC9620] bg-linear-to-r from-[#E8770E] to-[#FC9620] px-8 text-base font-semibold text-white shadow-[0_8px_28px_rgba(252,150,32,0.35)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
          aria-label="Try it free"
        >
          Try it free
          <ArrowRight size={16} />
        </Link>
        <Link
          href={demoHref}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-[#28a8e1] bg-linear-to-r from-[#08428c] to-[#28a8e1] px-8 text-base font-semibold text-white shadow-[0_8px_28px_rgba(40,168,225,0.35)] backdrop-blur-sm transition-all hover:scale-105 hover:border-[#5bc4ef] hover:shadow-[0_12px_32px_rgba(40,168,225,0.45)] active:scale-95"
          aria-label="Request a demo"
        >
          Request Demo
          <ArrowRight size={16} />
        </Link>
        <a
          href={EMPLOYERS_LOGIN_HREF}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-sky-200 bg-white/80 px-6 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-400 hover:bg-sky-50 hover:text-indigo-700 active:scale-95"
        >
          Sign in to Entrepreneurs Portal
        </a>
      </div>
    </section>
  );
}
