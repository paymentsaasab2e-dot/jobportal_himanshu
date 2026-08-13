'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { BlurRevealHeading } from '../BlurRevealText';
import { AppLocale, localizePath } from '@/lib/i18n';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';

export function SectionEyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={`mb-4 text-[11px] font-bold uppercase tracking-[0.22em] ${
        light ? 'text-sky-300' : 'text-sky-700'
      }`}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  lines,
  light = false,
  className = '',
}: {
  lines: Array<{ text: string; className?: string }>;
  light?: boolean;
  className?: string;
}) {
  return (
    <BlurRevealHeading
      as="h2"
      className={`text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl ${
        light ? 'text-white' : 'text-slate-900'
      } ${className}`}
      lines={lines}
    />
  );
}

export function SectionLead({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className={`mt-5 max-w-2xl text-base leading-relaxed md:text-lg ${
        light ? 'text-slate-300' : 'text-slate-600'
      }`}
    >
      {children}
    </p>
  );
}

export function SectionShell({
  id,
  children,
  className = '',
  dark = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden border-y ${
        dark ? 'border-white/10 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-900'
      } py-16 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

export function GridBackdrop({ dark = false }: { dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${
        dark
          ? 'bg-[radial-gradient(ellipse_70%_50%_at_20%_-10%,rgba(40,168,225,0.22),transparent),radial-gradient(ellipse_50%_40%_at_90%_100%,rgba(99,102,241,0.16),transparent)]'
          : 'bg-[radial-gradient(ellipse_70%_50%_at_10%_-10%,rgba(40,168,225,0.1),transparent),radial-gradient(ellipse_50%_40%_at_90%_0%,rgba(15,90,122,0.06),transparent)]'
      }`}
    />
  );
}

export function FeatureChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

export function PrimaryCtas({ className = '' }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link
        href={trialHref}
        className="inline-flex items-center gap-2 rounded-full bg-[#28A8E1] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(40,168,225,0.35)] transition hover:-translate-y-0.5"
      >
        Start Free
        <ArrowRight className="h-4 w-4" />
      </Link>
      <a
        href="#features"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        Explore Platform
      </a>
      <Link
        href={demoHref}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
      >
        Talk to Our Team
      </Link>
    </div>
  );
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
