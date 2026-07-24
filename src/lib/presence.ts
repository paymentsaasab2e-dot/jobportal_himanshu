/**
 * Lightweight presence (online / offline) for Office Gossips chats.
 * Current user heartbeats while the community page is open.
 * Demo users get a stable rotating online pattern.
 */

const PRESENCE_KEY = 'saasa:og-presence-v1';
const ONLINE_MS = 90_000;

function loadPresence(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePresence(map: Record<string, number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRESENCE_KEY, JSON.stringify(map));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Call while community is open so this user shows as online. */
export function heartbeatPresence(userId: string | null | undefined) {
  if (!userId || typeof window === 'undefined') return;
  const map = loadPresence();
  map[userId] = Date.now();
  savePresence(map);
}

export function isUserOnline(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const map = loadPresence();
  const last = map[userId];
  if (typeof last === 'number' && Date.now() - last < ONLINE_MS) return true;

  // Demo teammates: mostly online, rotates every few minutes
  if (userId.startsWith('demo_ref_')) {
    const bucket = Math.floor(Date.now() / 180_000);
    return hashStr(`${userId}:${bucket}`) % 10 < 7;
  }
  return false;
}
