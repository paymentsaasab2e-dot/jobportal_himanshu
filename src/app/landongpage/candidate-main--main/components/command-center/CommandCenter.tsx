'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Activity, Cpu, Globe, Shield, TrendingUp, Users, Target, Wifi
} from 'lucide-react'
import { commandCenterStats } from '@candmain/lib/data'

const statusColors: Record<string, string> = {
  live: '#10B981',
  active: '#2563EB',
  excellent: '#10B981',
  good: '#3B82F6',
  growing: '#2563EB',
}

const icons = [Activity, Cpu, Globe, Shield, TrendingUp, Users, Target, Wifi]

function StatCard({
  stat,
  index,
}: {
  stat: (typeof commandCenterStats)[0]
  index: number
}) {
  const [displayValue, setDisplayValue] = useState(
    typeof stat.value === 'number' ? 0 : stat.value
  )
  const Icon = icons[index % icons.length]
  const color = statusColors[stat.status] ?? '#64748B'

  useEffect(() => {
    if (typeof stat.value !== 'number') return
    let start = 0
    const target = stat.value
    const duration = 1500 + index * 100
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (target - start) * eased
      setDisplayValue(parseFloat(current.toFixed(1)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [stat.value, index])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl p-5 bg-white border border-[rgba(15,23,42,0.07)] shadow-card hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="relative flex h-1.5 w-1.5"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: color }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: color }}
            />
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color }}
          >
            {stat.status}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold tracking-tight text-text-primary mb-1 metric-value">
        {typeof stat.value === 'number'
          ? `${typeof displayValue === 'number' ? displayValue.toFixed(displayValue % 1 === 0 ? 0 : 1) : displayValue}${stat.unit ?? ''}`
          : stat.value}
      </div>

      {/* Label */}
      <div className="text-xs font-medium text-text-muted mb-3">{stat.label}</div>

      {/* Trend */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-[rgba(15,23,42,0.05)]">
        <TrendingUp className="w-3 h-3" style={{ color }} />
        <span className="text-xs font-medium" style={{ color }}>
          {stat.trend}
        </span>
      </div>

      {/* Progress bar for percentages */}
      {stat.unit === '%' && typeof stat.value === 'number' && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[rgba(15,23,42,0.04)]">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: stat.value / 100 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + index * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: color, transformOrigin: 'left' }}
            className="h-full"
          />
        </div>
      )}
    </motion.div>
  )
}

// Live ticker bar
function TickerBar() {
  const items = [
    'Recruiter viewed profile - Operations Manager role',
    'Interview scheduled - Finance Analyst opening',
    'Resume shortlisted - Healthcare Coordinator role',
    'Profile quality improved to 94%',
    'New certification verified - Project Management',
    'Skill check completed - Communication and reporting',
    'Application moved to hiring manager review',
    'New role match found with 92% fit',
    'Offer activity detected - Customer Success role',
  ]

  return (
    <div className="overflow-hidden rounded-xl bg-[#0F172A] px-6 py-3 flex items-center gap-4">
      <span className="flex-shrink-0 flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
        </span>
        Live Feed
      </span>
      <div className="overflow-hidden flex-1">
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...items, ...items].map((item, i) => (
            <span key={i} className="text-xs text-white/60 font-medium flex items-center gap-2">
              <span className="text-blue-primary">◆</span>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default function CommandCenter() {
  return (
    <section className="section bg-[#FAFBFC]" id="command">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>Platform Outcomes</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            Trusted Outcomes.{' '}
            <span className="gradient-text-blue">Measurable Career Growth.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Join an AI-based platform designed to help candidates get discovered, secure interviews,
            and accelerate career growth through AI-powered matching and recruiter visibility.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {commandCenterStats.map((stat, i) => (
            <StatCard key={stat.id} stat={stat} index={i} />
          ))}
        </div>

        {/* Live Ticker */}
        <TickerBar />
      </div>
    </section>
  )
}
