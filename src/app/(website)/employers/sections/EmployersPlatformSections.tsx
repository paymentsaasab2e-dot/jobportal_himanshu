'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  crmPipelineSteps,
  ecosystemNodes,
  featuresByCategory,
  highlightFeatures,
  moduleIconStrip,
  phase2Stats,
  platformStripItems,
  recruitmentPipelineSteps,
} from '../employersPhase2Features';
import {
  FeatureChip,
  GridBackdrop,
  SectionEyebrow,
  SectionHeading,
  SectionLead,
  SectionShell,
  usePrefersReducedMotion,
} from './_shared';

export function EmployersPlatformStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 py-5 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
          One Platform. Every Recruitment Workflow.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {platformStripItems.map((item) => (
            <span
              key={item}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EmployersPlatformOverview() {
  const [active, setActive] = useState(ecosystemNodes[0].id);
  const reduced = usePrefersReducedMotion();

  const relatedCategory =
    active === 'admin'
      ? 'platform'
      : active === 'analytics'
        ? 'operations'
        : active === 'billing'
          ? 'operations'
          : active === 'automation'
            ? 'automation'
            : (active as 'crm' | 'recruitment' | 'ai' | 'operations');

  const related = highlightFeatures(relatedCategory, 5);

  return (
    <SectionShell id="overview" className="bg-[#F7FAFC]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Platform Overview</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Everything Your Recruitment Business Needs.' }, { text: 'In One Workspace.' }]} />
          <SectionLead>
            HRYantra Phase 2 combines CRM, recruitment, AI, operations, analytics, and automation in a
            single employer workspace — without stitching five tools together.
          </SectionLead>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto flex aspect-square w-full max-w-lg items-center justify-center">
            <div
              aria-hidden
              className={`absolute inset-[12%] rounded-full border border-dashed border-slate-300 ${
                reduced ? '' : 'animate-[spin_50s_linear_infinite]'
              }`}
            />
            <div className="absolute z-20 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">HRYantra</span>
              <span className="mt-1 text-xs text-slate-500">OS Core</span>
            </div>
            {ecosystemNodes.map((node, index) => {
              const angle = (index / ecosystemNodes.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 42;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              const Icon = node.icon;
              const isActive = active === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setActive(node.id)}
                  onFocus={() => setActive(node.id)}
                  onClick={() => setActive(node.id)}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 shadow-md transition ${
                    isActive
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{node.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
              {ecosystemNodes.find((n) => n.id === active)?.label} capabilities
            </p>
            <ul className="mt-5 space-y-3">
              {related.map((feature) => (
                <li
                  key={feature.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <p className="text-sm font-bold text-slate-900">{feature.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {phase2Stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center">
                  <stat.icon className="mx-auto mb-1 h-4 w-4 text-sky-600" />
                  <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {moduleIconStrip.map((mod) => (
            <FeatureChip key={mod.label}>
              <mod.icon className="mr-1.5 inline h-3.5 w-3.5 text-sky-600" />
              {mod.label}
            </FeatureChip>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersCRMRevenueSection() {
  const features = featuresByCategory('crm');
  const reduced = usePrefersReducedMotion();

  return (
    <SectionShell id="crm" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionEyebrow>CRM & Revenue</SectionEyebrow>
            <SectionHeading lines={[{ text: 'Turn Every Lead Into Revenue.' }]} />
            <SectionLead>
              From first contact to client conversion, HRYantra gives your recruitment team a complete
              revenue workflow — including agreements, KYC parsing, and AI-assisted CRM updates.
            </SectionLead>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.filter((f) => f.highlight || ['public-lead-forms', 'agreements', 'kyc-ai', 'dup-detection'].includes(f.id)).slice(0, 8).map((f) => (
                <div key={f.id} className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl md:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">
              Revenue pipeline
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {crmPipelineSteps.map((step, index) => (
                <React.Fragment key={step}>
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold"
                  >
                    {step}
                  </motion.div>
                  {index < crmPipelineSteps.length - 1 ? (
                    <span className="self-center text-slate-500">→</span>
                  ) : null}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {[
                { label: 'Open leads', value: '42' },
                { label: 'Meetings this week', value: '11' },
                { label: 'Clients converted', value: '6' },
                { label: 'Agreements pending', value: '3' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <span className="text-lg font-black text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersRecruitmentEngineSection() {
  const highlights = highlightFeatures('recruitment', 10);
  const reduced = usePrefersReducedMotion();

  return (
    <SectionShell id="recruitment" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Recruitment Engine</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'From Job Creation to Placement.' }]} />
          <SectionLead light>
            Run your complete recruitment lifecycle from a single intelligent engine — jobs, AI matching,
            assessments, interviews, client review, and placements.
          </SectionLead>
        </div>

        <div className="mt-12 overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-2">
            {recruitmentPipelineSteps.map((step, index) => (
              <React.Fragment key={step}>
                <motion.div
                  initial={reduced ? false : { opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-center"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-200">{step}</p>
                </motion.div>
                {index < recruitmentPipelineSteps.length - 1 ? (
                  <span className="text-slate-500">↓</span>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((feature) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:bg-white/[0.08]"
            >
              <p className="text-sm font-bold text-white">{feature.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
