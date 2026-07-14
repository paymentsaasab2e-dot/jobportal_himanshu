import { getApiBaseUrl } from './api-base';

const CACHE_TTL_MS = 60_000;

type ApplicationsPayload = {
  success?: boolean;
  data?: unknown;
};

type CacheEntry = {
  expiresAt: number;
  data: unknown[] | null;
};

const dataCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown[] | null>>();

export function peekApplicationsCache(candidateId: string): unknown[] | null {
  const key = String(candidateId || '').trim();
  if (!key) return null;
  const cached = dataCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return cached.data;
}

export async function fetchApplicationsCached(
  candidateId: string,
  init?: RequestInit,
): Promise<unknown[] | null> {
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
    const response = await fetch(`${getApiBaseUrl()}/applications/${key}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const payload = (await response.json().catch(() => ({}))) as ApplicationsPayload;
    const data =
      response.ok && payload.success && Array.isArray(payload.data) ? payload.data : null;
    dataCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateApplicationsCache(candidateId?: string) {
  if (!candidateId) {
    dataCache.clear();
    return;
  }
  dataCache.delete(String(candidateId).trim());
}
