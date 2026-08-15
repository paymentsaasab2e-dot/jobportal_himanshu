'use client';

import React, { useState } from 'react';
import {
  GlassPanel,
  Phase3Reveal,
  Phase3SectionHeader,
  Phase3Shell,
} from './_shared';
import {
  LifecycleMockPanel,
  LifecycleTimeline,
  type LifecycleStage,
} from './LifecycleMockups';

export function LifecycleSection() {
  const [stage, setStage] = useState<LifecycleStage>('performance');

  return (
    <Phase3Shell id="phase3-lifecycle" variant="lifecycle">
      <Phase3SectionHeader
        variant="lifecycle"
        number="03"
        label="Performance, Policies & Employee Lifecycle"
        heading="Manage the Complete Employee Lifecycle"
        description="From company policies and performance reviews to compensation and employee exits, keep every lifecycle process structured and trackable."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <Phase3Reveal>
          <GlassPanel className="h-full">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle stages
            </p>
            <LifecycleTimeline stage={stage} onChange={setStage} />
          </GlassPanel>
        </Phase3Reveal>

        <Phase3Reveal delay={0.08}>
          <LifecycleMockPanel stage={stage} />
          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            Select a stage to explore performance scoring, policy acknowledgment, India CTC
            structure, and exit clearance — without inventing payroll processing or payslips.
          </p>
        </Phase3Reveal>
      </div>
    </Phase3Shell>
  );
}
