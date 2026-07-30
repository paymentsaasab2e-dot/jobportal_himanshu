/**
 * Session-scoped cache for explore-jobs catalog + personalized overlays.
 * Survives client navigations; optional sessionStorage for hard refresh in-tab.
 */

export const EXPLORE_JOBS_BATCH_SIZE = 10;
export const EXPLORE_JOBS_STALE_MS = 5 * 60_000;

export type ExploreJobsCacheEntry = {
  locale: string;
  candidateId: string | null;
  /** Transformed JobListing-shaped objects (JSON-safe). */
  jobs: unknown[];
  isPersonalized: boolean;
  /** Total jobs in catalog (from /jobs pagination.total). */
  totalCatalog: number;
  /** Personalized match count when logged in (from /jobs/personalized). */
  totalMatches: number;
  updatedAt: number;
};

const memory = new Map<string, ExploreJobsCacheEntry>();
const STORAGE_PREFIX = 'saasa:explore-jobs-cache:v1:';

export function exploreJobsCacheKey(locale: string, candidateId: string | null): string {
  return `${locale}::${candidateId || 'guest'}`;
}

function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function readExploreJobsCache(key: string): ExploreJobsCacheEntry | null {
  const fromMem = memory.get(key);
  if (fromMem) return fromMem;
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExploreJobsCacheEntry;
    if (!parsed || !Array.isArray(parsed.jobs)) return null;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeExploreJobsCache(entry: ExploreJobsCacheEntry): void {
  const key = exploreJobsCacheKey(entry.locale, entry.candidateId);
  const next = { ...entry, updatedAt: Date.now() };
  memory.set(key, next);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function isExploreJobsCacheFresh(entry: ExploreJobsCacheEntry | null, staleMs = EXPLORE_JOBS_STALE_MS): boolean {
  if (!entry?.jobs?.length) return false;
  return Date.now() - entry.updatedAt < staleMs;
}

export function clearExploreJobsCache(candidateId?: string | null): void {
  if (typeof candidateId === 'string') {
    for (const key of [...memory.keys()]) {
      if (key.endsWith(`::${candidateId}`) || (candidateId === '' && key.endsWith('::guest'))) {
        memory.delete(key);
        try {
          sessionStorage.removeItem(storageKey(key));
        } catch {
          /* ignore */
        }
      }
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

/** Stable merge: keep existing order, upsert by id, append new ids. */
export function mergeJobsById<T extends { id: string | number }>(existing: T[], incoming: T[]): T[] {
  if (!incoming.length) return existing;
  const map = new Map(existing.map((j) => [String(j.id), j]));
  const order = existing.map((j) => String(j.id));
  for (const job of incoming) {
    const id = String(job.id);
    if (!id) continue;
    if (!map.has(id)) order.push(id);
    map.set(id, { ...(map.get(id) as T), ...job });
  }
  return order.map((id) => map.get(id)!).filter(Boolean);
}
