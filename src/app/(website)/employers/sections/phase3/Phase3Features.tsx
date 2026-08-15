'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WorkforceSection } from './WorkforceSection';
import { OperationsSection } from './OperationsSection';
import { LifecycleSection } from './LifecycleSection';
import { ControlCenterSection } from './ControlCenterSection';

/**
 * Phase 3 HRMS product showcase — four interactive feature experiences.
 */
export function Phase3Features() {
  return (
    <div id="phase3" className="scroll-mt-24 overflow-x-hidden bg-[#F7FAFC]">
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-white py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(40,168,225,0.16),transparent_55%)]"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#176F96]"
          >
            Phase 3 · Framework HRMS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-5 max-w-3xl text-[2.4rem] font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl lg:text-[3.35rem] lg:leading-[1.08]"
          >
            India-ready workforce operations, designed as a product — not a checklist
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg"
          >
            Four connected experiences: workforce, operations, lifecycle, and control. Explore each
            interface below.
          </motion.p>
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-9 flex flex-wrap justify-center gap-2"
            aria-label="Phase 3 sections"
          >
            {[
              { href: '#phase3-workforce', label: '01 Workforce' },
              { href: '#phase3-operations', label: '02 Operations' },
              { href: '#phase3-lifecycle', label: '03 Lifecycle' },
              { href: '#phase3-control', label: '04 Control' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full border border-slate-200/90 bg-white/80 px-4 py-2.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#28A8E1]/40 hover:text-[#176F96]"
              >
                {l.label}
              </a>
            ))}
          </motion.nav>
        </div>
      </div>

      <WorkforceSection />
      <OperationsSection />
      <LifecycleSection />
      <ControlCenterSection />
    </div>
  );
}

export default Phase3Features;
