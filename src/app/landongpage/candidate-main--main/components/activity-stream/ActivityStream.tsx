'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  CheckCircle2, Layers, Search, Shield, Rocket,
  Gauge, MessageSquare, BarChart2, Globe, FileText
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainActivityItem } from '@/lib/candmain-landing'

const typeIcons: Record<string, typeof CheckCircle2> = {
  design: Layers,
  research: Search,
  accessibility: Shield,
  product: Rocket,
  performance: Gauge,
  feedback: MessageSquare,
  metrics: BarChart2,
  deploy: Globe,
  report: FileText,
}

const typeColors: Record<string, string> = {
  design: '#FF6B35',
  research: '#2563EB',
  accessibility: '#10B981',
  product: '#8B5CF6',
  performance: '#F59E0B',
  feedback: '#EC4899',
  metrics: '#14B8A6',
  deploy: '#06B6D4',
  report: '#6366F1',
}

const typeThemes: Record<
  string,
  { bg: string; border: string; iconBg: string; tagBg: string; accent: string }
> = {
  design: {
    bg: 'rgba(255, 107, 53, 0.08)',
    border: 'rgba(255, 107, 53, 0.22)',
    iconBg: 'rgba(255, 107, 53, 0.16)',
    tagBg: 'rgba(255, 107, 53, 0.14)',
    accent: '#FF6B35',
  },
  research: {
    bg: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.2)',
    iconBg: 'rgba(37, 99, 235, 0.14)',
    tagBg: 'rgba(37, 99, 235, 0.12)',
    accent: '#2563EB',
  },
  accessibility: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    iconBg: 'rgba(16, 185, 129, 0.14)',
    tagBg: 'rgba(16, 185, 129, 0.12)',
    accent: '#10B981',
  },
  product: {
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.2)',
    iconBg: 'rgba(139, 92, 246, 0.14)',
    tagBg: 'rgba(139, 92, 246, 0.12)',
    accent: '#8B5CF6',
  },
  performance: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.24)',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    tagBg: 'rgba(245, 158, 11, 0.14)',
    accent: '#F59E0B',
  },
  feedback: {
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.2)',
    iconBg: 'rgba(236, 72, 153, 0.14)',
    tagBg: 'rgba(236, 72, 153, 0.12)',
    accent: '#EC4899',
  },
  metrics: {
    bg: 'rgba(20, 184, 166, 0.08)',
    border: 'rgba(20, 184, 166, 0.2)',
    iconBg: 'rgba(20, 184, 166, 0.14)',
    tagBg: 'rgba(20, 184, 166, 0.12)',
    accent: '#14B8A6',
  },
  deploy: {
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.2)',
    iconBg: 'rgba(6, 182, 212, 0.14)',
    tagBg: 'rgba(6, 182, 212, 0.12)',
    accent: '#06B6D4',
  },
  report: {
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.2)',
    iconBg: 'rgba(99, 102, 241, 0.14)',
    tagBg: 'rgba(99, 102, 241, 0.12)',
    accent: '#6366F1',
  },
}

const defaultTheme = {
  bg: 'rgba(100, 116, 139, 0.08)',
  border: 'rgba(100, 116, 139, 0.18)',
  iconBg: 'rgba(100, 116, 139, 0.14)',
  tagBg: 'rgba(100, 116, 139, 0.12)',
  accent: '#64748B',
}

function ActivityItem({
  item,
  index,
  latestUpdate,
}: {
  item: CandmainActivityItem
  index: number
  latestUpdate: string
}) {
  const Icon = typeIcons[item.type] ?? CheckCircle2
  const color = typeColors[item.type] ?? defaultTheme.accent
  const theme = typeThemes[item.type] ?? defaultTheme
  const isLatest = index === 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.04, duration: 0.55, layout: { duration: 0.45 } }}
      className={`flex items-center gap-2.5 border px-2.5 py-2 transition-all group ${
        isLatest ? 'rounded-xl shadow-md' : 'rounded-lg hover:brightness-[0.98]'
      }`}
      style={{
        background: theme.bg,
        borderColor: theme.border,
        boxShadow: isLatest ? `0 8px 24px ${theme.accent}18, inset 3px 0 0 ${theme.accent}` : `inset 3px 0 0 ${theme.accent}`,
      }}
    >
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border"
        style={{ background: theme.iconBg, borderColor: `${theme.accent}28`, color }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-primary leading-snug">{item.message}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className="text-[11px] text-text-muted">{item.time}</span>
          <span
            className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold capitalize"
            style={{ background: theme.tagBg, color: theme.accent }}
          >
            {item.typeLabel}
          </span>
          {isLatest && (
            <span className="inline-flex items-center rounded-full bg-blue-500/12 px-1.5 py-px text-[10px] font-semibold text-blue-primary">
              {latestUpdate}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center">
        <span
          className="h-2 w-2 rounded-full ring-2 ring-white/80"
          style={{ background: item.status === 'success' ? '#10B981' : theme.accent }}
        />
      </div>
    </motion.div>
  )
}

export default function ActivityStream() {
  const content = useCandmainLandingContent()
  const { activity: a } = content
  const [visibleItems, setVisibleItems] = useState(() =>
    a.feed.slice(0, 6).map((item) => ({ item, feedKey: `initial-${item.id}` }))
  )
  const [currentIndex, setCurrentIndex] = useState(6)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        const newItem = a.feed[currentIndex % a.feed.length]
        return [{ item: newItem, feedKey: `${newItem.id}-${Date.now()}` }, ...prev.slice(0, 7)]
      })
      setCurrentIndex((i) => i + 1)
    }, 2500)

    return () => clearInterval(interval)
  }, [currentIndex, a.feed])

  return (
    <section className="section" id="activity">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="tag-pill tag-blue inline-flex mb-4">
              <span>{a.tag}</span>
            </div>
            <h2 className="text-display-xl text-text-primary mb-6">
              {a.title}{' '}
              <span className="gradient-text-blue">{a.titleAccent}</span>
            </h2>
            <p className="text-text-muted text-lg leading-relaxed mb-8">{a.subtitle}</p>

            <div className="grid grid-cols-3 gap-4">
              {a.stats.map((s) => (
                <div
                  key={s.label}
                  className="p-4 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card"
                >
                  <div className="text-lg font-bold text-text-primary mb-1">{s.value}</div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-3xl overflow-hidden shadow-premium border"
              style={{
                borderColor: 'rgba(37, 99, 235, 0.18)',
                background:
                  'linear-gradient(165deg, rgba(37, 99, 235, 0.07) 0%, rgba(20, 184, 166, 0.05) 42%, rgba(255, 255, 255, 0.98) 100%)',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{
                  borderColor: 'rgba(37, 99, 235, 0.12)',
                  background:
                    'linear-gradient(90deg, rgba(37, 99, 235, 0.1) 0%, rgba(6, 182, 212, 0.08) 55%, rgba(255, 255, 255, 0.72) 100%)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25" />
                  <span className="text-xs font-semibold text-text-primary">{a.streamTitle}</span>
                </div>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-mono text-text-muted border border-[rgba(37,99,235,0.12)]">
                  {new Date().toLocaleDateString(content.dateLocale, { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div
                className="max-h-[420px] overflow-hidden p-2 space-y-1.5"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(239, 246, 255, 0.88) 100%)',
                }}
              >
                <AnimatePresence mode="popLayout">
                  {visibleItems.map(({ item, feedKey }, i) => (
                    <ActivityItem key={feedKey} item={item} index={i} latestUpdate={a.latestUpdate} />
                  ))}
                </AnimatePresence>
              </div>

              <div
                className="h-12 relative -mt-12 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(239, 246, 255, 0.98) 0%, rgba(239, 246, 255, 0) 100%)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
