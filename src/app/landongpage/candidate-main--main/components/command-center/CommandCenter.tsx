'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Activity, Cpu, Globe, Shield, TrendingUp, Users, Target, Wifi, ChevronDown
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainStat } from '@/lib/candmain-landing'

const icons = [Activity, Cpu, Globe, Shield, TrendingUp, Users, Target, Wifi]

function StatCard({ stat, index }: { stat: CandmainStat; index: number }) {
  const [displayValue, setDisplayValue] = useState(
    typeof stat.value === 'number' ? 0 : stat.value
  )
  const Icon = icons[index % icons.length]

  useEffect(() => {
    if (typeof stat.value !== 'number') return
    const target = stat.value
    const duration = 1500 + index * 100
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setDisplayValue(parseFloat(current.toFixed(1)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [stat.value, index])

  const formattedValue =
    typeof stat.value === 'number'
      ? `${typeof displayValue === 'number' ? displayValue.toFixed(displayValue % 1 === 0 ? 0 : 1) : displayValue}`
      : stat.value

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`outcome-card-parent outcome-card-parent--${stat.id}`}
    >
      <div className="outcome-card">
        <div className="outcome-card-logo" aria-hidden>
          <span className="circle circle1" />
          <span className="circle circle2" />
          <span className="circle circle3" />
          <span className="circle circle4" />
          <span className="circle circle5">
            <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
          </span>
        </div>

        <div className="outcome-card-glass" />

        <div className="outcome-card-content">
          <span className="outcome-card-value metric-value">{formattedValue}</span>
          <span className="outcome-card-label">{stat.label}</span>
        </div>

        <div className="outcome-card-bottom">
          <span className={`outcome-card-status outcome-card-status--${stat.status}`}>
            <span className="outcome-card-status-dot" style={{ background: 'var(--outcome-brand-bright)' }} />
            {stat.statusLabel}
          </span>
          <div className="outcome-card-more">
            <span className="outcome-card-more-text line-clamp-2">{stat.trend}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={2.5} style={{ color: 'var(--outcome-brand)' }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TickerBar({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#0F172A] px-6 py-3 flex items-center gap-4">
      <span className="flex-shrink-0 flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
        </span>
        {label}
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
  const content = useCandmainLandingContent()
  const { commandCenter: c } = content

  return (
    <section className="section command-center-section bg-[#FAFBFC]" id="command">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>{c.tag}</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            {c.title}{' '}
            <span className="gradient-text-blue">{c.titleAccent}</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">{c.subtitle}</p>
        </motion.div>

        <div className="command-center-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-10 py-4">
          {c.stats.map((stat, i) => (
            <StatCard key={stat.id} stat={stat} index={i} />
          ))}
        </div>

        <TickerBar items={c.ticker} label={c.liveFeed} />
      </div>
    </section>
  )
}
