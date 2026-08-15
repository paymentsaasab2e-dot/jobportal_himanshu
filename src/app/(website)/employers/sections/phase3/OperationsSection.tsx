'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CapabilityList,
  GlassPanel,
  Phase3Reveal,
  Phase3SectionHeader,
  Phase3Shell,
  SegmentedControl,
} from './_shared';
import { OperationsMockPanel } from './OperationsMockups';

type OpsTab = 'tasks' | 'assets' | 'field';

const TABS: { id: OpsTab; label: string; blurb: string; caps: string[] }[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    blurb:
      'Create and assign work across projects with priority, due dates, multi-assignee, list or Kanban, reminders, completion %, and deadline tracking.',
    caps: [
      'Task Creation',
      'Task Assignment',
      'Priority',
      'Due Dates',
      'Multi-assignee',
      'Projects',
      'List View',
      'Kanban Board',
      'Reminders',
      'Work Completion %',
      'Remarks',
      'Deadline Tracking',
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    blurb:
      'Track laptops, monitors, phones, access cards, SIMs, and licenses — assignment, return, condition notes, repair, and status.',
    caps: [
      'Asset Registry',
      'Laptop',
      'Monitor',
      'Mobile Phone',
      'Access Card',
      'SIM',
      'Software License',
      'Asset Assignment',
      'Asset Return',
      'Condition Notes',
      'Repair Status',
      'Available · Assigned · In Repair · Retired',
    ],
  },
  {
    id: 'field',
    label: 'Field',
    blurb:
      'Daily visit rosters, GPS and geofence arrival verification, live location pings, live map, missed visits, and verified metrics.',
    caps: [
      'Daily Visit Roster',
      'Visit Assignment',
      'GPS Verification',
      'Geofence Arrival Verification',
      'Live Location Pings',
      'Live Map',
      'Missed Visits',
      'Verified Visit Metrics',
    ],
  },
];

export function OperationsSection() {
  const [tab, setTab] = useState<OpsTab>('tasks');
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Phase3Shell id="phase3-operations" variant="operations">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <Phase3SectionHeader
          variant="operations"
          number="02"
          label="Work, Assets & Field Operations"
          heading="Connect People, Work & Operations"
          description="Give managers complete visibility into what employees are working on, which assets they have and where field teams are operating."
        />
        <Phase3Reveal delay={0.05} className="shrink-0">
          <SegmentedControl
            layoutId="ops-seg"
            options={TABS.map(({ id, label }) => ({ id, label }))}
            value={tab}
            onChange={setTab}
          />
        </Phase3Reveal>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Phase3Reveal delay={0.08}>
          <GlassPanel className="h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#176F96]">
                  Mode · {active.label}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{active.blurb}</p>
                <CapabilityList items={active.caps} />
              </motion.div>
            </AnimatePresence>
          </GlassPanel>
        </Phase3Reveal>

        <Phase3Reveal delay={0.12}>
          <OperationsMockPanel tab={tab} />
        </Phase3Reveal>
      </div>
    </Phase3Shell>
  );
}
