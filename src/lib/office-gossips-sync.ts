/**
 * Sync Office Gossips + Reference Check with backend1 durable store.
 * LocalStorage remains a fast cache; server is source of truth across devices.
 */

import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';

export type OfficeGossipsBundle = {
  communities?: unknown[];
  companyPages?: unknown[];
  posts?: unknown[];
  comments?: unknown[];
  identities?: Record<string, unknown>;
  identity?: Record<string, unknown>;
  referenceChecks?: unknown[];
  social?: unknown;
  updatedAt?: string;
  version?: number;
};

const PUSH_DEBOUNCE_MS = 900;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let inflightPull: Promise<OfficeGossipsBundle | null> | null = null;
let lastPullAt = 0;

function apiUrl(path: string) {
  const base = String(API_BASE_URL.value || '').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function pullOfficeGossipsBundle(): Promise<OfficeGossipsBundle | null> {
  if (typeof window === 'undefined') return null;
  if (inflightPull) return inflightPull;

  inflightPull = (async () => {
    try {
      const res = await fetch(apiUrl('/office-gossips/bundle'), {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { ok?: boolean; data?: OfficeGossipsBundle };
      if (!json?.ok || !json.data) return null;
      lastPullAt = Date.now();
      return json.data;
    } catch {
      return null;
    } finally {
      inflightPull = null;
    }
  })();

  return inflightPull;
}

export async function pushOfficeGossipsBundle(
  payload: OfficeGossipsBundle,
): Promise<OfficeGossipsBundle | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(apiUrl('/office-gossips/bundle'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; data?: OfficeGossipsBundle };
    if (!json?.ok || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

export function scheduleOfficeGossipsPush(buildPayload: () => OfficeGossipsBundle) {
  if (typeof window === 'undefined') return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushOfficeGossipsBundle(buildPayload());
  }, PUSH_DEBOUNCE_MS);
}

export function flushOfficeGossipsPush(buildPayload: () => OfficeGossipsBundle) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (pushTimer) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
  return pushOfficeGossipsBundle(buildPayload());
}

export function officeGossipsLastPullAt() {
  return lastPullAt;
}

function rowTime(row: { updatedAt?: string; createdAt?: string } | null | undefined) {
  const t = Date.parse(String(row?.updatedAt || row?.createdAt || ''));
  return Number.isFinite(t) ? t : 0;
}

export function mergeRowsById<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const row of local || []) {
    if (row?.id) map.set(String(row.id), row);
  }
  for (const row of remote || []) {
    if (!row?.id) continue;
    const id = String(row.id);
    const prev = map.get(id);
    if (!prev || rowTime(row) >= rowTime(prev)) map.set(id, { ...prev, ...row } as T);
  }
  return [...map.values()];
}

export function mergeCompanyPagesByDomain<
  T extends { id: string; domainKey?: string; updatedAt?: string; createdAt?: string },
>(local: T[], remote: T[]): T[] {
  const byId = mergeRowsById(local, remote);
  const byDomain = new Map<string, T>();
  for (const page of byId) {
    const key = String(page.domainKey || page.id).toLowerCase();
    const prev = byDomain.get(key);
    if (!prev || rowTime(page) >= rowTime(prev)) byDomain.set(key, page);
  }
  return [...byDomain.values()].sort((a, b) => rowTime(b) - rowTime(a));
}
