'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import {
  automationNodes,
  brainNodes,
  featuresByCategory,
  highlightFeatures,
  opsMetrics,
} from '../employersPhase2Features';
import {
  GridBackdrop,
  SectionEyebrow,
  SectionHeading,
  SectionLead,
  SectionShell,
  usePrefersReducedMotion,
} from './_shared';

export function EmployersAIIntelligenceSection() {
  const features = highlightFeatures('ai', 10);

  return (
    <SectionShell id="ai" className="bg-[#F4F7FB]">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>AI Intelligence</SectionEyebrow>
          <SectionHeading lines={[{ text: 'Meet the Intelligence Behind HRYantra.' }]} />
          <SectionLead>
            AI doesn&apos;t just assist your team. It understands your recruitment workflow — from job
            creation and CV parsing to matching, briefs, and behaviour intelligence.
          </SectionLead>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group rounded-[1.5rem] border border-indigo-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersAIBrainVisualization() {
  const reduced = usePrefersReducedMotion();
  const [line, setLine] = useState(0);
  const consoleLines = [
    { role: 'user', text: 'Show me candidates ready for the Mumbai Java Developer role.' },
    { role: 'ai', text: '14 candidates match your requirements.' },
    { role: 'ai', text: '3 have completed interviews.' },
    { role: 'ai', text: '2 are ready for client review.' },
  ] as const;

  useEffect(() => {
    if (reduced) {
      setLine(consoleLines.length);
      return;
    }
    const timer = window.setInterval(() => {
      setLine((prev) => (prev >= consoleLines.length ? 1 : prev + 1));
    }, 2200);
    return () => window.clearInterval(timer);
  }, [reduced, consoleLines.length]);

  return (
    <SectionShell id="brain" dark className="bg-slate-950">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>HRYantra Brain</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'Your Recruitment Business Has a Brain.' }]} />
          <SectionLead light>
            A living intelligence layer connected to candidates, jobs, leads, clients, interviews,
            placements, revenue, activities, and documents.
          </SectionLead>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto flex min-h-[360px] w-full max-w-xl items-center justify-center">
            <div
              aria-hidden
              className={`absolute inset-[18%] rounded-full border border-indigo-400/30 ${
                reduced ? '' : 'animate-pulse'
              }`}
            />
            <div className="absolute z-20 flex h-36 w-36 flex-col items-center justify-center rounded-full border border-indigo-300/40 bg-indigo-500/20 text-center shadow-[0_0_60px_rgba(99,102,241,0.35)] backdrop-blur">
              <Bot className="mb-2 h-8 w-8 text-indigo-200" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
                HRYantra Brain
              </span>
            </div>
            {brainNodes.map((node, index) => {
              const angle = (index / brainNodes.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 40;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              return (
                <div
                  key={node}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-100 backdrop-blur"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {node}
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-5 font-mono text-sm shadow-2xl backdrop-blur md:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Live AI console
              </span>
            </div>
            <div className="space-y-3 min-h-[220px]">
              <AnimatePresence mode="popLayout">
                {consoleLines.slice(0, line).map((item) => (
                  <motion.div
                    key={item.text}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={item.role === 'user' ? 'text-sky-300' : 'text-emerald-300'}
                  >
                    <span className="mr-2 text-slate-500">{item.role === 'user' ? 'You' : 'AI'} ›</span>
                    {item.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersOperationsHubSection() {
  return (
    <SectionShell id="operations" className="bg-white">
      <GridBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionEyebrow>Operations Hub</SectionEyebrow>
            <SectionHeading lines={[{ text: 'Run the Business. Not Just Recruitment.' }]} />
            <SectionLead>
              Dashboards, reports, tasks, calendar, inbox, billing, portal events, approvals, and
              global search — so operators stay ahead of the work, not buried by it.
            </SectionLead>
            <div className="mt-8 flex flex-wrap gap-2">
              {featuresByCategory('operations')
                .filter((f) => f.highlight || ['portal-events', 'activity-feed', 'approvals', 'global-search', 'help-center'].includes(f.id))
                .map((f) => (
                  <span
                    key={f.id}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800"
                  >
                    {f.title}
                  </span>
                ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl md:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300">
              Command center
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {opsMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center"
                >
                  <p className="text-xl font-black text-white">{metric.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export function EmployersAutomationSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <SectionShell id="automation" dark className="bg-[#070B14]">
      <GridBackdrop dark />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow light>Automation</SectionEyebrow>
          <SectionHeading light lines={[{ text: 'Let Your Workflow Run Itself.' }]} />
          <SectionLead light>
            From new lead to invoice, HRYantra connects assignment, follow-ups, matching, interviews,
            client review, placement, and billing into one continuous operating path.
          </SectionLead>
        </div>

        <div className="mt-12 overflow-x-auto pb-2">
          <div className="mx-auto grid min-w-[720px] grid-cols-3 gap-3 md:min-w-0 md:grid-cols-4 lg:grid-cols-6">
            {automationNodes.map((node, index) => (
              <motion.div
                key={node}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-4 text-center"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-100">{node}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
