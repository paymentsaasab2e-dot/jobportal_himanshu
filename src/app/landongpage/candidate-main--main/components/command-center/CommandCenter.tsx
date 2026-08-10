'use client'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  Users, MessageSquare, Gift, Mic2, Sparkles, Building2, ChevronDown
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainStat } from '@/lib/candmain-landing'
import { fetchFromApi } from '@/lib/api-base'
import { getStoredToken } from '@/lib/auth-storage'
import { fetchPublicEvents, type PortalEventRow } from '@/lib/public-events-api'
import { SUGGESTION_COURSE_CATALOG } from '@/lib/suggestions-engine/catalog'

const icons = [Users, MessageSquare, Gift, Mic2, Sparkles, Building2]

type LiveJobRow = {
  id?: string | number
  title?: string
  company?: { name?: string } | string
  companyName?: string
  location?: string
  city?: string
  country?: string
  industry?: string
  postedAt?: string
  createdAt?: string
  updatedAt?: string
}

function jobCompanyName(job: LiveJobRow): string {
  if (typeof job.company === 'string' && job.company.trim()) return job.company.trim()
  if (job.company && typeof job.company === 'object' && job.company.name?.trim()) {
    return job.company.name.trim()
  }
  return String(job.companyName || '').trim()
}

function jobPlace(job: LiveJobRow): string {
  return String(job.location || job.city || job.country || '').trim()
}

function jobTime(job: LiveJobRow): number {
  const raw = job.postedAt || job.createdAt || job.updatedAt || 0
  const n = new Date(String(raw)).getTime()
  return Number.isFinite(n) ? n : 0
}

function formatEventWhen(iso: string): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  try {
    return new Date(t).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function extractJobs(payload: unknown): LiveJobRow[] {
  const root = payload as {
    data?: { jobs?: LiveJobRow[] } | LiveJobRow[]
    jobs?: LiveJobRow[]
  }
  if (Array.isArray(root?.data?.jobs)) return root.data!.jobs as LiveJobRow[]
  if (Array.isArray(root?.data)) return root.data as LiveJobRow[]
  if (Array.isArray(root?.jobs)) return root.jobs
  return []
}

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

function TickerBar({
  items,
  label,
  loading,
}: {
  items: string[]
  label: string
  loading?: boolean
}) {
  const loop = items.length > 0 ? [...items, ...items] : []

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
        {loading && items.length === 0 ? (
          <span className="text-xs text-white/50 font-medium">Loading live updates…</span>
        ) : items.length === 0 ? (
          <span className="text-xs text-white/50 font-medium">No live items yet</span>
        ) : (
          <motion.div
            key={label + items.slice(0, 3).join('|')}
            animate={{ x: [0, -Math.max(800, items.length * 220)] }}
            transition={{ duration: Math.max(20, items.length * 4), repeat: Infinity, ease: 'linear' }}
            className="flex gap-8 whitespace-nowrap"
          >
            {loop.map((item, i) => (
              <span key={`${item}-${i}`} className="text-xs text-white/60 font-medium flex items-center gap-2">
                <span className="text-blue-primary">◆</span>
                {item}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function extractCourses(payload: unknown): { title?: string; level?: string; category?: string }[] {
  const root = payload as {
    data?: unknown
    success?: boolean
  }
  const data = root?.data
  if (Array.isArray(data)) return data as { title?: string; level?: string; category?: string }[]
  if (data && typeof data === 'object' && Array.isArray((data as { courses?: unknown }).courses)) {
    return (data as { courses: { title?: string; level?: string; category?: string }[] }).courses
  }
  return []
}

export default function CommandCenter() {
  const content = useCandmainLandingContent()
  const { commandCenter: c } = content
  const [jobs, setJobs] = useState<LiveJobRow[]>([])
  const [events, setEvents] = useState<PortalEventRow[]>([])
  const [courses, setCourses] = useState<{ title: string; meta?: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const token = getStoredToken()
        const [jobsRes, eventRows, courseRows] = await Promise.all([
          fetchFromApi('/jobs?page=1&limit=40').then(async (res) => {
            if (!res.ok) return [] as LiveJobRow[]
            return extractJobs(await res.json())
          }),
          fetchPublicEvents(undefined, 'upcoming').catch(() => [] as PortalEventRow[]),
          (async () => {
            if (!token) return [] as { title: string; meta?: string }[]
            try {
              const res = await fetchFromApi('/lms/courses', {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })
              if (!res.ok) return [] as { title: string; meta?: string }[]
              return extractCourses(await res.json())
                .map((row) => {
                  const title = String(row.title || '').trim()
                  if (!title) return null
                  const meta = [row.level, row.category].map((v) => String(v || '').trim()).filter(Boolean).join(' · ')
                  return { title, meta: meta || undefined }
                })
                .filter(Boolean) as { title: string; meta?: string }[]
            } catch {
              return [] as { title: string; meta?: string }[]
            }
          })(),
        ])
        if (cancelled) return
        setJobs(Array.isArray(jobsRes) ? jobsRes : [])
        setEvents(Array.isArray(eventRows) ? eventRows : [])
        if (courseRows.length > 0) {
          setCourses(courseRows)
        } else {
          // Public landing fallback: LMS catalog (API requires login)
          setCourses(
            SUGGESTION_COURSE_CATALOG.slice(0, 8).map((course) => ({
              title: course.title,
              meta: course.paid ? 'LMS' : undefined,
            })),
          )
        }
      } catch {
        if (!cancelled) {
          setJobs([])
          setEvents([])
          setCourses(
            SUGGESTION_COURSE_CATALOG.slice(0, 8).map((course) => ({
              title: course.title,
              meta: 'LMS',
            })),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const tickerItems = useMemo(() => {
    const sortedJobs = [...jobs].sort((a, b) => jobTime(b) - jobTime(a))

    const openedJobs = sortedJobs
      .map((job) => {
        const title = String(job.title || '').trim()
        if (!title) return ''
        const company = jobCompanyName(job)
        const place = jobPlace(job)
        const bits = [title, company ? `@ ${company}` : '', place ? `· ${place}` : '']
          .filter(Boolean)
          .join(' ')
        return `Opened Job: ${bits}`
      })
      .filter(Boolean)
      .slice(0, 10)

    const liveEvents = events
      .map((ev) => {
        const title = String(ev.title || '').trim()
        if (!title) return ''
        const when = formatEventWhen(ev.scheduledAt)
        const place = String(ev.location || ev.mode || '').trim()
        return `Live Event: ${title}${when ? ` · ${when}` : ''}${place ? ` · ${place}` : ''}`
      })
      .filter(Boolean)
      .slice(0, 10)

    const liveCourses = courses
      .map((course) => {
        const title = String(course.title || '').trim()
        if (!title) return ''
        return `Course: ${title}${course.meta ? ` · ${course.meta}` : ''}`
      })
      .filter(Boolean)
      .slice(0, 10)

    // Interleave: events → opened jobs → courses for a mixed Live Feed
    const mixed: string[] = []
    const max = Math.max(liveEvents.length, openedJobs.length, liveCourses.length)
    for (let i = 0; i < max; i += 1) {
      if (liveEvents[i]) mixed.push(liveEvents[i])
      if (openedJobs[i]) mixed.push(openedJobs[i])
      if (liveCourses[i]) mixed.push(liveCourses[i])
    }

    const unique = Array.from(new Set(mixed)).slice(0, 24)
    return unique.length ? unique : c.ticker
  }, [jobs, events, courses, c.ticker])

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
          {c.subtitle ? (
            <p className="text-text-muted text-lg max-w-2xl mx-auto">{c.subtitle}</p>
          ) : null}
        </motion.div>

        <div className="command-center-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10 py-4">
          {c.stats.map((stat, i) => (
            <StatCard key={stat.id} stat={stat} index={i} />
          ))}
        </div>

        <TickerBar items={tickerItems} label={c.liveFeed} loading={loading} />
      </div>
    </section>
  )
}
