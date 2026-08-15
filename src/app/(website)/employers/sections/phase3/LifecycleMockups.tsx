'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { MockFrame, SoftChip } from './_shared';

export type LifecycleStage = 'joined' | 'onboarding' | 'active' | 'performance' | 'policy' | 'ctc' | 'exit';

const STAGES: { id: LifecycleStage; label: string }[] = [
  { id: 'joined', label: 'Joined' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'active', label: 'Active' },
  { id: 'performance', label: 'Performance' },
  { id: 'policy', label: 'Policy' },
  { id: 'ctc', label: 'CTC' },
  { id: 'exit', label: 'Exit' },
];

function PerformancePanel() {
  const scores = [
    { label: 'Tasks', pct: 40, color: '#28A8E1' },
    { label: 'Attendance', pct: 20, color: '#0F5A7A' },
    { label: 'Leave', pct: 20, color: '#38bdf8' },
    { label: 'Manager', pct: 20, color: '#64748b' },
  ];
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">Auto-scored Performance</p>
      <p className="mt-1 text-xs text-slate-500">
        Monthly · Quarterly · Annual · Self Review · Manager Review · Performance Categories
      </p>
      <div className="mt-4 space-y-3">
        {scores.map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="tabular-nums text-slate-400">{s.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct * 2.2}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Task Score · Attendance Score · Leave Score · Manager Score
      </p>
    </div>
  );
}

function PolicyPanel() {
  const steps = [
    'Policy Published',
    'Employee Notified',
    'Employee Acknowledged',
    'Rule Active',
  ];
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">Policy Center</p>
      <ul className="mt-4 space-y-0">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8F6FC] text-[10px] font-bold text-[#176F96]">
                {i + 1}
              </span>
              {i < steps.length - 1 ? <span className="my-1 h-6 w-px bg-slate-200" /> : null}
            </div>
            <p className="pt-0.5 text-sm text-slate-700">{step}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">
        Upload · Publish · Versions · Leave / Attendance / Exit Rules · Acknowledgment Tracking ·
        Active Policy Enforcement
      </p>
    </div>
  );
}

function CTCPanel() {
  const earnings = [
    { label: 'Basic', value: '₹42,000' },
    { label: 'HRA', value: '₹16,800' },
    { label: 'Conveyance', value: '₹1,600' },
    { label: 'Special Allowance', value: '₹12,400' },
  ];
  const statutory = [
    { label: 'Employee PF', value: '₹1,800' },
    { label: 'Employer PF', value: '₹1,800' },
    { label: 'Employee ESI', value: '—' },
    { label: 'Employer ESI', value: '—' },
    { label: 'Estimated TDS', value: '₹3,200' },
  ];
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">India CTC & Compensation</p>
      <p className="mt-1 text-xs text-slate-500">PF Cap Logic · CTC Assignment · Gross / Net / CTC Snapshot</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {earnings.map((e) => (
          <div key={e.label} className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{e.label}</p>
            <p className="text-sm font-semibold tabular-nums text-slate-800">{e.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {statutory.map((s) => (
          <div key={s.label} className="flex justify-between text-xs text-slate-600">
            <span>{s.label}</span>
            <span className="tabular-nums font-medium">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between rounded-lg border border-[#28A8E1]/25 bg-[#E8F6FC] px-3 py-2 text-sm font-semibold text-[#0F5A7A]">
        <span>CTC</span>
        <span className="tabular-nums">₹12.4 LPA</span>
      </div>
    </div>
  );
}

function ExitPanel() {
  const items = [
    { label: 'Resignation Submitted', done: true },
    { label: 'Notice Period Calculated', done: true },
    { label: 'Handover Completed', done: true },
    { label: 'Assets Returned', done: true },
    { label: 'Leave Cleared', done: true },
    { label: 'IT Access Revocation', done: false },
    { label: 'Experience Letter', done: false },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <SoftChip tone="warn">Resignation</SoftChip>
        <SoftChip>Termination</SoftChip>
        <SoftChip>Retirement</SoftChip>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
            {item.done ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-slate-300" />
            )}
            {item.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">
        Probation Notice · Notice Shortfall · Buyout · Employee My Exit · HR Separation Console
      </p>
    </div>
  );
}

function DefaultStagePanel({ stage }: { stage: LifecycleStage }) {
  const copy: Record<string, string> = {
    joined: 'Joining Date recorded · Employee Master created · Organization Structure linked.',
    onboarding: 'Onboarding Pipeline active · Checklist · Progress Tracking.',
    active: 'Employment Status: Active · Attendance · Leave · Tasks available in self-service.',
  };
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900 capitalize">{stage}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy[stage]}</p>
    </div>
  );
}

export function LifecycleTimeline({
  stage,
  onChange,
}: {
  stage: LifecycleStage;
  onChange: (s: LifecycleStage) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:gap-1.5 sm:overflow-visible">
      {STAGES.map((s, i) => {
        const active = s.id === stage;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition sm:w-full ${
              active
                ? 'bg-slate-900 text-white shadow-[0_10px_28px_-14px_rgba(15,23,42,0.55)]'
                : 'border border-slate-200/80 bg-white/70 text-slate-500 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-medium">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function LifecycleMockPanel({ stage }: { stage: LifecycleStage }) {
  return (
    <MockFrame title="Employee Lifecycle · Framework HRMS">
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#28A8E1] to-[#0F5A7A] text-sm font-semibold text-white">
              NS
            </div>
            <div>
              <p className="font-semibold text-slate-900">Neha Singh</p>
              <p className="text-xs text-slate-500">HR Business Partner · People Ops</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-400">Joining Date</dt>
              <dd className="mt-0.5 font-medium text-slate-800">12 Jan 2024</dd>
            </div>
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="mt-0.5">
                <SoftChip tone="success">Active</SoftChip>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Performance</dt>
              <dd className="mt-0.5 font-medium text-slate-800">4.6 / 5</dd>
            </div>
            <div>
              <dt className="text-slate-400">CTC</dt>
              <dd className="mt-0.5 font-medium text-slate-800">₹12.4 LPA</dd>
            </div>
            <div>
              <dt className="text-slate-400">Assets</dt>
              <dd className="mt-0.5 font-medium text-slate-800">3 assigned</dd>
            </div>
            <div>
              <dt className="text-slate-400">Leave</dt>
              <dd className="mt-0.5 font-medium text-slate-800">CL 08 · SL 06</dd>
            </div>
          </dl>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            {stage === 'performance' ? <PerformancePanel /> : null}
            {stage === 'policy' ? <PolicyPanel /> : null}
            {stage === 'ctc' ? <CTCPanel /> : null}
            {stage === 'exit' ? <ExitPanel /> : null}
            {stage === 'joined' || stage === 'onboarding' || stage === 'active' ? (
              <DefaultStagePanel stage={stage} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </MockFrame>
  );
}
