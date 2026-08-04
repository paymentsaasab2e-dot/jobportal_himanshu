/**
 * Session cache for Profile page — paint instantly on revisit, soft-pull when stale.
 * Mirrors Office Gossips Events / Chats session-cache pattern.
 */

export const PROFILE_SESSION_STALE_MS = 5 * 60_000;

export type ProfileSessionCacheEntry = {
  candidateId: string;
  profile: Record<string, unknown>;
  completeness?: {
    percentage: number;
    completedSections: string[];
    missingSections: string[];
    sections: unknown[];
  } | null;
  updatedAt: number;
};

const memory = new Map<string, ProfileSessionCacheEntry>();
const STORAGE_PREFIX = 'saasa:profile-cache:v1:';

function storageKey(candidateId: string) {
  return `${STORAGE_PREFIX}${candidateId}`;
}

export function readProfileSessionCache(
  candidateId: string | null | undefined,
): ProfileSessionCacheEntry | null {
  const id = String(candidateId || '').trim();
  if (!id) return null;
  const fromMem = memory.get(id);
  if (fromMem) return fromMem;
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileSessionCacheEntry;
    if (!parsed?.profile || typeof parsed.profile !== 'object') return null;
    memory.set(id, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeProfileSessionCache(
  entry: Omit<ProfileSessionCacheEntry, 'updatedAt'> & { updatedAt?: number },
): void {
  const id = String(entry.candidateId || '').trim();
  if (!id) return;
  const next: ProfileSessionCacheEntry = {
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

export function patchProfileSessionCache(
  candidateId: string,
  patch: Partial<Record<string, unknown>>,
): void {
  const prev = readProfileSessionCache(candidateId);
  if (!prev) return;
  writeProfileSessionCache({
    ...prev,
    profile: { ...prev.profile, ...patch },
  });
}

export function isProfileSessionCacheFresh(
  entry: ProfileSessionCacheEntry | null,
  staleMs = PROFILE_SESSION_STALE_MS,
): boolean {
  if (!entry?.profile) return false;
  return Date.now() - entry.updatedAt < staleMs;
}

export function invalidateProfileSessionCache(candidateId?: string) {
  if (!candidateId) {
    memory.clear();
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
