'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Coins, Search, ShieldCheck } from 'lucide-react';
import {
  aiCoinsDemo,
  featuresByCategory,
  liveFeedItems,
  phase2Categories,
  phase2Features,
  productModes,
  securityItems,
} from '../employersPhase2Features';
import {
  GridBackdrop,
  SectionEyebrow,
  SectionHeading,
  SectionLead,
  SectionShell,
  usePrefersReducedMotion,
} from './_shared';
import { AppLocale, localizePath } from '@/lib/i18n';
import { EMPLOYERS_DEMO_PATH, EMPLOYERS_TRIAL_PATH } from '@/lib/employers/constants';

export function EmployersPlatformControlSection() {
  const features = featuresByCategory('platform');

  return (
    <SectionShell id="platform" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Platform & Control</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Enterprise Control Without Enterprise Complexity.' }]} />
          <SectionLead>
            Teams, RBAC, departments, alerts, AI coins, portal bridge, and HQ module packaging — so
            founders and operators stay in control as the business scales.
          </SectionLead>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
              <p className="text-sm font-bold text-slate-900">{feature.title}</p>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersAICoinsSection() {
  return (
    <SectionShell id="ai-coins" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionEyebrow light>AI Coins</SectionEyebrow>
            <SectionHeading light lines={[{ text: 'AI That Scales With Your Business.' }]} />
            <SectionLead light>
              Metered AI usage with a tenant coin wallet — CV parsing, job generation, matching, and
              document analysis. Buy coins, review usage, and keep spend visible.
            </SectionLead>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Buy AI Coins', 'Usage Analytics', 'Set Usage Limits', 'View Cost'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-200">
                  AI Coins Balance
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {aiCoinsDemo.balance.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-400/20 p-3 text-indigo-200">
                <Coins className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {aiCoinsDemo.usage.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"
                >
                  <div className="flex items-center gap-2 text-slate-300">
                    <row.icon className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">{row.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{row.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Illustrative usage view. Live wallet balances and pack pricing come from your tenant and
              HQ configuration.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersProductModesSection() {
  const [mode, setMode] = useState<'agency' | 'standalone'>('agency');
  const active = productModes[mode];

  return (
    <SectionShell id="modes" className="bg-[#F7FAFC]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Product Modes</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Built for Every Recruitment Business Model.' }]} />
          <SectionLead>
            Switch between agency and standalone employer modes without rebuilding your operating
            system.
          </SectionLead>
        </div>

        <div className="mx-auto mt-8 flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(['agency', 'standalone'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                mode === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {productModes[key].title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-8 max-w-4xl rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm md:p-10"
          >
            <h3 className="text-2xl font-black text-slate-900">{active.title}</h3>
            <p className="mt-3 text-slate-600">{active.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {active.points.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  {point}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}

export function EmployersLiveCommandCenter() {
  const reduced = usePrefersReducedMotion();

  return (
    <SectionShell id="live" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Live Command Center</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'See Your Recruitment Business in Real Time.' }]} />
          <SectionLead light>
            HRYantra is an active operating system — not a static database. Activity, matching, and
            placements keep moving while your team works.
          </SectionLead>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {liveFeedItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={reduced ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-sm font-semibold text-white">{item.text}</span>
              </div>
              <span className="text-xs text-slate-400">{item.ago}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersSmartSearchDemo() {
  return (
    <SectionShell id="smart-search" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>Smart Search</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Ask Your Recruitment Data Anything.' }]} />
          <SectionLead>
            Natural language becomes structured filters — combining Smart Search, location
            intelligence, and AI matching.
          </SectionLead>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl md:p-8">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <Search className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
            <p className="text-sm leading-relaxed text-slate-100 md:text-base">
              Find senior Java developers in Mumbai available for interview this week.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              'Experience: Senior',
              'Skill: Java',
              'Location: Mumbai',
              'Availability: This Week',
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-100"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Results</p>
              <p className="mt-1 text-3xl font-black text-white">24 Candidates</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-slate-400">AI Match</p>
              <p className="mt-1 text-3xl font-black text-emerald-300">92%</p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersFeatureExplorer() {
  const [active, setActive] = useState(phase2Categories[0].id);
  const features = useMemo(() => featuresByCategory(active), [active]);

  return (
    <SectionShell id="features" className="bg-[#F4F7FB]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Feature Explorer</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Explore the Full Phase 2 Workspace.' }]} />
          <SectionLead>
            {phase2Features.filter((f) => f.available).length}+ capabilities organized by product
            pillar. Browse by category — no endless wall of identical cards.
          </SectionLead>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {phase2Categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                active === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <p className="text-sm font-semibold text-slate-500">
            {phase2Categories.find((c) => c.id === active)?.tagline}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{feature.title}</p>
                  {feature.highlight ? (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      Core
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersHQEnterpriseSection() {
  const features = featuresByCategory('hq');

  return (
    <SectionShell id="enterprise" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>HQ & Enterprise</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'One Platform. Multiple Organizations.' }]} />
          <SectionLead light>
            Multi-tenant HQ for companies, tickets, plans, AI costs, coin packs, and module packaging.
          </SectionLead>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-bold text-white">{feature.title}</p>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersSecuritySection() {
  return (
    <SectionShell id="security" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionEyebrow>Security & Control</SectionEyebrow>
              <SectionHeading
                className="!text-3xl md:!text-4xl"
                lines={[{ text: 'Trust Built Into the Workspace.' }]}
              />
            </div>
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {securityItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersEcosystemSection() {
  return (
    <SectionShell id="ecosystem" className="bg-[#F7FAFC]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
        <SectionEyebrow>Product Ecosystem</SectionEyebrow>
        <SectionHeading lines={[{ text: 'CRM. ATS. AI. Operations. One OS.' }]} />
        <SectionLead>
          Leads, clients, candidates, jobs, interviews, placements, billing, analytics, automation,
          and administration connect through HRYantra — not through spreadsheet glue.
        </SectionLead>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {[
            'CRM',
            'ATS',
            'AI',
            'Candidates',
            'Clients',
            'Jobs',
            'Interviews',
            'Placements',
            'Billing',
            'Analytics',
            'Automation',
            'Administration',
          ].map((node) => (
            <span
              key={node}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm"
            >
              {node}
            </span>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersFinalCTA() {
  const locale = useLocale() as AppLocale;
  const trialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  return (
    <SectionShell id="cta" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
        <SectionEyebrow light>Get Started</SectionEyebrow>
        <SectionHeading light lines={[{ text: 'Build a Smarter Recruitment Business With HRYantra.' }]} />
        <SectionLead light>
          Bring your leads, clients, candidates, jobs, interviews, placements, and AI workflows into
          one intelligent workspace.
        </SectionLead>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={trialHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#28A8E1] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_40px_rgba(40,168,225,0.4)] transition hover:-translate-y-0.5"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore HRYantra
          </a>
          <Link
            href={demoHref}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Talk to Our Team
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
