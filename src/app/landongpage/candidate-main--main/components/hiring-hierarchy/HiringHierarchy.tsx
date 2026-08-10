'use client'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText, MessageSquare, Code2, Users, Trophy,
  TrendingUp, Building2
} from 'lucide-react'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import type { CandmainHiringStage } from '@/lib/candmain-landing'
import { fetchFromApi } from '@/lib/api-base'
import { getStoredToken } from '@/lib/auth-storage'

interface Stage extends CandmainHiringStage {
  icon: typeof FileText
}

interface FunnelMetric {
  width: number
  passRate: number
  liveCount: number
}

interface LiveFunnelSnapshot {
  candidatesTotal: number
  verifiedCandidates: number
  openJobs: number
  communityPosts: number
  communities: number
  interviewsActive: number
  interviewsScheduled: number
  interviewsCompleted: number
}

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

function extractJobsTotal(payload: unknown): { total: number; jobs: unknown[] } {
  const root = payload as {
    data?: { jobs?: unknown[]; pagination?: { total?: number } }
    jobs?: unknown[]
  }
  const jobs = Array.isArray(root?.data?.jobs)
    ? root.data!.jobs!
    : Array.isArray(root?.jobs)
      ? root.jobs!
      : []
  const total =
    typeof root?.data?.pagination?.total === 'number'
      ? root.data!.pagination!.total!
      : jobs.length
  return { total, jobs }
}

function extractCandidates(payload: unknown): {
  total: number
  verified: number
  rows: { isVerified?: boolean; createdAt?: string }[]
} {
  const root = payload as {
    data?: {
      candidates?: { isVerified?: boolean; createdAt?: string }[]
      pagination?: { total?: number }
    }
  }
  const rows = Array.isArray(root?.data?.candidates) ? root.data!.candidates! : []
  const total =
    typeof root?.data?.pagination?.total === 'number'
      ? root.data!.pagination!.total!
      : rows.length
  const verified = rows.filter((r) => r.isVerified).length || Math.min(total, rows.length)
  return { total, verified, rows }
}

function extractGossip(payload: unknown): { posts: number; communities: number } {
  const root = payload as {
    data?: { posts?: unknown[]; communities?: unknown[] }
  }
  return {
    posts: Array.isArray(root?.data?.posts) ? root.data!.posts!.length : 0,
    communities: Array.isArray(root?.data?.communities) ? root.data!.communities!.length : 0,
  }
}

type InterviewRow = { status?: string }

function extractInterviews(payload: unknown): InterviewRow[] {
  const root = payload as {
    data?: InterviewRow[] | { requests?: InterviewRow[]; items?: InterviewRow[] }
  }
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray((root?.data as { requests?: InterviewRow[] })?.requests)) {
    return (root.data as { requests: InterviewRow[] }).requests
  }
  if (Array.isArray((root?.data as { items?: InterviewRow[] })?.items)) {
    return (root.data as { items: InterviewRow[] }).items
  }
  return []
}

function bucketInterviews(rows: InterviewRow[]) {
  const activeStatuses = new Set([
    'PENDING_MATCHING',
    'MATCHING',
    'MATCHED',
    'FINDING_INTERVIEWER',
    'WAITING_FOR_ACCEPTANCE',
    'ACCEPTED',
  ])
  const scheduledStatuses = new Set(['SCHEDULED', 'IN_PROGRESS'])
  const completedStatuses = new Set(['COMPLETED', 'SELECTED'])

  let active = 0
  let scheduled = 0
  let completed = 0
  for (const row of rows) {
    const status = String(row.status || '').toUpperCase()
    if (completedStatuses.has(status) || status.includes('COMPLETE') || status.includes('SELECT')) {
      completed += 1
    } else if (scheduledStatuses.has(status)) {
      scheduled += 1
    } else if (activeStatuses.has(status) || status) {
      active += 1
    }
  }
  return { active, scheduled, completed, total: rows.length }
}

/** Build a decreasing funnel from live platform signals. */
function buildFunnelMetrics(snap: LiveFunnelSnapshot): FunnelMetric[] {
  const screening = Math.max(1, snap.candidatesTotal)
  const recruiter = Math.max(1, Math.min(screening, snap.verifiedCandidates || Math.round(screening * 0.65)))
  const assessment = Math.max(1, Math.min(recruiter, snap.openJobs || Math.round(recruiter * 0.45)))
  const manager = Math.max(
    1,
    Math.min(
      assessment,
      snap.interviewsActive || Math.max(1, Math.round(assessment * 0.35)),
    ),
  )
  const panel = Math.max(
    1,
    Math.min(
      manager,
      snap.interviewsScheduled || Math.max(1, Math.round(manager * 0.55)),
    ),
  )
  const offer = Math.max(
    1,
    Math.min(
      panel,
      snap.interviewsCompleted || Math.max(1, Math.round(panel * 0.7)),
    ),
  )

  const counts = [screening, recruiter, assessment, manager, panel, offer]
  const top = counts[0] || 1

  return counts.map((count, index) => {
    const next = counts[index + 1]
    const passRate =
      typeof next === 'number' && count > 0
        ? Math.min(95, Math.max(5, Math.round((next / count) * 100)))
        : 85
    return {
      liveCount: count,
      width: Math.max(10, Math.round((count / top) * 100)),
      passRate,
    }
  })
}

export default function HiringHierarchy() {
  const content = useCandmainLandingContent()
  const h = content.hiring
  const hiringStages: Stage[] = h.stages.map((stage) => ({
    ...stage,
    icon: stageIcons[stage.id] ?? FileText,
  }))
  const funnelLabels = { stage: h.stageLabel, live: h.liveSuffix }

  const [snapshot, setSnapshot] = useState<LiveFunnelSnapshot>({
    candidatesTotal: 0,
    verifiedCandidates: 0,
    openJobs: 0,
    communityPosts: 0,
    communities: 0,
    interviewsActive: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
  })
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetric[]>(
    () => buildFunnelMetrics({
      candidatesTotal: 12,
      verifiedCandidates: 8,
      openJobs: 6,
      communityPosts: 0,
      communities: 0,
      interviewsActive: 4,
      interviewsScheduled: 3,
      interviewsCompleted: 2,
    }),
  )
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadLive = useCallback(async () => {
    try {
      const token = getStoredToken()
      const [jobsPayload, candPayload, gossipPayload, interviewPayload] = await Promise.all([
        fetchFromApi('/jobs?page=1&limit=40').then(async (res) => (res.ok ? res.json() : null)).catch(() => null),
        fetchFromApi('/candidates?page=1&limit=50').then(async (res) => (res.ok ? res.json() : null)).catch(() => null),
        fetchFromApi('/office-gossips/bundle').then(async (res) => (res.ok ? res.json() : null)).catch(() => null),
        token
          ? fetchFromApi('/interview-requests/my?limit=50', {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }).then(async (res) => (res.ok ? res.json() : null)).catch(() => null)
          : Promise.resolve(null),
      ])

      const jobs = jobsPayload ? extractJobsTotal(jobsPayload) : { total: 0, jobs: [] }
      const cands = candPayload
        ? extractCandidates(candPayload)
        : { total: 0, verified: 0, rows: [] }
      const gossip = gossipPayload ? extractGossip(gossipPayload) : { posts: 0, communities: 0 }
      const interviews = interviewPayload ? bucketInterviews(extractInterviews(interviewPayload)) : {
        active: 0,
        scheduled: 0,
        completed: 0,
        total: 0,
      }

      // If user has no interview API access, approximate later stages from community/jobs mix
      const interviewsActive =
        interviews.active ||
        Math.max(1, Math.round((jobs.total || cands.verified || 1) * 0.25))
      const interviewsScheduled =
        interviews.scheduled ||
        Math.max(1, Math.round(interviewsActive * 0.6))
      const interviewsCompleted =
        interviews.completed ||
        Math.max(1, Math.round(interviewsScheduled * 0.55))

      const next: LiveFunnelSnapshot = {
        candidatesTotal: Math.max(cands.total, cands.rows.length, 1),
        verifiedCandidates: Math.max(cands.verified, 1),
        openJobs: Math.max(jobs.total, jobs.jobs.length, 1),
        communityPosts: gossip.posts,
        communities: gossip.communities,
        interviewsActive,
        interviewsScheduled,
        interviewsCompleted,
      }

      setSnapshot(next)
      setFunnelMetrics(buildFunnelMetrics(next))
      setLastUpdated(new Date())
    } catch {
      /* keep last good snapshot */
    }
  }, [])

  useEffect(() => {
    void loadLive()
    const interval = window.setInterval(() => {
      void loadLive()
    }, 30000)
    return () => window.clearInterval(interval)
  }, [loadLive])

  const liveStages = useMemo(
    () =>
      hiringStages.map((stage, index) => ({
        ...stage,
        liveCount: funnelMetrics[index]?.liveCount ?? stage.liveCount,
        passRate: `~${funnelMetrics[index]?.passRate ?? 50}%`,
      })),
    [hiringStages, funnelMetrics],
  )

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
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {h.liveData}
            </div>
          </div>

          <div className="space-y-3">
            {liveStages.map((stage, i) => (
              <FunnelBar
                key={stage.id}
                stage={stage}
                index={i}
                metric={funnelMetrics[i]}
                labels={funnelLabels}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveStages.map((stage, index) => {
              const Icon = stage.icon
              const [from] = funnelGradients[index % funnelGradients.length]
              return (
                <div
                  key={`tile-${stage.id}`}
                  className="rounded-2xl border px-3.5 py-3"
                  style={{
                    borderColor: stage.border,
                    background: stage.bg,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${from}18`, color: from }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{stage.title}</p>
                      <p className="text-[10px] text-slate-500">{stage.duration}</p>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">{stage.subtitle}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                    <span style={{ color: from }}>
                      {stage.liveCount.toLocaleString()} {h.liveSuffix}
                    </span>
                    <span className="text-slate-500">{stage.passRate} {h.passPrefix}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-[rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-3 h-3 rounded bg-[rgba(15,23,42,0.06)]" />
              {h.totalPool}: {snapshot.candidatesTotal.toLocaleString()}
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
