'use client'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { impactChartData } from '@candmain/lib/data'
import { useCountUp } from '@candmain/hooks/useCountUp'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import { TrendingUp } from 'lucide-react'

const tabColors = [
  { id: 'users', color: '#2563EB', key: 'users' as const },
  { id: 'revenue', color: '#F97316', key: 'revenue' as const },
  { id: 'adoption', color: '#10B981', key: 'adoption' as const },
  { id: 'conversion', color: '#8B5CF6', key: 'conversion' as const },
]

const formatMetricValue = (value: number, activeTab: string, format: { openings: string; views: string }) => {
  if (activeTab === 'revenue') return `${(value * 100).toLocaleString()} ${format.openings}`
  if (activeTab === 'adoption' || activeTab === 'conversion') return `${value}%`
  return `${value.toLocaleString()} ${format.views}`
}

const CustomTooltip = ({ active, payload, label, tab, format }: any) => {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-xl text-xs max-w-[230px]">
      <div className="font-semibold mb-1">{label} {tab.liveReading}</div>
      <div className="text-lg font-black" style={{ color: tab.color }}>
        {formatMetricValue(value, tab.id, format)}
      </div>
      <div className="text-white/65 mt-1 leading-relaxed">{tab.plain}</div>
    </div>
  )
}

function ImpactChart({
  activeTab,
  chartData,
  tabs,
  format,
}: {
  activeTab: string
  chartData: typeof impactChartData
  tabs: Array<{ id: string; color: string; key: 'users' | 'revenue' | 'adoption' | 'conversion'; liveReading?: string; plain: string }>
  format: { openings: string; views: string }
}) {
  const tab = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={tab.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={tab.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => activeTab === 'revenue' ? `${v * 100}` : activeTab === 'users' ? `${v}` : `${v}%`}
          />
          <Tooltip content={<CustomTooltip tab={tab} format={format} />} />
          <Area
            type="monotone"
            dataKey={tab.key}
            stroke={tab.color}
            strokeWidth={2.5}
            fill={`url(#grad-${activeTab})`}
            dot={false}
            activeDot={{ r: 5, fill: tab.color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TopMetricCardProps {
  metric: { label: string; value: number; suffix: string; prefix: string; color: string; detail: string }
  index: number
}

function TopMetricCard({ metric, index }: TopMetricCardProps) {
  const { formatted, ref } = useCountUp({
    end: metric.value,
    duration: 2000 + index * 200,
    prefix: metric.prefix,
    suffix: metric.suffix,
  })
  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="p-5 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: metric.color }} />
        <span className="text-xs font-medium text-text-muted">{metric.label}</span>
      </div>
      <div
        className="text-3xl font-bold tracking-tight metric-value mb-1"
        style={{ color: metric.color }}
      >
        {formatted}
      </div>
      <div className="text-xs text-text-muted">{metric.detail}</div>
    </motion.div>
  )
}

export default function ImpactDashboard() {
  const content = useCandmainLandingContent()
  const imp = content.impact
  const tabs = imp.tabs.map((tab, i) => ({
    ...tab,
    ...tabColors[i],
    liveReading: imp.liveReading,
  }))

  const [activeTab, setActiveTab] = useState('users')
  const [chartData, setChartData] = useState(impactChartData)
  const [lastUpdated, setLastUpdated] = useState('')
  const activeTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0]
  const latest = chartData[chartData.length - 1]
  const previous = chartData[chartData.length - 2]
  const latestValue = latest[activeTabMeta.key]
  const previousValue = previous[activeTabMeta.key]
  const delta = latestValue - previousValue
  const trendLabel = delta >= 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()

  const liveMetrics = useMemo(
    () => [
      { label: imp.metrics[0].label, value: latest.users, suffix: '', prefix: '', color: '#2563EB', detail: imp.metrics[0].detail },
      { label: imp.metrics[1].label, value: latest.revenue * 100, suffix: '+', prefix: '', color: '#F97316', detail: imp.metrics[1].detail },
      { label: imp.metrics[2].label, value: latest.adoption, suffix: '%', prefix: '', color: '#10B981', detail: imp.metrics[2].detail },
      { label: imp.metrics[3].label, value: latest.conversion, suffix: '%', prefix: '', color: '#8B5CF6', detail: imp.metrics[3].detail },
    ],
    [latest, imp.metrics]
  )

  useEffect(() => {
    const update = () => {
      setLastUpdated(new Date().toLocaleTimeString(content.dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }

    update()
    const interval = window.setInterval(() => {
      setChartData((current) =>
        current.map((point, index) => {
          if (index !== current.length - 1) return point

          return {
            ...point,
            users: Math.max(1, point.users + Math.floor(Math.random() * 35) - 8),
            revenue: Math.max(1, point.revenue + Math.floor(Math.random() * 5) - 1),
            adoption: Math.min(99, Math.max(60, point.adoption + Math.floor(Math.random() * 3) - 1)),
            conversion: Math.min(95, Math.max(20, point.conversion + Math.floor(Math.random() * 3) - 1)),
          }
        })
      )
      update()
    }, 1800)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTab((current) => {
        const index = tabs.findIndex((tab) => tab.id === current)
        return tabs[(index + 1) % tabs.length].id
      })
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section className="section animated-gradient-bg" id="impact">
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
            <span>{imp.tag}</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            {imp.title}{' '}
            <span className="gradient-text-blue">{imp.titleAccent}</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">{imp.subtitle}</p>
        </motion.div>

        {/* Top metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {liveMetrics.map((metric, i) => (
            <TopMetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>

        {/* Chart panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl bg-white border border-[rgba(15,23,42,0.08)] shadow-premium overflow-hidden"
        >
          {/* Chart header */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-[rgba(15,23,42,0.06)]">
            <div>
              <h3 className="font-bold text-text-primary">{imp.chartTitle}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {imp.chartUpdated} {lastUpdated || 'now'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div
              className="mb-5 rounded-2xl border p-4 grid md:grid-cols-[1fr_auto] gap-4 items-center"
              style={{ background: `${activeTabMeta.color}0D`, borderColor: `${activeTabMeta.color}20` }}
            >
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: activeTabMeta.color }}>
                  {imp.graphMeaning}
                </div>
                <div className="text-sm font-bold text-text-primary mt-1">{activeTabMeta.insight}</div>
                <div className="text-xs text-text-muted mt-1">{activeTabMeta.plain}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 min-w-[210px]">
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <div className="text-[9px] uppercase font-bold text-text-muted">{imp.latest}</div>
                  <div className="text-lg font-black" style={{ color: activeTabMeta.color }}>
                    {formatMetricValue(latestValue, activeTab, imp.format)}
                  </div>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <div className="text-[9px] uppercase font-bold text-text-muted">{imp.change}</div>
                  <div className="text-lg font-black text-emerald-600">
                    {activeTab === 'revenue' ? `${Number(delta * 100).toLocaleString()}` : trendLabel}
                  </div>
                </div>
              </div>
            </div>

            <ImpactChart activeTab={activeTab} chartData={chartData} tabs={tabs} format={imp.format} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
