'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2, Layers, Search, Shield, Rocket,
  Gauge, MessageSquare, BarChart2, Globe, FileText, Users, Mic2
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainActivityItem } from '@/lib/candmain-landing'
import { fetchFromApi } from '@/lib/api-base'
import { getStoredToken } from '@/lib/auth-storage'

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
  candidates: Users,
  interviews: Mic2,
  communities: MessageSquare,
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
  candidates: '#2563EB',
  interviews: '#8B5CF6',
  communities: '#EC4899',
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
  candidates: {
    bg: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.2)',
    iconBg: 'rgba(37, 99, 235, 0.14)',
    tagBg: 'rgba(37, 99, 235, 0.12)',
    accent: '#2563EB',
  },
  interviews: {
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.2)',
    iconBg: 'rgba(139, 92, 246, 0.14)',
    tagBg: 'rgba(139, 92, 246, 0.12)',
    accent: '#8B5CF6',
  },
  communities: {
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.2)',
    iconBg: 'rgba(236, 72, 153, 0.14)',
    tagBg: 'rgba(236, 72, 153, 0.12)',
    accent: '#EC4899',
  },
}

const defaultTheme = {
  bg: 'rgba(100, 116, 139, 0.08)',
  border: 'rgba(100, 116, 139, 0.18)',
  iconBg: 'rgba(100, 116, 139, 0.14)',
  tagBg: 'rgba(100, 116, 139, 0.12)',
  accent: '#64748B',
}

function relativeTime(iso?: string | null): string {
  const t = new Date(String(iso || '')).getTime()
  if (!Number.isFinite(t)) return 'just now'
  const diff = Math.max(0, Date.now() - t)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  try {
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'recently'
  }
}

/** Public-safe candidate label — never show email/phone. */
function publicCandidateName(fullName?: string | null): string {
  const name = String(fullName || '').trim()
  if (!name || /^n\/?a$/i.test(name)) return 'New member'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`
}

function clip(text: string, max = 72): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
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
      initial={{ opacity: 0, y: -18, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 22, filter: 'blur(2px)' }}
      transition={{
        layout: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
        opacity: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        y: { type: 'spring', stiffness: 280, damping: 28 },
        filter: { duration: 0.35 },
      }}
      className={`flex items-center gap-2.5 border px-2.5 py-2 transition-colors group will-change-transform ${
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

const VISIBLE_PER_CARD = 4

function StreamCard({
  title,
  feed,
  dateLocale,
  latestUpdate,
  delay,
  emptyLabel,
}: {
  title: string
  feed: CandmainActivityItem[]
  dateLocale: string
  latestUpdate: string
  delay: number
  emptyLabel: string
}) {
  const [visibleItems, setVisibleItems] = useState(() =>
    feed.slice(0, VISIBLE_PER_CARD).map((item) => ({ item, feedKey: `initial-${item.id}` }))
  )
  const [currentIndex, setCurrentIndex] = useState(VISIBLE_PER_CARD)

  useEffect(() => {
    setVisibleItems(
      feed.slice(0, VISIBLE_PER_CARD).map((item) => ({ item, feedKey: `boot-${item.id}` })),
    )
    setCurrentIndex(VISIBLE_PER_CARD)
  }, [feed])

  useEffect(() => {
    if (feed.length <= VISIBLE_PER_CARD) return
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        const newItem = feed[currentIndex % feed.length]
        return [
          { item: newItem, feedKey: `${newItem.id}-${Date.now()}` },
          ...prev.slice(0, VISIBLE_PER_CARD - 1),
        ]
      })
      setCurrentIndex((i) => i + 1)
    }, 3200)

    return () => clearInterval(interval)
  }, [currentIndex, feed])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay }}
      className="relative h-full"
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-3xl shadow-premium border"
        style={{
          borderColor: 'rgba(37, 99, 235, 0.18)',
          background:
            'linear-gradient(165deg, rgba(37, 99, 235, 0.07) 0%, rgba(20, 184, 166, 0.05) 42%, rgba(255, 255, 255, 0.98) 100%)',
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between px-4 py-2.5 border-b"
          style={{
            borderColor: 'rgba(37, 99, 235, 0.12)',
            background:
              'linear-gradient(90deg, rgba(37, 99, 235, 0.1) 0%, rgba(6, 182, 212, 0.08) 55%, rgba(255, 255, 255, 0.72) 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25" />
            <span className="text-xs font-semibold text-text-primary">{title}</span>
          </div>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-mono text-text-muted border border-[rgba(37,99,235,0.12)]">
            {new Date().toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div
          className="relative h-[292px] shrink-0 overflow-hidden p-2"
          style={{
            background:
              'linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(239, 246, 255, 0.88) 100%)',
          }}
        >
          {visibleItems.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-muted">
              {emptyLabel}
            </div>
          ) : (
            <div className="flex h-full flex-col gap-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleItems.map(({ item, feedKey }, i) => (
                  <ActivityItem key={feedKey} item={item} index={i} latestUpdate={latestUpdate} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

type LiveCandidate = {
  id?: string
  fullName?: string
  createdAt?: string
  isVerified?: boolean
}

type LivePost = {
  id?: string
  communityName?: string
  companyName?: string
  authorName?: string
  text?: string
  createdAt?: string
}

type LiveInterview = {
  id?: string
  requestId?: string
  targetRole?: string
  interviewType?: string
  category?: string
  status?: string
  preferredDate?: string
  createdAt?: string
  updatedAt?: string
}

function extractCandidates(payload: unknown): LiveCandidate[] {
  const root = payload as { data?: { candidates?: LiveCandidate[] }; candidates?: LiveCandidate[] }
  if (Array.isArray(root?.data?.candidates)) return root.data!.candidates!
  if (Array.isArray(root?.candidates)) return root.candidates!
  return []
}

function extractPosts(payload: unknown): LivePost[] {
  const root = payload as { ok?: boolean; data?: { posts?: LivePost[] }; posts?: LivePost[] }
  if (Array.isArray(root?.data?.posts)) return root.data!.posts!
  if (Array.isArray(root?.posts)) return root.posts!
  return []
}

function extractInterviews(payload: unknown): LiveInterview[] {
  const root = payload as {
    success?: boolean
    data?: LiveInterview[] | { requests?: LiveInterview[]; items?: LiveInterview[] }
  }
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray((root?.data as { requests?: LiveInterview[] })?.requests)) {
    return (root.data as { requests: LiveInterview[] }).requests
  }
  if (Array.isArray((root?.data as { items?: LiveInterview[] })?.items)) {
    return (root.data as { items: LiveInterview[] }).items
  }
  return []
}

function interviewLooksPublic(post: LivePost): boolean {
  const hay = `${post.text || ''} ${post.communityName || ''}`.toLowerCase()
  return /interview|mock interview|hiring round|hr round|panel/.test(hay)
}

export default function ActivityStream() {
  const content = useCandmainLandingContent()
  const { activity: a } = content
  const [candidateFeed, setCandidateFeed] = useState<CandmainActivityItem[]>([])
  const [interviewFeed, setInterviewFeed] = useState<CandmainActivityItem[]>([])
  const [communityFeed, setCommunityFeed] = useState<CandmainActivityItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = getStoredToken()
        const [candRes, gossipRes, interviewRes] = await Promise.all([
          fetchFromApi('/candidates?page=1&limit=20').then(async (res) => {
            if (!res.ok) return [] as LiveCandidate[]
            return extractCandidates(await res.json())
          }),
          fetchFromApi('/office-gossips/bundle').then(async (res) => {
            if (!res.ok) return [] as LivePost[]
            return extractPosts(await res.json())
          }),
          token
            ? fetchFromApi('/interview-requests/my?limit=20', {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).then(async (res) => {
                if (!res.ok) return [] as LiveInterview[]
                return extractInterviews(await res.json())
              }).catch(() => [] as LiveInterview[])
            : Promise.resolve([] as LiveInterview[]),
        ])

        if (cancelled) return

        const candidates = [...candRes].sort(
          (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0),
        )
        setCandidateFeed(
          candidates.slice(0, 12).map((row, index) => ({
            id: index + 1,
            type: 'candidates',
            typeLabel: row.isVerified ? 'Verified' : 'Joined',
            message: `New candidate joined — ${publicCandidateName(row.fullName)}`,
            time: relativeTime(row.createdAt),
            status: 'success',
          })),
        )

        const posts = [...gossipRes].sort(
          (a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0),
        )
        setCommunityFeed(
          posts.slice(0, 12).map((post, index) => {
            const where = post.communityName || post.companyName || 'Community'
            const author = String(post.authorName || 'Member').trim() || 'Member'
            const body = clip(String(post.text || 'New community post'))
            return {
              id: index + 1,
              type: 'communities',
              typeLabel: where,
              message: `${author}: ${body}`,
              time: relativeTime(post.createdAt),
              status: 'success',
            }
          }),
        )

        const fromApi = [...interviewRes].sort(
          (a, b) =>
            +new Date(b.updatedAt || b.createdAt || b.preferredDate || 0) -
            +new Date(a.updatedAt || a.createdAt || a.preferredDate || 0),
        )
        if (fromApi.length > 0) {
          setInterviewFeed(
            fromApi.slice(0, 12).map((row, index) => {
              const role = String(row.targetRole || row.category || 'Interview').trim()
              const kind = String(row.interviewType || row.status || 'Interview').trim()
              return {
                id: index + 1,
                type: 'interviews',
                typeLabel: kind,
                message: `Interview — ${role}${row.status ? ` · ${row.status.replace(/_/g, ' ')}` : ''}`,
                time: relativeTime(row.updatedAt || row.createdAt || row.preferredDate),
                status: 'success',
              }
            }),
          )
        } else {
          // Public fallback: interview-related community posts
          const interviewPosts = posts.filter(interviewLooksPublic).slice(0, 12)
          setInterviewFeed(
            interviewPosts.map((post, index) => ({
              id: index + 1,
              type: 'interviews',
              typeLabel: 'Community',
              message: clip(`Interview buzz — ${String(post.text || 'Interview activity')}`),
              time: relativeTime(post.createdAt),
              status: 'info',
            })),
          )
        }
      } catch {
        if (!cancelled) {
          setCandidateFeed([])
          setInterviewFeed([])
          setCommunityFeed([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(
    () => [
      {
        title: a.stats[0]?.label || 'Candidates',
        feed: candidateFeed,
        emptyLabel: 'No newly joined candidates yet.',
      },
      {
        title: a.stats[1]?.label || 'Interviews',
        feed: interviewFeed,
        emptyLabel: 'No interview activity yet.',
      },
      {
        title: a.stats[2]?.label || 'Communities / Posts',
        feed: communityFeed,
        emptyLabel: 'No community posts yet.',
      },
    ],
    [a.stats, candidateFeed, interviewFeed, communityFeed],
  )

  return (
    <section className="section" id="activity">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>{a.tag}</span>
          </div>
          <h2 className="text-display-xl text-text-primary">
            {a.title}{' '}
            <span className="gradient-text-blue">{a.titleAccent}</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <StreamCard
              key={card.title}
              title={card.title}
              feed={card.feed}
              dateLocale={content.dateLocale}
              latestUpdate={a.latestUpdate}
              delay={0.1 * i}
              emptyLabel={card.emptyLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
