'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  FileText, MessageSquare, Code2, Users, Trophy,
  TrendingUp, Building2
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
  const funnelLabels = { stage: h.stageLabel, live: h.liveSuffix }

  const [funnelMetrics, setFunnelMetrics] = useState(baseFunnelMetrics)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLastUpdated(new Date())

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
                {h.funnelUpdated}{' '}
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString(content.dateLocale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
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
      </div>
    </section>
  )
}
