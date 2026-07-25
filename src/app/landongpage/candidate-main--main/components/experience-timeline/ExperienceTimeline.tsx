'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainExperience } from '@/lib/candmain-landing'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const AUTO_ADVANCE_MS = 3200

function TimelineCard({
  experience,
  index,
}: {
  experience: CandmainExperience
  index: number
}) {
  return (
    <div className="relative flex w-full items-center gap-5">
      <div className="relative z-10 flex-shrink-0">
        <div
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black shadow-card"
          style={{
            background: `linear-gradient(135deg, ${experience.color}22, rgba(56,189,248,0.14))`,
            border: `2px solid ${experience.color}`,
            boxShadow: `0 0 0 5px ${experience.color}12, 0 10px 22px ${experience.color}18`,
          }}
        >
          <span style={{ color: experience.color }}>{index + 1}</span>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-2xl border bg-white p-6 shadow-card"
        style={{
          borderColor: experience.color,
          boxShadow: `0 14px 32px ${experience.color}16`,
        }}
      >
        <div className="mb-3">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: experience.color }}
          >
            {experience.period}
          </span>
          <h3 className="mt-1 text-lg font-bold leading-tight text-text-primary">
            {experience.role}
          </h3>
          <p className="text-sm font-medium text-text-muted">{experience.company}</p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-text-muted">{experience.description}</p>

        <div className="flex flex-wrap gap-2">
          {experience.highlights.map((highlight) => (
            <span
              key={highlight}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: `${experience.color}08`,
                color: experience.color,
                border: `1px solid ${experience.color}18`,
              }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: experience.color }} />
              {highlight}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ExperienceTimeline() {
  const content = useCandmainLandingContent()
  const e = content.experience
  const experiences = e.steps
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || experiences.length <= 1) return
    const timer = window.setInterval(() => {
      setDirection(1)
      setActiveIndex((prev) => (prev + 1) % experiences.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [inView, experiences.length])

  const goTo = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1)
    setActiveIndex(index)
  }

  const goPrev = () => {
    setDirection(-1)
    setActiveIndex((prev) => (prev - 1 + experiences.length) % experiences.length)
  }

  const goNext = () => {
    setDirection(1)
    setActiveIndex((prev) => (prev + 1) % experiences.length)
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 56 : -56,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -56 : 56,
      opacity: 0,
    }),
  }

  return (
    <section ref={sectionRef} className="section" id="experience">
      <div className="container">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="w-full lg:sticky lg:top-28"
          >
            <div className="tag-pill tag-blue mb-4 inline-flex">
              <span>{e.tag}</span>
            </div>
            <h2 className="text-display-xl mb-0 text-text-primary">
              {e.title}{' '}
              <span className="gradient-text-blue">{e.titleAccent}</span>
            </h2>
          </motion.div>

          <div className="relative w-full pt-2 lg:pt-12">
            <div className="relative min-h-[280px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={experiences[activeIndex]?.id ?? activeIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  <TimelineCard
                    experience={experiences[activeIndex]}
                    index={activeIndex}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {experiences.map((exp, i) => (
                  <button
                    key={exp.id}
                    type="button"
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === activeIndex ? 'w-7 bg-[#2098C8]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous step"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#2098C8]/40 hover:text-[#2098C8]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next step"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#2098C8]/40 hover:text-[#2098C8]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
