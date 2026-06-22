'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  FileText, MessageSquare, Code2, Users, Trophy,
  CheckCircle2, Clock, TrendingUp, ArrowDown, Building2
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainHiringStage } from '@/lib/candmain-landing'

interface Stage extends CandmainHiringStage {
  icon: typeof FileText
}

interface FunnelMetric {
  width: number
  passRate: number
  liveCount: number
}

const baseFunnelMetrics: FunnelMetric[] = [
  { width: 100, passRate: 15, liveCount: 12500 },
  { width: 66, passRate: 60, liveCount: 1875 },
  { width: 44, passRate: 40, liveCount: 750 },
  { width: 30, passRate: 55, liveCount: 412 },
  { width: 20, passRate: 70, liveCount: 289 },
  { width: 16, passRate: 85, liveCount: 246 },
]

const funnelGradients = [
  ['#2563EB', '#60A5FA'],
  ['#0EA5E9', '#38BDF8'],
  ['#7C3AED', '#A78BFA'],
  ['#F97316', '#FDBA74'],
  ['#EC4899', '#F9A8D4'],
  ['#059669', '#34D399'],
]

const stageIcons: Record<string, typeof FileText> = {
  application: FileText,
  recruiter: MessageSquare,
  technical: Code2,
  'hiring-manager': Users,
  panel: Building2,
  offer: Trophy,
}

// ─── Company Pill ─────────────────────────
function CompanyPill({ name, index, color }: { name: string; index: number; color: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/80 border shadow-sm"
      style={{ color, borderColor: `${color}24` }}
    >
      <Building2 className="w-2.5 h-2.5" />
      {name}
    </motion.span>
  )
}

// ─── Live Counter ─────────────────────────
function LiveCounter({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay((prev) => {
        const delta = Math.floor(Math.random() * 9) - 3
        return Math.max(1, prev + delta)
      })
    }, 550 + Math.random() * 350)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono font-bold text-sm" style={{ color }}>
      {display.toLocaleString()}
    </span>
  )
}

// ─── Stage Card ───────────────────────────
function StageCard({ stage, index, isActive, onClick, labels }: {
  stage: Stage
  index: number
  isActive: boolean
  onClick: () => void
  labels: { stage: string; live: string; pass: string }
}) {
  const Icon = stage.icon
  const [from, to] = funnelGradients[index % funnelGradients.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`relative group cursor-pointer rounded-2xl border transition-all duration-400 p-5 ${
        isActive ? 'shadow-premium -translate-y-1' : 'shadow-card hover:shadow-premium hover:-translate-y-0.5'
      }`}
      style={{
        background: `linear-gradient(135deg, ${from}12 0%, ${to}0A 48%, #FFFFFF 100%)`,
        borderColor: isActive ? stage.border : `${from}20`,
      }}
    >
      {/* Step badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${stage.color}15`, border: `1.5px solid ${stage.color}30` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: stage.color }} />
          </div>
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: stage.color }}
            >
              {labels.stage} {stage.step}
            </div>
            <h3 className="text-sm font-bold text-text-primary leading-tight">{stage.title}</h3>
          </div>
        </div>

        {/* Live count */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: stage.color }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ background: stage.color }}
              />
            </span>
            <LiveCounter value={stage.liveCount} color={stage.color} />
          </div>
          <div className="text-[9px] text-text-muted font-medium">{labels.live}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-text-muted leading-relaxed mb-4">{stage.subtitle}</p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
          style={{ background: `${stage.color}10`, color: stage.color }}
        >
          <Clock className="w-3 h-3" />
          {stage.duration}
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
          style={{ background: `${stage.color}10`, color: stage.color }}
        >
          <TrendingUp className="w-3 h-3" />
          {labels.pass} {stage.passRate}
        </div>
      </div>

      {/* Companies */}
      <div className="flex flex-wrap gap-1.5">
        {stage.companies.map((co, i) => (
          <CompanyPill key={co} name={co} index={i} color={stage.color} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Funnel Visual ────────────────────────
function FunnelBar({
  stage,
  index,
  metric,
  labels,
}: {
  stage: Stage
  index: number
  metric: FunnelMetric
  labels: { stage: string; live: string }
}) {
  const width = `${metric.width}%`
  const [from, to] = funnelGradients[index % funnelGradients.length]

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: 'left' }}
      className="flex items-center gap-3"
    >
      <div className="w-24 text-right text-[10px] font-bold text-text-muted whitespace-nowrap">
        {labels.stage} {stage.step}
      </div>
      <div
        className="flex-1 h-7 rounded-lg overflow-hidden relative"
        style={{ background: `linear-gradient(90deg, ${from}12, ${to}08)` }}
      >
        <motion.div
          className="h-full rounded-lg flex items-center pl-3"
          style={{
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: `0 8px 22px ${from}24`,
          }}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ delay: 0.1 + index * 0.03, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] font-bold text-white whitespace-nowrap">
            {stage.title} - {metric.liveCount.toLocaleString()} {labels.live}
          </span>
        </motion.div>
      </div>
      <div
        className="text-[10px] font-bold w-12 text-right"
        style={{ color: from }}
      >
        ~{metric.passRate}%
      </div>
    </motion.div>
  )
}
// ─── Main Component ───────────────────────
export default function HiringHierarchy() {
  const content = useCandmainLandingContent()
  const h = content.hiring
  const hiringStages: Stage[] = h.stages.map((stage) => ({
    ...stage,
    icon: stageIcons[stage.id] ?? FileText,
  }))
  const cardLabels = { stage: h.stageLabel, live: h.liveSuffix, pass: h.passPrefix }
  const funnelLabels = { stage: h.stageLabel, live: h.liveSuffix }

  const [activeStage, setActiveStage] = useState<string | null>('application')
  const [funnelMetrics, setFunnelMetrics] = useState(baseFunnelMetrics)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const toggleStage = (id: string) => {
    setActiveStage((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFunnelMetrics((current) =>
        current.map((metric, index) => {
          const base = baseFunnelMetrics[index]
          const widthDelta = Math.floor(Math.random() * 7) - 3
          const passDelta = Math.floor(Math.random() * 5) - 2
          const countDelta = Math.floor(Math.random() * 81) - 30

          return {
            width: Math.min(100, Math.max(8, base.width + widthDelta)),
            passRate: Math.min(95, Math.max(5, base.passRate + passDelta)),
            liveCount: Math.max(1, metric.liveCount + countDelta),
          }
        })
      )
      setLastUpdated(new Date())
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="section bg-[#FAFBFC]" id="hiring-hierarchy">
      <div className="container">

        {/* ── Header ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>{h.tag}</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            {h.title}{' '}
            <span className="gradient-text-blue">{h.titleAccent}</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">{h.subtitle}</p>
        </motion.div>

        {/* ── Funnel Overview ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-3xl bg-white border border-[rgba(15,23,42,0.08)] shadow-premium p-6 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-text-primary text-sm">{h.funnelTitle}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {h.funnelUpdated} {lastUpdated.toLocaleTimeString(content.dateLocale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {h.liveData}
            </div>
          </div>

          <div className="space-y-3">
            {hiringStages.map((stage, i) => (
              <FunnelBar key={stage.id} stage={stage} index={i} metric={funnelMetrics[i]} labels={funnelLabels} />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-[rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-3 h-3 rounded bg-[rgba(15,23,42,0.06)]" />
              {h.totalPool}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              {h.refreshNote}
            </div>
          </div>
        </motion.div>

        {/* ── Stage Cards Grid ─────────────────── */}
        <div className="mb-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {hiringStages.map((stage, i) => (
              <div key={stage.id} className="relative">
                <StageCard
                  stage={stage}
                  index={i}
                  isActive={activeStage === stage.id}
                  onClick={() => toggleStage(stage.id)}
                  labels={cardLabels}
                />

                {/* Connector arrow between rows */}
                {i < hiringStages.length - 1 && (i + 1) % 3 === 0 && (
                  <div className="hidden xl:flex justify-center mt-4 mb-0">
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowDown className="w-5 h-5 text-blue-300" />
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Stats Banner ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)' }}
        >
          <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: h.banner[0].label, value: h.banner[0].value, icon: Clock },
              { label: h.banner[1].label, value: h.banner[1].value, icon: Trophy },
              { label: h.banner[2].label, value: h.banner[2].value, icon: CheckCircle2 },
              { label: h.banner[3].label, value: h.banner[3].value, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-xl font-black text-white mb-1">{value}</div>
                <div className="text-xs text-white/60 font-medium">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
