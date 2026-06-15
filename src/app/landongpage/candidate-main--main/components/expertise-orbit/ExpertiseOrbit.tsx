'use client'
import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { expertiseSkills } from '@candmain/lib/data'

const ORBIT_RADIUS = 160
const ORBIT_RADIUS_SM = 100

function OrbitNode({
  skill,
  index,
  total,
}: {
  skill: (typeof expertiseSkills)[0]
  index: number
  total: number
}) {
  const [hovered, setHovered] = useState(false)
  const angleStep = (2 * Math.PI) / total
  const angle = (index * angleStep) - Math.PI / 2

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%)`,
      }}
      animate={{
        x: Math.cos(angle) * ORBIT_RADIUS,
        y: Math.sin(angle) * ORBIT_RADIUS,
      }}
    >
      <motion.div
        className="relative cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-card transition-all duration-300 border"
          style={{
            background: hovered ? skill.color : 'white',
            borderColor: hovered ? skill.color : 'rgba(15,23,42,0.08)',
            boxShadow: hovered ? `0 4px 20px ${skill.color}40` : undefined,
          }}
        >
          <span className="text-xs font-bold" style={{ color: hovered ? 'white' : skill.color }}>
            {skill.label.slice(0, 2)}
          </span>
        </div>

        {/* Tooltip */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <div className="bg-[#0F172A] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
              {skill.label}
              <div className="text-[10px] text-white/60 mt-0.5">{skill.category}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

function OrbitRing({
  index,
  total,
}: {
  index: number
  total: number
}) {
  const angleStep = (2 * Math.PI) / total
  const angle = (index * angleStep) - Math.PI / 2
  const x = Math.cos(angle) * ORBIT_RADIUS
  const y = Math.sin(angle) * ORBIT_RADIUS

  return (
    <line
      x1="50%"
      y1="50%"
      x2={`calc(50% + ${x}px)`}
      y2={`calc(50% + ${y}px)`}
      stroke="rgba(15,23,42,0.06)"
      strokeWidth="1"
      strokeDasharray="3 4"
    />
  )
}

export default function ExpertiseOrbit() {
  return (
    <section className="section overflow-hidden" id="expertise">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>11+ Career Fields Covered</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            The{' '}
            <span className="gradient-text-blue">Explore Jobs Sectors</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            HR Yantra covers major job sectors on Explore Jobs — from software and data to finance, healthcare, operations, and sales.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Orbit visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
            style={{ minHeight: '420px' }}
          >
            {/* Orbit ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="w-[340px] h-[340px] rounded-full border border-dashed border-[rgba(15,23,42,0.07)]"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="w-[220px] h-[220px] rounded-full border border-[rgba(255,107,53,0.1)]"
              />
            </div>

            {/* Center: Platform Logo */}
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-1 shadow-blue-glow">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-black gradient-text-blue">AI</div>
                      <div className="text-[8px] font-bold text-text-muted tracking-widest mt-0.5">CAREER OS</div>
                    </div>
                  </div>
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full animate-ping-slow opacity-20 bg-gradient-to-br from-[#2563EB] to-[#3B82F6]" />
              </motion.div>
            </div>

            {/* Orbiting skill nodes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative w-full h-full"
                style={{ maxWidth: '420px', maxHeight: '420px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              >
                {expertiseSkills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${Math.cos((i / expertiseSkills.length) * 2 * Math.PI - Math.PI / 2) * 160}px)`,
                      top: `calc(50% + ${Math.sin((i / expertiseSkills.length) * 2 * Math.PI - Math.PI / 2) * 160}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border bg-white shadow-card text-[10px] font-bold hover:scale-110 transition-transform cursor-default"
                      style={{
                        borderColor: `${skill.color}30`,
                        color: skill.color,
                      }}
                      title={skill.label}
                    >
                      {skill.label.length > 5 ? skill.label.slice(0, 3) : skill.label.slice(0, 4)}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Skills list */}
          <div>
            <div className="space-y-3">
              {[
                { category: 'Technology & Engineering', skills: ['Software Engineering', 'Cloud & DevOps', 'Data Science & AI', 'Cybersecurity'], color: '#2563EB' },
                { category: 'Business & Strategy', skills: ['Product Management', 'Marketing & Growth', 'Sales & BizDev', 'Consulting'], color: '#3B82F6' },
                { category: 'Finance & Operations', skills: ['Finance & Banking', 'Operations & HR', 'Supply Chain & Logistics', 'Legal & Compliance'], color: '#1D4ED8' },
                { category: 'People & Healthcare', skills: ['Healthcare & MedTech', 'Education & Training', 'Customer Success', 'Social Impact'], color: '#10B981' },
              ].map((group, gi) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.1, duration: 0.5 }}
                  className="p-5 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      {group.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-medium px-3 py-1 rounded-lg"
                        style={{
                          background: `${group.color}08`,
                          color: group.color,
                          border: `1px solid ${group.color}18`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
