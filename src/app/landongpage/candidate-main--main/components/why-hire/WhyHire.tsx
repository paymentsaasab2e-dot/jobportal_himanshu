'use client'
import { motion } from 'framer-motion'
import { whyHireComparisons } from '@candmain/lib/data'
import { X, Check, ArrowRight } from 'lucide-react'

export default function WhyHire() {
  return (
    <section className="section bg-[#0F172A] relative overflow-hidden" id="why-hire">
      {/* Background effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #28A8E1, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #28A8DF, transparent)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: 'rgba(40,168,225,0.15)', border: '1px solid rgba(40,168,225,0.25)' }}
          >
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              HR Yantra Advantage
            </span>
          </div>
          <h2 className="text-display-xl text-white mb-4">
            Why{' '}
            <span className="gradient-text-blue">Choose HR Yantra?</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            The difference between applying everywhere and moving forward is clarity — the right profile, live portal jobs, and tracked applications from Explore Jobs to interview.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_1fr] gap-4 mb-4">
            <div className="text-center py-3 px-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Other Portals</span>
            </div>
            <div
              className="text-center py-3 px-4 rounded-xl"
              style={{ background: 'rgba(40,168,225,0.2)', border: '1px solid rgba(40,168,225,0.35)' }}
            >
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                HR Yantra Portal
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {whyHireComparisons.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="grid grid-cols-[1fr_1fr] gap-4 group"
              >
                {/* Others */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-white/30" />
                  </div>
                  <span className="text-sm text-white/40 font-medium">{row.others}</span>
                </div>

                {/* Candidate */}
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl group-hover:scale-[1.02] transition-transform duration-200"
                  style={{
                    background: 'rgba(40,168,225,0.12)',
                    border: '1px solid rgba(40,168,225,0.3)',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(40,168,225,0.25)' }}
                  >
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm text-white font-semibold">{row.candidate}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 p-6 rounded-2xl text-center"
            style={{ background: 'rgba(40,168,225,0.1)', border: '1px solid rgba(40,168,225,0.25)' }}
          >
            <p className="text-white/80 text-base font-medium leading-relaxed">
              HR Yantra helps candidates explore live jobs, improve profiles, complete assessments, and track recruiter progress across the Phase 1 portal and agency CRM pipelines.
              with a 94% placement rate — no guesswork, just data-driven results.
              <br />
              <span className="text-white font-bold">Build a clearer profile. Find better-fit opportunities.</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
