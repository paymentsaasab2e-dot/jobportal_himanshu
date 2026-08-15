/**
 * Session cache for Candidate Dashboard — instant paint on revisit.
 * Mirrors Office Gossips Events session-cache pattern.
 */

import type { DashboardData } from '@/components/dashboard/dashboard-types';
import type { ProfileCompletenessResponse } from '@/lib/profile-completion';

export const DASHBOARD_SESSION_STALE_MS = 5 * 60_000;

export type DashboardSessionCacheEntry = {
  candidateId: string;
  dashboard: DashboardData | null;
  completeness: ProfileCompletenessResponse | null;
  snapshot: Record<string, unknown> | null;
  updatedAt: number;
};

const memory = new Map<string, DashboardSessionCacheEntry>();
const STORAGE_PREFIX = 'saasa:dashboard-cache:v1:';

function storageKey(candidateId: string) {
  return `${STORAGE_PREFIX}${candidateId}`;
}

export function readDashboardSessionCache(
  candidateId: string | null | undefined,
): DashboardSessionCacheEntry | null {
  const id = String(candidateId || '').trim();
  if (!id) return null;
  const fromMem = memory.get(id);
  if (fromMem) return fromMem;
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardSessionCacheEntry;
    if (!parsed || parsed.candidateId !== id) return null;
    memory.set(id, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeDashboardSessionCache(
  entry: Omit<DashboardSessionCacheEntry, 'updatedAt'> & { updatedAt?: number },
): void {
  const id = String(entry.candidateId || '').trim();
  if (!id) return;
  const next: DashboardSessionCacheEntry = {
    ...entry,
    candidateId: id,
    updatedAt: entry.updatedAt ?? Date.now(),
  };
  memory.set(id, next);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function isDashboardSessionCacheFresh(
  entry: DashboardSessionCacheEntry | null,
  staleMs = DASHBOARD_SESSION_STALE_MS,
): boolean {
  if (!entry?.dashboard) return false;
  return Date.now() - entry.updatedAt < staleMs;
}

export function clearDashboardSessionCache(candidateId?: string) {
  if (!candidateId) {
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
    return;
  }
  const id = String(candidateId).trim();
  memory.delete(id);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(id));
  } catch {
    /* ignore */
  }
}
