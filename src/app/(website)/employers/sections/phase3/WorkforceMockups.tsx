'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Circle, MapPin, ShieldCheck } from 'lucide-react';
import { MockFrame, SoftChip } from './_shared';

export function EmployeeMockup() {
  return (
    <MockFrame title="Employee Master · Framework HRMS">
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#28A8E1] to-[#0F5A7A] text-xl font-semibold text-white">
            PS
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Priya Sharma</h4>
              <SoftChip tone="success">Active</SoftChip>
              <SoftChip tone="accent">On-site</SoftChip>
            </div>
            <p className="mt-1 text-sm text-slate-500">Senior Product Designer · People Ops</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Department
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">Design</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Designation
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">Senior Designer</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Location
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">Mumbai Office</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Reporting Manager
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">Ankit Mehta</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Profile', 'Documents', 'Org Structure', 'Status'].map((a) => (
                <button
                  key={a}
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#28A8E1]/40 hover:text-[#176F96]"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -right-1 -top-1 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur sm:right-2 sm:top-2"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Attendance</p>
          <p className="text-sm font-semibold text-emerald-600">96%</p>
        </motion.div>
      </div>
    </MockFrame>
  );
}

export function AttendanceMockup() {
  return (
    <MockFrame title="Attendance · Geofenced check-in">
      <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#F4F7FA] p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Office Location · Map + Radius
          </p>
          <div className="relative mx-auto aspect-square max-h-52 w-full max-w-[220px]">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="200" height="200" fill="url(#grid)" rx="12" />
              <motion.circle
                cx="100"
                cy="100"
                r="58"
                fill="rgba(40,168,225,0.08)"
                stroke="#28A8E1"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                animate={{ r: [54, 58, 54], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="100" cy="100" r="8" fill="#0F5A7A" />
              <text x="100" y="128" textAnchor="middle" className="fill-slate-500" fontSize="8">
                HQ · Mumbai
              </text>
              <motion.circle
                cx="118"
                cy="86"
                r="6"
                fill="#28A8E1"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <motion.circle
                cx="118"
                cy="86"
                r="12"
                fill="none"
                stroke="#28A8E1"
                strokeWidth="1"
                animate={{ r: [8, 16], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            </svg>
          </div>
          <p className="mt-1 text-center text-xs font-medium text-[#176F96]">Within allowed area</p>
        </div>

        <div className="flex flex-col justify-between gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#28A8E1]" />
              <p className="text-sm font-semibold text-slate-900">GPS Check-in</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">09:12</p>
            <p className="text-xs text-slate-500">Check-out pending · Controlled Remote Punch off</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SoftChip tone="success">Present</SoftChip>
            <SoftChip tone="accent">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                GPS Verified
              </span>
            </SoftChip>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Geofenced Attendance · Late / Half-day Tracking · Attendance Approvals · Work Locations
          </p>
        </div>
      </div>
    </MockFrame>
  );
}

export function LeaveMockup() {
  return (
    <MockFrame title="Leave Management · Balances & approvals">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'CL', value: '08', name: 'Casual Leave' },
          { label: 'SL', value: '06', name: 'Sick Leave' },
          { label: 'EL', value: '12', name: 'Earned Leave' },
        ].map((b) => (
          <div key={b.label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{b.name}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {b.label} {b.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Casual Leave</p>
            <p className="mt-1 text-sm text-slate-500">12 Aug – 13 Aug · 2 Days</p>
            <p className="mt-2 text-xs text-slate-400">
              Maternity / Paternity · LOP · Holiday Calendar · Policy-driven Leave Rules
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <SoftChip tone="success">
              <span className="inline-flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
                Approved
              </span>
            </SoftChip>
          </motion.div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span>Leave Application</span>
          <span>·</span>
          <span>Leave Cancellation</span>
          <span>·</span>
          <span>Leave Approval</span>
          <span>·</span>
          <span>Leave Balance</span>
        </div>
      </div>
    </MockFrame>
  );
}

const ONBOARDING_STEPS = [
  { label: 'CTC Assigned', done: true },
  { label: 'Laptop Allocated', done: true },
  { label: 'Email Created', done: true },
  { label: 'Documents Submitted', done: true },
  { label: 'Policy Accepted', done: true },
  { label: 'Team Introduction', done: false },
];

export function OnboardingMockup() {
  return (
    <MockFrame title="Smart Onboarding · Pipeline">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Onboarding Progress — 80%</p>
          <SoftChip tone="accent">Pipeline</SoftChip>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#28A8E1] to-[#0F5A7A]"
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <ul className="space-y-2.5">
        {ONBOARDING_STEPS.map((step, i) => (
          <motion.li
            key={step.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
          >
            {step.done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center text-slate-300">
                <Circle className="h-4 w-4" />
              </span>
            )}
            <span className={`text-sm ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        Hardware Allocation · Email / Workspace Setup · Policy Documentation · Policy Signature ·
        Employee Induction · Bulk Employee Import
      </p>
    </MockFrame>
  );
}

export function WorkforceMockPanel({ tab }: { tab: 'employees' | 'attendance' | 'leave' | 'onboarding' }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.28 }}
      >
        {tab === 'employees' ? <EmployeeMockup /> : null}
        {tab === 'attendance' ? <AttendanceMockup /> : null}
        {tab === 'leave' ? <LeaveMockup /> : null}
        {tab === 'onboarding' ? <OnboardingMockup /> : null}
      </motion.div>
    </AnimatePresence>
  );
}
