'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api-base';

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  source?: string | null;
  status?: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  capturedAt?: string;
};

type HqRelease = {
  releaseId: string;
  generatedAt?: string;
  summary?: {
    eventCount?: number;
    byAction?: Record<string, number>;
    highRiskActions?: Array<Record<string, unknown>>;
  };
  window?: { sinceHours?: number; from?: string; to?: string };
  events?: AuditEvent[];
  attachHints?: Record<string, string>;
};

const ADMIN_KEY_STORAGE = 'saasa:system-audit-admin-key';

function adminHeaders(adminKey: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (adminKey.trim()) {
    headers['x-internal-admin-key'] = adminKey.trim();
  }
  return headers;
}

export default function AdministrationPage() {
  const [adminKey, setAdminKey] = useState('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [release, setRelease] = useState<HqRelease | null>(null);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  useEffect(() => {
    try {
      setAdminKey(localStorage.getItem(ADMIN_KEY_STORAGE) || '');
    } catch {
      /* ignore */
    }
  }, []);

  const persistKey = (value: string) => {
    setAdminKey(value);
    try {
      localStorage.setItem(ADMIN_KEY_STORAGE, value);
    } catch {
      /* ignore */
    }
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      if (entityFilter.trim()) params.set('entityType', entityFilter.trim());

      const res = await fetch(`${API_BASE_URL}/audit/events?${params}`, {
        headers: adminHeaders(adminKey),
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Failed to load audit logs (${res.status})`);
      }
      setEvents(json.data?.events || []);
      setTotal(json.data?.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [adminKey, q, actionFilter, entityFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const createHqRelease = async (persist: boolean) => {
    setReleaseBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/audit/hq/release?sinceHours=24&limit=200${persist ? '&persist=1' : ''}`,
        {
          method: persist ? 'POST' : 'GET',
          headers: adminHeaders(adminKey),
          body: persist
            ? JSON.stringify({
                sinceHours: 24,
                limit: 200,
                acknowledge: true,
                hqSystemId: 'portal-admin-ui',
                note: 'Released from Administration UI',
              })
            : undefined,
          cache: 'no-store',
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'HQ release failed');
      }
      setRelease(json.data?.release || null);
      if (persist) void loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'HQ release failed');
    } finally {
      setReleaseBusy(false);
    }
  };

  const actionOptions = useMemo(() => {
    const set = new Set(events.map((e) => e.action).filter(Boolean));
    return [...set].sort();
  }, [events]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Administration
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                System audit logs for administrative actions — who changed what, when. Use HQ
                Release to package recent logs for management / HQ systems.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/superadminpage"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Super admin
              </Link>
              <Link
                href="/help"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Help
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin key <span className="font-normal normal-case">(x-internal-admin-key)</span>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => persistKey(e.target.value)}
                placeholder="Leave empty in local if no key configured"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => void loadEvents()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={releaseBusy}
                onClick={() => void createHqRelease(false)}
                className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                Preview HQ release
              </button>
              <button
                type="button"
                disabled={releaseBusy}
                onClick={() => void createHqRelease(true)}
                className="rounded-lg bg-[#08428c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-50"
              >
                Persist HQ release
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {release ? (
          <section className="mb-6 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">HQ release package</h2>
              <span className="font-mono text-xs text-slate-500">{release.releaseId}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Generated {release.generatedAt ? new Date(release.generatedAt).toLocaleString() : '—'}{' '}
              · {release.summary?.eventCount ?? 0} events · window{' '}
              {release.window?.sinceHours ?? 24}h
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(release.summary?.byAction || {}).map(([action, count]) => (
                <span
                  key={action}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {action}: {count}
                </span>
              ))}
            </div>
            {release.attachHints ? (
              <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
                {JSON.stringify(release.attachHints, null, 2)}
              </pre>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 p-4">
            <div className="min-w-[180px] flex-1">
              <label className="text-[11px] font-semibold uppercase text-slate-400">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="action, actor, entity…"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {actionOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-400">Entity</label>
              <input
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                placeholder="candidate | job | …"
                className="mt-1 w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
            <p className="ml-auto text-xs text-slate-500">
              {loading ? 'Loading…' : `${total} event(s)`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No audit events yet. Admin deletes on Super admin will appear here.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer hover:bg-sky-50/60"
                      onClick={() => setSelected(e)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {e.capturedAt ? new Date(e.capturedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{e.actorLabel || e.actorId || '—'}</div>
                        <div className="text-[11px] text-slate-400">{e.actorRole || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">{e.action}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800">{e.entityType}</div>
                        <div className="max-w-[180px] truncate font-mono text-[11px] text-slate-400">
                          {e.entityId || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            e.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700'
                              : e.status === 'partial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {e.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{e.source || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-slate-400">
          Docs: <code className="rounded bg-white px-1">AUDIT_LOGS.md</code> · HQ proxy:{' '}
          <code className="rounded bg-white px-1">/api/hq-audit</code>
        </p>
      </main>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Audit event</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
