'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  GlassPanel,
  Phase3Reveal,
  Phase3SectionHeader,
  Phase3Shell,
  SegmentedControl,
} from './_shared';
import { DashboardMockup, OrganizationMockup, RolesMockup } from './ControlMockups';

type ControlTab = 'dashboard' | 'organization' | 'roles';

const TABS: { id: ControlTab; label: string; blurb: string }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    blurb:
      'Workforce metrics, attendance overview, task completion, and performance distribution — with filters and reports.',
  },
  {
    id: 'organization',
    label: 'Organization',
    blurb:
      'HQ → Division → Site hierarchy, work locations, departments, reporting structure, and L1 / L2 / L3 approvals.',
  },
  {
    id: 'roles',
    label: 'Roles',
    blurb:
      'Platform Owner, Admin, HR, Manager, Employee — granular permissions, approvals inbox, and multi-tenant packaging.',
  },
];

export function ControlCenterSection() {
  const [tab, setTab] = useState<ControlTab>('dashboard');
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Phase3Shell id="phase3-control" variant="control">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <Phase3SectionHeader
          variant="control"
          number="04"
          label="Control Center & Organization"
          heading="One Control Center for Your Entire Organization"
          description="Bring HR data, approvals, reports, permissions and multi-location operations together in one centralized control layer."
        />
        <Phase3Reveal delay={0.05} className="shrink-0">
          <SegmentedControl layoutId="control-seg" options={TABS} value={tab} onChange={setTab} />
        </Phase3Reveal>
      </div>

      <div className="mt-10 space-y-6">
        <Phase3Reveal>
          <GlassPanel>
            <AnimatePresence mode="wait">
              <motion.p
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[15px] leading-relaxed text-slate-600"
              >
                {active.blurb}
              </motion.p>
            </AnimatePresence>
          </GlassPanel>
        </Phase3Reveal>

        <Phase3Reveal delay={0.08}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              {tab === 'dashboard' ? <DashboardMockup /> : null}
              {tab === 'organization' ? <OrganizationMockup /> : null}
              {tab === 'roles' ? <RolesMockup /> : null}
            </motion.div>
          </AnimatePresence>
        </Phase3Reveal>
      </div>
    </Phase3Shell>
  );
}
