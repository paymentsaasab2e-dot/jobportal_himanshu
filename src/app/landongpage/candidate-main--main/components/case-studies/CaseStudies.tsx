'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { caseStudies } from '@candmain/lib/data'

const resultColors = ['#2563EB', '#F97316', '#10B981', '#8B5CF6']

function CaseStudyCard({ study, index }: { study: (typeof caseStudies)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-3xl overflow-hidden border border-[rgba(15,23,42,0.08)] shadow-premium bg-white hover:shadow-2xl transition-all duration-500"
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${study.color}, transparent)` }}
      />

      <div className="p-8">
        {/* Tag & Number */}
        <div className="flex items-center justify-between mb-6">
          <span
            className="tag-pill text-xs font-semibold"
            style={{
              background: `${study.color}10`,
              color: study.color,
              border: `1px solid ${study.color}20`,
            }}
          >
            {study.tag}
          </span>
          <span className="text-5xl font-black text-[rgba(15,23,42,0.04)]">
            0{index + 1}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary leading-tight mb-6">
          {study.title}
        </h3>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {study.results.map((result, resultIndex) => {
            const color = resultColors[(index + resultIndex) % resultColors.length]
            return (
            <div
              key={result.metric}
              className="p-4 rounded-xl"
              style={{ background: `${color}0D`, border: `1px solid ${color}18` }}
            >
              <div
                className="text-xl font-bold tracking-tight mb-1"
                style={{ color }}
              >
                {result.value}
              </div>
              <div className="text-xs font-semibold text-text-muted">{result.metric}</div>
              <div className="text-[10px] text-text-muted/60 mt-0.5">{result.detail}</div>
            </div>
            )
          })}
        </div>

        {/* Expand/Collapse */}
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="space-y-4 pb-6">
            {[
              { label: 'Problem', content: study.challenge },
              { label: 'What HR Yantra Checks', content: study.research },
              { label: 'How It Helps', content: study.strategy },
            ].map((section) => (
              <div key={section.label}>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  {section.label}
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(15,23,42,0.06)]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-semibold transition-colors"
            style={{ color: study.color }}
          >
            {expanded ? 'Show Less' : 'How It Helps'}
          </button>
          <button className="flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors">
            Candidate Outcome
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function CaseStudies() {
  return (
    <section className="section" id="case-studies">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>Platform Success Stories</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            Simple Outcomes.{' '}
            <span className="gradient-text-blue">Clear Career Progress.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            See how HR Yantra helps candidates explore jobs, improve profiles, complete assessments, and track applications through the Phase 1 portal.
          </p>
        </motion.div>

        {/* Case Studies Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {caseStudies.map((study, i) => (
            <CaseStudyCard key={study.id} study={study} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
