'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Minus, X } from 'lucide-react';
import { BlurRevealHeading } from './BlurRevealText';
import {
  hrmsComparisonRows,
  phase2FeatureCategories,
  phase2ModuleIcons,
  phase2Stats,
} from './employersPhase2Features';

function CompareCell({ value }: { value: boolean | 'partial' }) {
  if (value === true) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === 'partial') {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <X className="h-4 w-4" strokeWidth={2.5} />
    </span>
  );
}

export function EmployersPhase2FeaturesSection() {
  const [activeCategory, setActiveCategory] = useState(phase2FeatureCategories[0].id);
  const active = phase2FeatureCategories.find((c) => c.id === activeCategory) ?? phase2FeatureCategories[0];

  return (
    <>
      <section id="features" className="relative overflow-hidden border-y border-slate-200 bg-slate-950 py-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 20% 0%, rgba(40,168,225,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(252,150,32,0.2), transparent 50%)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
              HRYantra Employer CRM
            </p>
            <BlurRevealHeading
              as="h2"
              className="text-4xl font-extrabold tracking-tight md:text-5xl"
              lines={[{ text: 'Every module your recruitment team runs today.' }]}
            />
            <p className="mt-6 text-base leading-relaxed text-slate-300 md:text-lg">
              One multi-tenant employer platform — leads, jobs, candidates, AI matching, interviews,
              placements, billing, and HQ analytics. Built like modern HRMS suites, tuned for agencies
              and in-house teams.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {phase2Stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm"
              >
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-sky-300" />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {phase2ModuleIcons.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200"
              >
                <Icon className="h-3.5 w-3.5 text-sky-300" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">
                Feature map
              </p>
              <BlurRevealHeading
                as="h3"
                className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl"
                lines={[{ text: 'Platform capabilities by workspace' }]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {phase2FeatureCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`overflow-hidden rounded-[2rem] border bg-gradient-to-br p-6 sm:p-8 lg:p-10 ${active.border} ${active.bg}`}
            >
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80">
                    <active.icon className={`h-7 w-7 ${active.accent}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900">{active.label}</h4>
                    <p className="mt-1 text-sm text-slate-600">{active.tagline}</p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                  {active.features.length} features
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.features.map((feature) => (
                  <article
                    key={feature.name}
                    className="group rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${active.dot}`} aria-hidden />
                      <h5 className="text-sm font-bold text-slate-900">{feature.name}</h5>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-600">{feature.detail}</p>
                  </article>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section id="compare" className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Why teams switch
            </p>
            <BlurRevealHeading
              as="h3"
              className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl"
              lines={[{ text: 'SAASA B2E vs spreadsheets & generic ATS' }]}
            />
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Inspired by how BambooHR, Zoho Recruit, and Workday position all-in-one HR — but built
              for recruitment agencies and employer teams that need CRM + hiring in one login.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-4 font-bold text-slate-900">Capability</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-500">Spreadsheets</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-500">Generic ATS</th>
                    <th className="px-4 py-4 text-center font-bold text-sky-700">SAASA B2E</th>
                  </tr>
                </thead>
                <tbody>
                  {hrmsComparisonRows.map((row, idx) => (
                    <tr
                      key={row.capability}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">{row.capability}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.spreadsheets} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.genericAts} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <CompareCell value={row.saasa} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
