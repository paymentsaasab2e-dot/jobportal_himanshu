'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MockFrame, SoftChip } from './_shared';

const COLUMNS = [
  {
    id: 'todo',
    title: 'TO DO',
    tasks: [
      { title: 'Prepare monthly report', priority: 'High', assignee: 'PS', due: '14 Aug', progress: 0 },
      { title: 'Update employee records', priority: 'Med', assignee: 'RK', due: '16 Aug', progress: 10 },
    ],
  },
  {
    id: 'progress',
    title: 'IN PROGRESS',
    tasks: [
      { title: 'Client meeting', priority: 'High', assignee: 'AM', due: 'Today', progress: 55 },
      { title: 'Complete onboarding', priority: 'Med', assignee: 'NS', due: '15 Aug', progress: 70 },
    ],
  },
  {
    id: 'review',
    title: 'REVIEW',
    tasks: [{ title: 'Policy acknowledgment audit', priority: 'Low', assignee: 'PS', due: '18 Aug', progress: 90 }],
  },
  {
    id: 'done',
    title: 'DONE',
    tasks: [{ title: 'Asset assignment batch', priority: 'Med', assignee: 'RK', due: 'Done', progress: 100 }],
  },
];

export function TaskBoardMockup() {
  return (
    <MockFrame title="Tasks & Projects · Kanban">
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COLUMNS.map((col) => (
          <div key={col.id} className="w-[160px] shrink-0 sm:w-[170px]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {col.title}
            </p>
            <div className="space-y-2">
              {col.tasks.map((task) => (
                <motion.div
                  key={task.title}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 active:cursor-grabbing"
                >
                  <p className="text-[13px] font-medium leading-snug text-slate-800">{task.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SoftChip tone={task.priority === 'High' ? 'danger' : task.priority === 'Med' ? 'warn' : 'neutral'}>
                      {task.priority}
                    </SoftChip>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">
                      {task.assignee}
                    </span>
                    <span className="text-[10px] text-slate-400">{task.due}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#28A8E1]"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Task Creation · Assignment · Priority · Due Dates · Multi-assignee · Projects · List View ·
        Reminders · Work Completion % · Remarks · Deadline Tracking
      </p>
    </MockFrame>
  );
}

export function AssetMockup() {
  const assets = [
    { name: 'MacBook Pro', id: 'AST-1048', status: 'Assigned' as const },
    { name: 'iPhone', id: 'AST-2091', status: 'Assigned' as const },
    { name: 'Access Card', id: 'AST-3920', status: 'Assigned' as const },
  ];

  return (
    <MockFrame title="Asset Management · Registry">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Employee</p>
          <p className="text-base font-semibold text-slate-900">Rahul Sharma</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Available', 'Assigned', 'In Repair', 'Retired'].map((s) => (
            <SoftChip key={s} tone={s === 'Assigned' ? 'accent' : 'neutral'}>
              {s}
            </SoftChip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {assets.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{a.name}</p>
              <p className="text-xs text-slate-400">Asset ID: {a.id}</p>
            </div>
            <SoftChip tone="success">{a.status}</SoftChip>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
        {['Assigned', 'In Use', 'Returned'].map((step, i) => (
          <React.Fragment key={step}>
            {i > 0 ? <span className="text-slate-300">→</span> : null}
            <span className={i === 1 ? 'text-[#176F96]' : ''}>{step}</span>
          </React.Fragment>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Laptop · Monitor · Mobile Phone · Access Card · SIM · Software License · Assignment · Return ·
        Condition Notes · Repair Status
      </p>
    </MockFrame>
  );
}

export function FieldMapMockup() {
  const markers = [
    { x: 28, y: 38, tone: 'ok' },
    { x: 52, y: 48, tone: 'ok' },
    { x: 70, y: 32, tone: 'live' },
    { x: 42, y: 68, tone: 'miss' },
    { x: 78, y: 62, tone: 'pending' },
  ];

  return (
    <MockFrame title="Field Visit Tracking · Live map">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: '24 Visits Today', tone: 'accent' as const },
          { label: '19 Verified', tone: 'success' as const },
          { label: '3 Pending', tone: 'warn' as const },
          { label: '2 Missed', tone: 'danger' as const },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-[11px] font-semibold text-slate-700"
          >
            <SoftChip tone={m.tone}>{m.label}</SoftChip>
          </div>
        ))}
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-[#EEF3F7]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62" preserveAspectRatio="none">
          <path d="M0 40 Q25 28 50 38 T100 30 V62 H0Z" fill="#e2e8f0" opacity="0.5" />
          <path d="M0 20 H100" stroke="#cbd5e1" strokeWidth="0.2" />
          <path d="M0 40 H100" stroke="#cbd5e1" strokeWidth="0.2" />
          <path d="M30 0 V62" stroke="#cbd5e1" strokeWidth="0.2" />
          <path d="M60 0 V62" stroke="#cbd5e1" strokeWidth="0.2" />
          <circle cx="52" cy="48" r="10" fill="rgba(40,168,225,0.12)" stroke="#28A8E1" strokeWidth="0.4" strokeDasharray="1.2 0.8" />
        </svg>
        {markers.map((m, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
            animate={m.tone === 'live' ? { scale: [1, 1.2, 1] } : undefined}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                m.tone === 'ok'
                  ? 'bg-emerald-500'
                  : m.tone === 'live'
                    ? 'bg-[#28A8E1]'
                    : m.tone === 'miss'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
              }`}
            />
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Daily Visit Roster · Visit Assignment · GPS Verification · Geofence Arrival · Live Location
        Pings · Missed Visits · Verified Visit Metrics
      </p>
    </MockFrame>
  );
}

export function OperationsMockPanel({ tab }: { tab: 'tasks' | 'assets' | 'field' }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28 }}
      >
        {tab === 'tasks' ? <TaskBoardMockup /> : null}
        {tab === 'assets' ? <AssetMockup /> : null}
        {tab === 'field' ? <FieldMapMockup /> : null}
      </motion.div>
    </AnimatePresence>
  );
}
