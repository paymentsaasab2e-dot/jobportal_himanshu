import { getApiBaseUrl } from './api-base';

const CACHE_TTL_MS = 30_000;

type DashboardPayload = {
  success?: boolean;
  data?: Record<string, unknown>;
};

type CacheEntry = {
  expiresAt: number;
  data: Record<string, unknown> | null;
};

const dataCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Record<string, unknown> | null>>();

/**
 * Dedupes concurrent `/cv/dashboard/:id` requests and caches responses briefly
 * so Header + page mounts do not hammer the same endpoint.
 */
export async function fetchCvDashboardData(
  candidateId: string,
  init?: RequestInit,
): Promise<Record<string, unknown> | null> {
  const key = String(candidateId || '').trim();
  if (!key) return null;

  const now = Date.now();
  const cached = dataCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const response = await fetch(`${getApiBaseUrl()}/cv/dashboard/${key}`, init);
    const payload = (await response.json().catch(() => ({}))) as DashboardPayload;
    const data =
      response.ok && payload.success && payload.data && typeof payload.data === 'object'
        ? payload.data
        : null;
    dataCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateCvDashboardCache(candidateId?: string) {
  if (!candidateId) {
    dataCache.clear();
    return;
  }
  dataCache.delete(String(candidateId).trim());
}

/** Return cached dashboard payload without triggering a fetch. */
export function peekCvDashboardCache(candidateId: string): Record<string, unknown> | null {
  const key = String(candidateId || '').trim();
  if (!key) return null;
  const cached = dataCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cached.data;
}
