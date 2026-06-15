'use client'
import { motion, useMotionValueEvent, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useRef, useState } from 'react'
import { experiences } from '@candmain/lib/data'
import { ArrowRight } from 'lucide-react'

function TimelineCard({
  experience,
  index,
  isLast,
  isActive,
  isReached,
  scrollYProgress,
  activeIndex,
}: {
  experience: (typeof experiences)[0]
  index: number
  isLast: boolean
  isActive: boolean
  isReached: boolean
  scrollYProgress: MotionValue<number>
  activeIndex: number
}) {
  const segmentFill = useTransform(
    scrollYProgress,
    [index / (experiences.length - 1), (index + 1) / (experiences.length - 1)],
    ['0%', '100%']
  )
  const isLiveSegment = index === Math.min(activeIndex, experiences.length - 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex gap-6 pb-10"
    >
      {/* Vertical line */}
      {!isLast && (
        <div
          className="absolute left-5 top-14 bottom-8 z-0 w-[3px] overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(to bottom, ${experience.color}18, rgba(15,23,42,0.04))`,
          }}
        >
          <motion.div
            className="absolute left-0 top-0 w-full rounded-full"
            style={{
              height: segmentFill,
              background: `linear-gradient(to bottom, ${experience.color}, #38BDF8 52%, #F97316)`,
              boxShadow: `0 0 18px ${experience.color}, 0 0 28px rgba(56,189,248,0.45)`,
            }}
          >
            <motion.div
              className="absolute inset-x-0 h-10 rounded-full"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85), transparent)' }}
              animate={{ y: ['-40px', '120px'] }}
              transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
          {isLiveSegment && (
            <motion.div
              className="absolute left-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white"
              style={{
                top: segmentFill,
                background: '#38BDF8',
                boxShadow: `0 0 0 5px ${experience.color}18, 0 0 24px ${experience.color}`,
              }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      )}

      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        {isActive && (
          <motion.div
            className="absolute -right-1 -top-1 z-20 h-2.5 w-2.5 rounded-full"
            style={{
              background: '#FFFFFF',
              border: `2px solid ${experience.color}`,
              boxShadow: `0 0 18px ${experience.color}`,
            }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          className="relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shadow-card text-xs font-black"
          animate={{
            scale: isActive ? 1.08 : 1,
            boxShadow: isActive
              ? `0 0 0 6px ${experience.color}14, 0 12px 28px ${experience.color}24`
              : '0 8px 18px rgba(15,23,42,0.08)',
          }}
          transition={{ duration: 0.25 }}
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${experience.color}1F, rgba(56,189,248,0.16), rgba(249,115,22,0.12))`
              : isReached ? `${experience.color}18` : '#FFFFFF',
            border: `2px solid ${isActive ? experience.color : `${experience.color}30`}`,
          }}
        >
          {isActive && (
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{ background: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.72), transparent 80%)' }}
              animate={{ x: ['-120%', '120%'] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span style={{ color: experience.color }}>{index + 1}</span>
        </motion.div>
        {isActive && (
          <motion.div
            className="absolute -bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shadow-card"
            style={{ color: experience.color, border: `1px solid ${experience.color}22` }}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Live
          </motion.div>
        )}
      </div>

      {/* Card */}
      <motion.div
        className="relative flex-1 overflow-hidden rounded-2xl bg-white border shadow-card p-6 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
        animate={{
          borderColor: '#000000',
          boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Top */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: experience.color }}
            >
              {experience.period}
            </span>
            <h3 className="text-lg font-bold text-text-primary mt-1 leading-tight">
              {experience.role}
            </h3>
            <p className="text-sm font-medium text-text-muted">{experience.company}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-muted leading-relaxed mb-4">{experience.description}</p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {experience.highlights.map((highlight) => (
            <span
              key={highlight}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: `${experience.color}08`,
                color: experience.color,
                border: `1px solid ${experience.color}18`,
              }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: experience.color }} />
              {highlight}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ExperienceTimeline() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start center', 'end center'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIndex = Math.min(experiences.length - 1, Math.max(0, Math.round(latest * (experiences.length - 1))))
    setActiveIndex(nextIndex)
  })

  return (
    <section className="section" id="experience">
      <div className="container">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28"
          >
            <div className="tag-pill tag-blue inline-flex mb-4">
              <span>Candidate Journey</span>
            </div>
            <h2 className="text-display-xl text-text-primary mb-6">
              Live Hiring{' '}
              <span className="gradient-text-blue">Pipeline</span>
            </h2>
            <p className="text-text-muted text-lg leading-relaxed mb-8">
              Track how a candidate moves from profile setup to recruiter discovery, interview readiness, and active offer-stage momentum.
            </p>

            {/* Platform stats */}
            <div className="p-6 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card">
              <div className="text-4xl font-black gradient-text-blue mb-1">4</div>
              <div className="text-sm font-medium text-text-muted">Live evaluation stages</div>
              <div className="mt-4 pt-4 border-t border-[rgba(15,23,42,0.06)] flex items-center gap-2 text-xs text-text-muted">
                <ArrowRight className="w-3.5 h-3.5 text-blue-primary" />
                Stage 1 profile signal to Stage 4 hiring movement
              </div>
            </div>
          </motion.div>

          {/* Right: Timeline */}
          <div ref={timelineRef} className="relative pt-2">
            {experiences.map((exp, i) => (
              <TimelineCard
                key={exp.id}
                experience={exp}
                index={i}
                isLast={i === experiences.length - 1}
                isActive={i === activeIndex}
                isReached={i <= activeIndex}
                scrollYProgress={scrollYProgress}
                activeIndex={activeIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
