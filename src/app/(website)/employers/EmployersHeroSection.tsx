"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { BlurRevealHeading } from "./BlurRevealText";
import { EmployersDashboardPreview } from "./EmployersDashboardPreview";
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from "@/lib/employers/constants";
import { AppLocale, localizePath } from "@/lib/i18n";

const EMPLOYERS_LOGIN_HREF = "https://employers.hryantra.com/login?redirect=%2Fleads";

const heroGradientCharStyle: React.CSSProperties = {
  background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export function EmployersHeroSection() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-start overflow-x-hidden bg-black px-4 pb-20 pt-24 text-white sm:px-6 md:pb-24 md:pt-28">

      <aside className="mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
        <span className="whitespace-nowrap text-center text-xs text-slate-300">
          SAASA B2E Employer OS — hiring, HR, payroll & CRM in one platform
        </span>
        <a
          href="#overview"
          className="flex items-center gap-1 whitespace-nowrap text-xs text-sky-300/90 transition-all hover:text-white active:scale-95"
          aria-label="Explore the employer platform overview"
        >
          Explore platform
          <ArrowRight size={12} />
        </a>
      </aside>

      <BlurRevealHeading
        as="h1"
        triggerOnView={false}
        className="mb-6 flex w-full max-w-7xl flex-col items-center gap-0 px-4 text-center text-[clamp(2.125rem,5.8vw,4.75rem)] font-semibold leading-none tracking-[-0.04em]"
        lines={[
          {
            text: "Your entire hiring & HR operations",
            lineClassName: "whitespace-nowrap",
            charStyle: { ...heroGradientCharStyle, letterSpacing: "-0.05em" },
          },
          {
            text: "powered by AI",
            lineClassName: "whitespace-nowrap -mt-1 sm:-mt-2",
            charStyle: { ...heroGradientCharStyle, letterSpacing: "-0.05em" },
          },
        ]}
      />

      <p className="mb-10 max-w-2xl px-4 text-center text-sm text-slate-300 md:text-base">
        From hiring the right candidate to managing payroll and performance — automate everything
        in one unified employer platform.
      </p>

      <div className="relative z-10 mb-14 flex flex-col items-center gap-4 sm:flex-row">
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
          className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-white/35 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-[#28a8e1] hover:bg-[#08428c]/25 hover:text-white active:scale-95"
        >
          Sign in to employer portal
        </a>
      </div>

      <div className="relative mx-auto w-full max-w-[min(100%,1280px)] px-3 pb-12 sm:px-5">
        <div
          className="pointer-events-none absolute left-1/2 z-0 w-full max-w-6xl"
          style={{
            top: "-18%",
            transform: "translateX(-50%)",
          }}
          aria-hidden="true"
        >
          <img
            src="https://i.postimg.cc/Ss6yShGy/glows.png"
            alt=""
            className="h-auto w-full"
            loading="eager"
          />
        </div>

        <div className="relative z-10">
          <EmployersDashboardPreview />
        </div>
      </div>
    </section>
  );
}
