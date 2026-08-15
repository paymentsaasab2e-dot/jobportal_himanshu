'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { MockFrame, SoftChip } from './_shared';

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [mv, rounded, value]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{display}</p>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <MockFrame title="HR Dashboard & Reports">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AnimatedStat value={248} label="Total Employees" />
        <AnimatedStat value={219} label="Present Today" />
        <AnimatedStat value={18} label="On Leave" />
        <AnimatedStat value={11} label="Pending Approvals" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-medium text-slate-500">Attendance Overview</p>
          <div className="mt-3 flex h-16 items-end gap-1">
            {[40, 55, 48, 62, 70, 58, 75].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t bg-[#28A8E1]/80"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-medium text-slate-500">Task Completion</p>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#28A8E1"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="88"
                  initial={{ strokeDashoffset: 88 }}
                  animate={{ strokeDashoffset: 22 }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-800">
                76%
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-medium text-slate-500">Performance Distribution</p>
          <div className="mt-3 space-y-1.5">
            {[
              { l: 'Exceeds', w: '28%' },
              { l: 'Meets', w: '52%' },
              { l: 'Developing', w: '20%' },
            ].map((r) => (
              <div key={r.l} className="flex items-center gap-2 text-[10px]">
                <span className="w-16 text-slate-500">{r.l}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#0F5A7A]" style={{ width: r.w }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Present / Absent · Pending Leaves · Attendance / Leave / Task / Performance Reports ·
        Employee Filters · Date Filters · Search · Monthly Attendance Sheet
      </p>
    </MockFrame>
  );
}

export function OrganizationMockup() {
  return (
    <MockFrame title="Organization Management">
      <div className="font-mono text-[12px] leading-relaxed text-slate-700 sm:text-[13px]">
        <p className="font-semibold text-[#0F5A7A]">HQ</p>
        <p className="pl-3 text-slate-300">│</p>
        <p className="pl-3">
          <span className="text-slate-300">├── </span>
          <span className="font-medium">Mumbai Division</span>
        </p>
        <p className="pl-8 text-slate-600">├── Mumbai Office</p>
        <p className="pl-8 text-slate-600">└── Navi Mumbai Office</p>
        <p className="pl-3">
          <span className="text-slate-300">├── </span>
          <span className="font-medium">Pune Division</span>
        </p>
        <p className="pl-8 text-slate-600">└── Pune Office</p>
        <p className="pl-3">
          <span className="text-slate-300">└── </span>
          <span className="font-medium">Operations Division</span>
        </p>
        <p className="pl-8 text-slate-600">├── Site A</p>
        <p className="pl-8 text-slate-600">└── Site B</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {['Multiple Work Locations', 'Departments', 'Reporting Structure', 'L1', 'L2', 'L3'].map(
          (t) => (
            <SoftChip key={t} tone="accent">
              {t}
            </SoftChip>
          ),
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Illustrative hierarchy — not live tenant data.</p>
    </MockFrame>
  );
}

type Role = 'owner' | 'admin' | 'hr' | 'manager' | 'employee';

const ROLE_PERMS: Record<Role, { label: string; items: { name: string; on: boolean }[] }> = {
  owner: {
    label: 'Platform Owner',
    items: [
      { name: 'Employees', on: true },
      { name: 'Attendance', on: true },
      { name: 'Leave', on: true },
      { name: 'Onboarding', on: true },
      { name: 'Reports', on: true },
      { name: 'Policies', on: true },
      { name: 'Tenants', on: true },
      { name: 'Roles', on: true },
    ],
  },
  admin: {
    label: 'Admin',
    items: [
      { name: 'Employees', on: true },
      { name: 'Attendance', on: true },
      { name: 'Leave', on: true },
      { name: 'Onboarding', on: true },
      { name: 'Reports', on: true },
      { name: 'Policies', on: true },
      { name: 'Tenants', on: false },
      { name: 'Roles', on: true },
    ],
  },
  hr: {
    label: 'HR',
    items: [
      { name: 'Employees', on: true },
      { name: 'Attendance', on: true },
      { name: 'Leave', on: true },
      { name: 'Onboarding', on: true },
      { name: 'Reports', on: true },
      { name: 'Policies', on: true },
      { name: 'Tenants', on: false },
      { name: 'Roles', on: false },
    ],
  },
  manager: {
    label: 'Manager',
    items: [
      { name: 'Team Attendance', on: true },
      { name: 'Team Leave', on: true },
      { name: 'Tasks', on: true },
      { name: 'Approvals', on: true },
      { name: 'Reports', on: true },
      { name: 'Policies', on: false },
      { name: 'Tenants', on: false },
      { name: 'Roles', on: false },
    ],
  },
  employee: {
    label: 'Employee',
    items: [
      { name: 'My Attendance', on: true },
      { name: 'My Leave', on: true },
      { name: 'My Tasks', on: true },
      { name: 'My Documents', on: true },
      { name: 'My Exit', on: true },
      { name: 'Reports', on: false },
      { name: 'Policies (ack)', on: true },
      { name: 'Roles', on: false },
    ],
  },
};

export function RolesMockup() {
  const [role, setRole] = useState<Role>('hr');
  const active = ROLE_PERMS[role];

  return (
    <MockFrame title="Roles & Permissions · Multi-Tenant">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(ROLE_PERMS) as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              role === r
                ? 'bg-[#28A8E1] text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#28A8E1]/40'
            }`}
          >
            {ROLE_PERMS[r].label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {active.items.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                item.on
                  ? 'border-emerald-100 bg-emerald-50/60 text-emerald-800'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {item.on ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {item.name}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {[
          'Role-based Access',
          'Granular Tab Permissions',
          'Granular Action Permissions',
          'Unified Approvals Inbox',
          'In-app Notifications',
          'Platform HQ',
          'Client Tenant Creation',
          'Tenant Isolation',
          'Multiple Client Organizations',
          'Starter',
          'Professional',
          'Enterprise',
        ].map((t) => (
          <SoftChip key={t}>{t}</SoftChip>
        ))}
      </div>
    </MockFrame>
  );
}
