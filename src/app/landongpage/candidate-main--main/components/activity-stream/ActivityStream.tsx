'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  CheckCircle2, Layers, Search, Shield, Rocket,
  Gauge, MessageSquare, BarChart2, Globe, FileText
} from 'lucide-react'
import { activityFeed } from '@candmain/lib/data'

const typeIcons: Record<string, any> = {
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
}

function ActivityItem({
  item,
  index,
}: {
  item: (typeof activityFeed)[0]
  index: number
}) {
  const Icon = typeIcons[item.type] ?? CheckCircle2
  const color = typeColors[item.type] ?? '#64748B'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.04, duration: 0.55, layout: { duration: 0.45 } }}
      className={`flex items-start gap-4 p-4 border border-[rgba(15,23,42,0.06)] bg-white transition-colors group ${
        index === 0 ? 'rounded-2xl shadow-card ring-1 ring-blue-500/10' : 'rounded-xl hover:bg-[rgba(15,23,42,0.015)]'
      }`}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
        style={{ background: `${color}12` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-relaxed">
          {item.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-muted">{item.time}</span>
          <span className="text-text-muted opacity-40">·</span>
          <span
            className="text-xs font-medium capitalize"
            style={{ color }}
          >
            {item.type}
          </span>
          {index === 0 && (
            <>
              <span className="text-text-muted opacity-40">·</span>
              <span className="text-xs font-semibold text-blue-primary">Latest update</span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 flex items-center gap-1.5 mt-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: item.status === 'success' ? '#10B981' : color }}
        />
      </div>
    </motion.div>
  )
}

export default function ActivityStream() {
  const [visibleItems, setVisibleItems] = useState(() =>
    activityFeed.slice(0, 6).map((item) => ({
      item,
      feedKey: `initial-${item.id}`,
    }))
  )
  const [currentIndex, setCurrentIndex] = useState(6)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        const newItem = activityFeed[currentIndex % activityFeed.length]
        return [
          { item: newItem, feedKey: `${newItem.id}-${Date.now()}` },
          ...prev.slice(0, 7),
        ]
      })
      setCurrentIndex((i) => i + 1)
    }, 2500)

    return () => clearInterval(interval)
  }, [currentIndex])

  return (
    <section className="section" id="activity">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="tag-pill tag-blue inline-flex mb-4">
              <span>Always Moving</span>
            </div>
            <h2 className="text-display-xl text-text-primary mb-6">
              Live{' '}
              <span className="gradient-text-blue">Career Activity Stream</span>
            </h2>
            <p className="text-text-muted text-lg leading-relaxed mb-8">
              Every recruiter view, interview update, shortlist, role match, and skill signal is streamed live for candidates across tech, business, healthcare, finance, sales, design, operations, and more.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Live Profile Views', value: '42' },
                { label: 'Role Matches Found', value: '12.5K+' },
                { label: 'Interview Updates', value: '8' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-4 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card"
                >
                  <div className="text-lg font-bold text-text-primary mb-1">
                    {s.value}
                  </div>
                  <div className="text-xs text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Feed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden border border-[rgba(15,23,42,0.08)] shadow-premium bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(15,23,42,0.08)] bg-[#FAFBFC]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-text-primary">Activity Stream</span>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Activity list */}
              <div className="max-h-[520px] overflow-hidden bg-[#FAFBFC] p-3 space-y-2">
                <AnimatePresence mode="popLayout">
                  {visibleItems.map(({ item, feedKey }, i) => (
                    <ActivityItem key={feedKey} item={item} index={i} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Gradient fade at bottom */}
              <div className="h-16 bg-gradient-to-t from-white to-transparent relative -mt-16 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
