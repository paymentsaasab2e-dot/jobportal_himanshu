/**
 * Session-scoped cache for Office Gossips Events tab (jobs + LMS + match haystack).
 * Mirrors explore-jobs session cache: instant paint on revisit, soft refresh when stale.
 */

import type { OgEventPost } from '@/lib/og-events-store';

export const OG_EVENTS_STALE_MS = 5 * 60_000;

export type OgEventsCacheEntry = {
  userId: string | null;
  jobEvents: OgEventPost[];
  lmsEvents: OgEventPost[];
  jobsFromPersonalized: boolean;
  eventMatchHaystack: string;
  updatedAt: number;
};

const memory = new Map<string, OgEventsCacheEntry>();
const STORAGE_PREFIX = 'saasa:og-events-cache:v3:';

export function ogEventsCacheKey(userId: string | null): string {
  return userId || 'guest';
}

function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function readOgEventsCache(userId: string | null): OgEventsCacheEntry | null {
  const key = ogEventsCacheKey(userId);
  const fromMem = memory.get(key);
  if (fromMem) return fromMem;
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OgEventsCacheEntry;
    if (!parsed || !Array.isArray(parsed.jobEvents) || !Array.isArray(parsed.lmsEvents)) {
      return null;
    }
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeOgEventsCache(
  entry: Omit<OgEventsCacheEntry, 'updatedAt'> & { updatedAt?: number },
): void {
  const key = ogEventsCacheKey(entry.userId);
  const next: OgEventsCacheEntry = {
    ...entry,
    updatedAt: entry.updatedAt ?? Date.now(),
  };
  memory.set(key, next);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function isOgEventsCacheFresh(
  entry: OgEventsCacheEntry | null,
  staleMs = OG_EVENTS_STALE_MS,
): boolean {
  if (!entry) return false;
  if (!entry.jobEvents.length && !entry.lmsEvents.length && !entry.eventMatchHaystack) {
    return false;
  }
  return Date.now() - entry.updatedAt < staleMs;
}

export function clearOgEventsCache(userId?: string | null) {
  if (typeof userId === 'string' || userId === null) {
    const key = ogEventsCacheKey(userId);
    memory.delete(key);
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(storageKey(key));
    } catch {
      /* ignore */
    }
    return;
  }
  memory.clear();
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
