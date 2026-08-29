'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import {
  buildUserActivityRollup,
  categoryLabel,
  formatDuration,
  getUserActivityState,
  USER_ACTIVITY_STORAGE_KEY,
  type ActivityCategory,
  type UserActivityRollup,
} from '@/lib/user-activity-tracker';
import {
  buildHqInterestSnapshot,
  INTEREST_AFFINITY_HQ_EVENT,
  type HqInterestTopic,
} from '@/lib/interest-affinity-store';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import {
  Activity,
  Clock3,
  MousePointerClick,
  LogIn,
  Briefcase,
  Send,
  Lightbulb,
  MonitorSmartphone,
  MapPin,
  Globe,
  Sparkles,
} from 'lucide-react';

type RangeKey = UserActivityRollup['range'];

type ServerSession = {
  id: string;
  loginAt?: string;
  logoutAt?: string | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
  isActive?: boolean | null;
  createdAt?: string;
  lastUsedAt?: string;
};

type ServerSessionSummary = {
  total: number;
  active: number;
  uniqueIps: number;
  uniqueDevices: number;
};

const RANGES: Array<{ id: RangeKey; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 days' },
  { id: 'month', label: '30 days' },
  { id: 'all', label: 'All time' },
];

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function severityStyles(severity: string) {
  if (severity === 'action') return 'border-amber-300 bg-amber-50 text-amber-950';
  if (severity === 'watch') return 'border-sky-200 bg-sky-50 text-sky-950';
  return 'border-slate-200 bg-slate-50 text-slate-800';
}

function formatSessionDuration(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  return formatDuration(ms);
}

const INTEREST_BAR_COLORS = [
  '#2098C8',
  '#176F96',
  '#2098C8',
  '#0D9488',
  '#6366F1',
  '#DB2777',
  '#CA8A04',
  '#475569',
];

function InterestBars({ topics }: { topics: HqInterestTopic[] }) {
  if (!topics.length) {
    return (
      <p className="text-sm text-slate-500">
        No multi-interest scores yet. Browse jobs, LMS, or Office Gossips to build them.
      </p>
    );
  }
  const max = Math.max(100, ...topics.map((t) => t.score));
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <ul className="space-y-3">
        {topics.map((topic, i) => {
          const pct = Math.max(2, Math.round((topic.score / max) * 100));
          const color = INTEREST_BAR_COLORS[i % INTEREST_BAR_COLORS.length]!;
          return (
            <li key={topic.key}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{topic.label}</span>
                <span className="tabular-nums text-slate-600">
                  {Math.round(topic.score)}
                  <span className="text-xs text-slate-400"> / 100</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                  title={`${topic.label}: ${Math.round(topic.score)}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {/* Simple column spark for top interests */}
      <div className="mt-5 flex h-28 items-end justify-between gap-1.5 border-t border-slate-100 pt-4">
        {topics.slice(0, 8).map((topic, i) => {
          const barPx = Math.max(8, Math.round((Math.min(100, topic.score) / 100) * 88));
          const color = INTEREST_BAR_COLORS[i % INTEREST_BAR_COLORS.length]!;
          return (
            <div key={topic.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-slate-600">
                {Math.round(topic.score)}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t-md transition-all"
                style={{ height: barPx, background: color }}
                title={topic.label}
              />
              <span className="w-full truncate text-center text-[9px] text-slate-500">
                {topic.label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UserStatsPage() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const userId = user?.id || null;
  const [range, setRange] = useState<RangeKey>('week');
  const [rollup, setRollup] = useState<UserActivityRollup | null>(null);
  const [rawUpdatedAt, setRawUpdatedAt] = useState<string | null>(null);
  const [serverSessions, setServerSessions] = useState<ServerSession[]>([]);
  const [serverSummary, setServerSummary] = useState<ServerSessionSummary | null>(null);
  const [interestTopics, setInterestTopics] = useState<HqInterestTopic[]>([]);

  const refresh = useCallback(() => {
    if (!userId) {
      setRollup(null);
      setInterestTopics([]);
      return;
    }
    setRollup(buildUserActivityRollup(userId, range));
    try {
      setRawUpdatedAt(getUserActivityState(userId).updatedAt);
    } catch {
      setRawUpdatedAt(null);
    }
    try {
      setInterestTopics(buildHqInterestSnapshot(userId).topics);
    } catch {
      setInterestTopics([]);
    }
  }, [userId, range]);

  const refreshServerSessions = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setServerSessions([]);
      setServerSummary(null);
      return;
    }
    try {
      const base = String(API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${base}/auth/sessions?limit=40`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: { sessions?: ServerSession[]; summary?: ServerSessionSummary };
      } | null;
      if (!res.ok || !json?.success || !json.data) return;
      setServerSessions(Array.isArray(json.data.sessions) ? json.data.sessions : []);
      setServerSummary(json.data.summary || null);
    } catch {
      /* keep local rollup if API unavailable */
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_ACTIVITY_STORAGE_KEY) refresh();
    };
    const onHq = () => refresh();
    const onInterest = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('saasa:hq-user-activity', onHq as EventListener);
    window.addEventListener(INTEREST_AFFINITY_HQ_EVENT, onInterest as EventListener);
    const timer = window.setInterval(refresh, 10_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('saasa:hq-user-activity', onHq as EventListener);
      window.removeEventListener(INTEREST_AFFINITY_HQ_EVENT, onInterest as EventListener);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    void refreshServerSessions();
    const timer = window.setInterval(() => void refreshServerSessions(), 60_000);
    return () => window.clearInterval(timer);
  }, [refreshServerSessions]);

  const categoryRows = useMemo(() => {
    if (!rollup) return [];
    return Object.entries(rollup.pageVisitsByCategory)
      .map(([k, v]) => ({
        category: k as ActivityCategory,
        count: v || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [rollup]);

  const timeRows = useMemo(() => {
    if (!rollup) return [];
    return Object.entries(rollup.activeMsByCategory || {})
      .map(([k, v]) => ({
        category: k as ActivityCategory,
        ms: v || 0,
      }))
      .filter((r) => r.ms > 0)
      .sort((a, b) => b.ms - a.ms);
  }, [rollup]);

  const firstOpenRows = useMemo(() => {
    if (!rollup) return [];
    return Object.entries(rollup.firstOpenBreakdown)
      .map(([k, v]) => ({
        category: k as ActivityCategory,
        count: v || 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [rollup]);

  if (isLoading) return <GlobalLoader />;

  if (!isAuthenticated || !userId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">User stats</h1>
        <p className="mt-2 text-slate-600">Sign in to see your activity counts.</p>
        <Link href="/login" className="mt-4 inline-block text-blue-600 underline">
          Go to login
        </Link>
      </div>
    );
  }

  const snap = rollup?.profileSnapshot;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Behaviour tracking · per user (local) · HQ later
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Your activity stats
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          User <span className="font-mono text-slate-800">{userId}</span>
          {rawUpdatedAt ? (
            <>
              {' '}
              · updated {new Date(rawUpdatedAt).toLocaleString()}
            </>
          ) : null}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              range === r.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            refresh();
            void refreshServerSessions();
          }}
          className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Login sessions (server)
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Each successful sign-in creates a session id with device, IP, and location when
          available.
        </p>
        {serverSummary ? (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              icon={LogIn}
              label="Sessions loaded"
              value={serverSummary.total}
              hint={`${serverSummary.active} active`}
            />
            <Metric icon={Globe} label="Unique IPs" value={serverSummary.uniqueIps} />
            <Metric
              icon={MonitorSmartphone}
              label="Unique devices"
              value={serverSummary.uniqueDevices}
            />
            <Metric
              icon={MapPin}
              label="With location"
              value={serverSessions.filter((s) => s.country || s.city).length}
            />
          </div>
        ) : null}
        {serverSessions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No server login sessions yet. Sign out and sign in again to create one.
          </p>
        ) : (
          <ul className="space-y-2">
            {serverSessions.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">{s.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      s.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.isActive !== false ? 'Active' : 'Closed'}
                  </span>
                </div>
                <p className="mt-1 text-slate-700">
                  Login:{' '}
                  {s.loginAt || s.createdAt
                    ? new Date(String(s.loginAt || s.createdAt)).toLocaleString()
                    : '—'}
                  {s.logoutAt
                    ? ` · Logout: ${new Date(s.logoutAt).toLocaleString()}`
                    : ''}
                  {` · ${formatSessionDuration(s.durationMs)}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[s.deviceType, s.browser, s.operatingSystem]
                    .filter(Boolean)
                    .join(' · ') || 'Device unknown'}
                  {s.ipAddress ? ` · IP ${s.ipAddress}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[s.city, s.state, s.country].filter(Boolean).join(', ') ||
                    'Location unknown'}
                  {s.timezone ? ` · ${s.timezone}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-sky-500" />
          Multi-interest scores
        </h2>
        <p className="mb-3 text-sm text-slate-600">
          Strength of each interest topic (0–100) from behaviour + Office Gossips —
          used for suggestions and HQ personalization.
        </p>
        <InterestBars topics={interestTopics} />
      </section>

      {rollup ? (
        <>
          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Metric
              icon={LogIn}
              label="Logins / sessions"
              value={rollup.logins}
              hint={`${rollup.sessionCount} unique session ids`}
            />
            <Metric
              icon={Activity}
              label="Page visits"
              value={rollup.visits}
              hint={`${rollup.daysActive} active days`}
            />
            <Metric
              icon={MousePointerClick}
              label="Job card clicks"
              value={rollup.jobCardClicks}
            />
            <Metric
              icon={Send}
              label="Applies tracked"
              value={rollup.applies}
              hint={
                snap
                  ? `${snap.applicationsTotal} apps in portal · ${snap.rejectionsTotal} rejections`
                  : undefined
              }
            />
            <Metric
              icon={Clock3}
              label="Time spent"
              value={formatDuration(rollup.activeMs)}
              hint={`Avg ${formatDuration(rollup.avgActiveMsPerDay)} / active day`}
            />
            <Metric
              icon={Briefcase}
              label="Most opened first"
              value={
                rollup.topFirstOpen
                  ? categoryLabel(rollup.topFirstOpen)
                  : '—'
              }
              hint="First meaningful page each day"
            />
            <Metric
              icon={Lightbulb}
              label="Skills (profile)"
              value={snap?.skillsCount ?? '—'}
              hint={
                snap?.cvScore != null
                  ? `CV ${Math.round(snap.cvScore)}% · profile ${
                      snap.profileCompleteness != null
                        ? `${Math.round(snap.profileCompleteness)}%`
                        : '—'
                    }`
                  : 'Synced from dashboard'
              }
            />
            <Metric
              icon={MonitorSmartphone}
              label="Range"
              value={`${rollup.fromDate} → ${rollup.toDate}`}
            />
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Behaviour insights
            </h2>
            <p className="mb-3 text-sm text-slate-600">
              Patterns from full activity (visits, time, clicks, applies) — already
              used to prefer / deprioritize chat suggestions.
            </p>
            <ul className="space-y-3">
              {rollup.insights.map((insight) => (
                <li
                  key={insight.id}
                  className={`rounded-xl border px-4 py-3 ${severityStyles(insight.severity)}`}
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold">{insight.label}</span>
                    <span className="text-xs uppercase opacity-70">
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{insight.summary}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {insight.evidence.map((e) => (
                      <li
                        key={e}
                        className="rounded-md bg-white/70 px-2 py-0.5 text-xs"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Visits by area
              </h2>
              {categoryRows.length === 0 ? (
                <p className="text-sm text-slate-500">No visits in this range yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {categoryRows.map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-slate-700">
                        {categoryLabel(row.category)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Time spent by area
              </h2>
              {timeRows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No time attributed yet — stay on pages with the tab visible.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {timeRows.map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-slate-700">
                        {categoryLabel(row.category)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {formatDuration(row.ms)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                First open of day
              </h2>
              {firstOpenRows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No first-open data yet — browse jobs, LMS, or premium.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {firstOpenRows.map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-slate-700">
                        {categoryLabel(row.category)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-900">
                        {row.count} day{row.count === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Suggestion preferences (from behaviour)
              </h2>
              {rollup.behaviourSignals ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 space-y-2">
                  <p>
                    <span className="text-slate-500">Prefer: </span>
                    {(rollup.behaviourSignals.preferSlotIds || []).join(', ') || '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Deprioritize: </span>
                    {(rollup.behaviourSignals.deprioritizeSlotIds || []).join(', ') ||
                      '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Insights: </span>
                    {(rollup.behaviourSignals.insightIds || []).join(', ') || 'balanced'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Collecting behaviour…</p>
              )}
            </section>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Full activity timeline
            </h2>
            <p className="mb-3 text-sm text-slate-600">
              Every visit, job click, apply, login, and time slice — not only first open.
            </p>
            {!rollup.recentEvents?.length ? (
              <p className="text-sm text-slate-500">No events yet.</p>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {rollup.recentEvents.map((ev) => (
                  <li key={ev.id} className="px-4 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">
                        {ev.type.replace(/_/g, ' ')} · {categoryLabel(ev.category)}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500">
                        {new Date(ev.at).toLocaleString()}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {ev.path || '—'}
                      {ev.sessionId ? ` · ${ev.sessionId}` : ''}
                      {typeof ev.meta?.jobId === 'string'
                        ? ` · job ${ev.meta.jobId}`
                        : ''}
                      {typeof ev.meta?.durationMs === 'number'
                        ? ` · ${formatDuration(ev.meta.durationMs as number)}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Recent browsing sessions (this device)
            </h2>
            {rollup.recentSessions.length === 0 ? (
              <p className="text-sm text-slate-500">No sessions recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {rollup.recentSessions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500">{s.id}</span>
                      <span className="tabular-nums text-slate-700">
                        {formatDuration(s.durationMs)} · {s.pageCount} pages
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      Login: {new Date(s.startedAt).toLocaleString()}
                      {s.endedAt
                        ? ` · Logout: ${new Date(s.endedAt).toLocaleString()}`
                        : ' · active'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[
                        s.deviceType,
                        s.browser,
                        s.operatingSystem,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Device unknown'}
                      {s.ipAddress ? ` · IP ${s.ipAddress}` : ''}
                      {[s.city, s.state, s.country].filter(Boolean).length
                        ? ` · ${[s.city, s.state, s.country].filter(Boolean).join(', ')}`
                        : ''}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {s.firstPath || '—'}
                      {s.lastPath && s.lastPath !== s.firstPath
                        ? ` → ${s.lastPath}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p className="text-slate-600">No activity data yet. Browse the app to start counting.</p>
      )}
    </div>
  );
}
