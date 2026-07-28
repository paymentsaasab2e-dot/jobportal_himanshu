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
  Activity,
  Clock3,
  MousePointerClick,
  LogIn,
  Briefcase,
  Send,
  Lightbulb,
  MonitorSmartphone,
} from 'lucide-react';

type RangeKey = UserActivityRollup['range'];

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

export default function UserStatsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userId = user?.id || null;
  const [range, setRange] = useState<RangeKey>('week');
  const [rollup, setRollup] = useState<UserActivityRollup | null>(null);
  const [rawUpdatedAt, setRawUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setRollup(null);
      return;
    }
    setRollup(buildUserActivityRollup(userId, range));
    try {
      setRawUpdatedAt(getUserActivityState(userId).updatedAt);
    } catch {
      setRawUpdatedAt(null);
    }
  }, [userId, range]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_ACTIVITY_STORAGE_KEY) refresh();
    };
    const onHq = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('saasa:hq-user-activity', onHq as EventListener);
    const timer = window.setInterval(refresh, 10_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('saasa:hq-user-activity', onHq as EventListener);
      window.clearInterval(timer);
    };
  }, [refresh]);

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
          onClick={refresh}
          className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

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
              Recent sessions
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
                      {new Date(s.startedAt).toLocaleString()}
                      {s.endedAt
                        ? ` → ${new Date(s.endedAt).toLocaleString()}`
                        : ' · active'}
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
