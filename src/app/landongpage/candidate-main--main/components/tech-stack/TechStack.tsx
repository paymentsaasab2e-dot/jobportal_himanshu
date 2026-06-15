'use client'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { techStack } from '@candmain/lib/data'

function TechCard({
  tech,
  index,
}: {
  tech: (typeof techStack)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]))
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]))

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    x.set(nx)
    y.set(ny)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const rowDelay = Math.floor(index / 4)
  const colDelay = index % 4

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        delay: rowDelay * 0.1 + colDelay * 0.05,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-default"
    >
      <div className="p-5 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card hover:shadow-premium hover:border-[rgba(15,23,42,0.12)] transition-all duration-300">
        {/* Tech icon / initial */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mb-4 mx-auto group-hover:scale-110 transition-transform duration-300"
          style={{
            background: `${tech.color}12`,
            color: tech.color,
            border: `1px solid ${tech.color}20`,
          }}
        >
          {tech.icon}
        </div>

        <div className="text-center">
          <div className="font-bold text-text-primary text-sm mb-1">{tech.name}</div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: `${tech.color}` }}
          >
            {tech.category}
          </div>
        </div>

        {/* Glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${tech.color}25, 0 0 20px ${tech.color}12` }}
        />
      </div>
    </motion.div>
  )
}

export default function TechStack() {
  return (
    <section className="section" id="tech">
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
            <span>Phase 1 Portal</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            Built Into{' '}
            <span className="gradient-text-blue">HR Yantra</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            HR Yantra connects your candidate journey — Explore Jobs, Profile, Applications, LMS tools, and Phase 2 recruiter sync — in one Phase 1 portal built for real hiring workflows.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {techStack.map((tech, i) => (
            <TechCard key={tech.name} tech={tech} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
