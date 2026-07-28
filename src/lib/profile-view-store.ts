/**
 * Office Gossips — who viewed your profile (local + token unlock).
 */

import { getGossipDisplayName, getGossipIdentity } from '@/lib/community-store';
import { recordCandidateNotification } from '@/lib/notifications';
import {
  fetchTokenBalance,
  InsufficientTokensError,
  spendTokenAmount,
  spendTokenAmountLocal,
} from '@/lib/tokens-api';

export const PROFILE_VIEW_UNLOCK_COST = 2;
export const PROFILE_VIEWS_UPDATED_EVENT = 'saasa:profile-views-updated';

const STORAGE_KEY = 'saasa:og-profile-views-v1';
/** Don't re-log / re-nudge the same viewer within this window. */
const DEDUPE_MS = 12 * 60 * 60 * 1000;

export type ProfileView = {
  id: string;
  profileUserId: string;
  viewerId: string;
  /** Public name at view time (username if anonymous, else real/fallback). */
  viewerDisplayName: string;
  viewerWasAnonymous: boolean;
  createdAt: string;
  unlocked: boolean;
  unlockedAt?: string;
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): ProfileView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProfileView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(rows: ProfileView[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function notifyProfileViewsUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROFILE_VIEWS_UPDATED_EVENT));
}

export function listProfileViews(profileUserId: string): ProfileView[] {
  if (!profileUserId) return [];
  return loadAll()
    .filter((v) => v.profileUserId === profileUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countLockedProfileViews(profileUserId: string): number {
  return listProfileViews(profileUserId).filter((v) => !v.unlocked).length;
}

export function countRecentProfileViews(profileUserId: string, withinMs = 7 * 24 * 60 * 60 * 1000): number {
  const cutoff = Date.now() - withinMs;
  return listProfileViews(profileUserId).filter((v) => +new Date(v.createdAt) >= cutoff).length;
}

/**
 * Record that `viewerId` opened `profileUserId`'s profile.
 * Dedupes recent repeats; nudges the profile owner once per new view.
 */
export async function recordProfileView(input: {
  profileUserId: string;
  viewerId: string;
  viewerName: string;
}): Promise<{ ok: true; view: ProfileView | null; skipped?: boolean } | { ok: false; error: string }> {
  if (!input.profileUserId || !input.viewerId) {
    return { ok: false, error: 'Missing user.' };
  }
  if (input.profileUserId === input.viewerId) {
    return { ok: true, view: null, skipped: true };
  }

  const identity = getGossipIdentity(input.viewerId);
  const wasAnonymous = Boolean(identity?.isAnonymous);
  const displayName = wasAnonymous
    ? getGossipDisplayName(input.viewerId, 'Anonymous')
    : input.viewerName?.trim() || getGossipDisplayName(input.viewerId, 'Member');

  const rows = loadAll();
  const recent = rows.find(
    (v) =>
      v.profileUserId === input.profileUserId &&
      v.viewerId === input.viewerId &&
      Date.now() - +new Date(v.createdAt) < DEDUPE_MS,
  );
  if (recent) {
    return { ok: true, view: recent, skipped: true };
  }

  const view: ProfileView = {
    id: uid('pv'),
    profileUserId: input.profileUserId,
    viewerId: input.viewerId,
    viewerDisplayName: displayName,
    viewerWasAnonymous: wasAnonymous,
    createdAt: new Date().toISOString(),
    unlocked: false,
  };
  rows.push(view);
  saveAll(rows);
  notifyProfileViewsUpdated();

  void recordCandidateNotification(input.profileUserId, {
    type: 'system',
    title: 'Someone viewed your profile',
    description: 'Unlock with tokens in Office Gossips to see who it was.',
    actionButton: 'See who',
    actionPath: '/community?views=1',
    metadata: {
      kind: 'profile_view',
      channel: 'alert',
      viewId: view.id,
    },
  });

  return { ok: true, view };
}

/** Spend tokens to reveal one viewer (name + anonymous or not). */
export async function unlockProfileView(
  viewId: string,
  unlockingUserId: string,
): Promise<{ ok: true; view: ProfileView } | { ok: false; error: string }> {
  const rows = loadAll();
  const idx = rows.findIndex((v) => v.id === viewId);
  if (idx < 0) return { ok: false, error: 'View not found.' };
  const view = rows[idx];
  if (view.profileUserId !== unlockingUserId) {
    return { ok: false, error: 'You can only unlock views on your own profile.' };
  }
  if (view.unlocked) return { ok: true, view };

  const fee = PROFILE_VIEW_UNLOCK_COST;
  try {
    await spendTokenAmount({
      amount: fee,
      service: 'office.profile-view',
      description: `Unlock profile viewer · ${fee} tokens`,
    });
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return {
        ok: false,
        error: `Need ${err.required} tokens (you have ${err.balance}).`,
      };
    }
    const code = (err as Error & { code?: string })?.code;
    const msg = err instanceof Error ? err.message : 'Token spend failed.';
    if (
      code === 'NETWORK_ERROR' ||
      code === 'ENDPOINT_MISSING' ||
      /failed to fetch|cannot reach|restart the backend|network/i.test(msg)
    ) {
      try {
        const bal = await fetchTokenBalance().catch(() => null);
        if (bal && typeof window !== 'undefined') {
          window.localStorage.setItem('saasa:last-token-balance', String(bal.tokenBalance));
        }
        spendTokenAmountLocal(fee, 'office.profile-view');
      } catch (localErr) {
        if (localErr instanceof InsufficientTokensError) {
          return {
            ok: false,
            error: `Need ${localErr.required} tokens (you have ${localErr.balance}).`,
          };
        }
        return { ok: false, error: msg };
      }
    } else {
      return { ok: false, error: msg };
    }
  }

  const unlocked: ProfileView = {
    ...view,
    unlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  rows[idx] = unlocked;
  saveAll(rows);
  notifyProfileViewsUpdated();
  return { ok: true, view: unlocked };
}

export function formatViewAge(iso: string): string {
  const ms = Date.now() - +new Date(iso);
  if (ms < 60_000) return 'Just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  const days = Math.floor(ms / 86_400_000);
  return days === 1 ? '1d ago' : `${days}d ago`;
}

/** Seed a couple of locked demo views once so unlock UX is easy to try. */
export function ensureDemoProfileViews(profileUserId: string): void {
  if (!profileUserId || typeof window === 'undefined') return;
  const flag = `saasa:og-pv-seeded:${profileUserId}`;
  if (localStorage.getItem(flag)) return;
  if (listProfileViews(profileUserId).length > 0) {
    localStorage.setItem(flag, '1');
    return;
  }
  const now = Date.now();
  const rows = loadAll();
  rows.push(
    {
      id: uid('pv'),
      profileUserId,
      viewerId: 'demo_ref_ananya',
      viewerDisplayName: 'Ananya Sharma',
      viewerWasAnonymous: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      unlocked: false,
    },
    {
      id: uid('pv'),
      profileUserId,
      viewerId: 'demo_ref_vikram',
      viewerDisplayName: 'vikram_p',
      viewerWasAnonymous: true,
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      unlocked: false,
    },
  );
  saveAll(rows);
  localStorage.setItem(flag, '1');
  notifyProfileViewsUpdated();
}
