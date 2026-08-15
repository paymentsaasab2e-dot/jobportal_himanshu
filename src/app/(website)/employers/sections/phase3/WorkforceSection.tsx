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
import { WorkforceMockPanel } from './WorkforceMockups';

type WorkforceTab = 'employees' | 'attendance' | 'leave' | 'onboarding';

const TABS: { id: WorkforceTab; label: string; blurb: string; caps: string[] }[] = [
  {
    id: 'employees',
    label: 'Employees',
    blurb:
      'Employee Master, profiles, status, departments, designations, reporting managers, locations, and organization structure.',
    caps: [
      'Employee Master',
      'Employee Profiles',
      'Employee Status',
      'Departments',
      'Designations',
      'Reporting Managers',
      'Employee Locations',
      'Organization Structure',
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    blurb:
      'GPS check-in / check-out, geofenced attendance, controlled remote punch, present / absent, late / half-day, approvals, and map radius.',
    caps: [
      'GPS Check-in',
      'GPS Check-out',
      'Geofenced Attendance',
      'Controlled Remote Punch',
      'Present / Absent',
      'Late / Half-day Tracking',
      'Attendance Approvals',
      'Work Locations',
      'Map + Radius',
    ],
  },
  {
    id: 'leave',
    label: 'Leave',
    blurb:
      'CL, SL, EL, maternity, paternity, LOP, applications, cancellations, approvals, balances, holiday calendar, and policy-driven rules.',
    caps: [
      'Casual Leave',
      'Sick Leave',
      'Earned Leave',
      'Maternity Leave',
      'Paternity Leave',
      'Loss of Pay',
      'Leave Application',
      'Leave Cancellation',
      'Leave Approval',
      'Leave Balance',
      'Holiday Calendar',
      'Policy-driven Leave Rules',
    ],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    blurb:
      'Pipeline, checklist, progress, CTC, hardware, email setup, policy docs & signature, induction, team intro, and bulk import — plus employee self-service.',
    caps: [
      'Onboarding Pipeline',
      'Onboarding Checklist',
      'Progress Tracking',
      'CTC Assignment',
      'Hardware Allocation',
      'Email / Workspace Setup',
      'Policy Documentation',
      'Policy Signature',
      'Employee Induction',
      'Team Introduction',
      'Bulk Employee Import',
      'Employee Self-Service',
    ],
  },
];

export function WorkforceSection() {
  const [tab, setTab] = useState<WorkforceTab>('employees');
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Phase3Shell id="phase3-workforce" variant="workforce">
      <Phase3SectionHeader
        variant="workforce"
        number="01"
        label="Workforce & Employee Management"
        heading="Everything You Need to Manage Your Workforce"
        description="Manage your complete employee lifecycle from a single platform — from employee records and onboarding to attendance, leave, documents, assets and everyday HR activities."
      />

      <div className="mt-14 grid items-start gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <Phase3Reveal delay={0.06} className="min-w-0">
          <GlassPanel>
            <SegmentedControl
              layoutId="workforce-seg"
              options={TABS.map(({ id, label }) => ({ id, label }))}
              value={tab}
              onChange={setTab}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                <p className="mt-6 text-[15px] leading-relaxed text-slate-600">{active.blurb}</p>
                <CapabilityList items={active.caps} />
              </motion.div>
            </AnimatePresence>
          </GlassPanel>
        </Phase3Reveal>

        <Phase3Reveal delay={0.12} className="min-w-0 lg:sticky lg:top-28">
          <WorkforceMockPanel tab={tab} />
        </Phase3Reveal>
      </div>
    </Phase3Shell>
  );
}
