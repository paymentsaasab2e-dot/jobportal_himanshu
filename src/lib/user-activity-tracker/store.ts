import {
  categorizePath,
  isMeaningfulPath,
  localDateKey,
} from './categories';
import type {
  ActivityCategory,
  ActivityEvent,
  ActivityEventType,
  ActivitySession,
  DayBucket,
  ProfileActivitySnapshot,
  UserActivityState,
} from './types';

export const USER_ACTIVITY_STORAGE_KEY = 'saasa:user-activity-v1';
export const USER_ACTIVITY_HQ_EVENT = 'saasa:hq-user-activity';

const MAX_SESSIONS = 80;
const MAX_DAY_KEYS = 120;
const MAX_FIRST_OPENS = 60;
const MAX_EVENTS = 500;
const SESSION_IDLE_MS = 30 * 60 * 1000;

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyTotals(): UserActivityState['totals'] {
  return {
    logins: 0,
    visits: 0,
    jobCardClicks: 0,
    applies: 0,
    activeMs: 0,
    sessions: 0,
    pageVisitsByCategory: {},
    activeMsByCategory: {},
  };
}

function emptyDay(date: string): DayBucket {
  return {
    date,
    logins: 0,
    visits: 0,
    jobCardClicks: 0,
    applies: 0,
    pageVisitsByCategory: {},
    activeMsByCategory: {},
    activeMs: 0,
    sessionIds: [],
  };
}

function loadAll(): Record<string, UserActivityState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_ACTIVITY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UserActivityState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, UserActivityState>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ACTIVITY_STORAGE_KEY, JSON.stringify(map));
}

function migrateState(state: UserActivityState) {
  if (!state.totals.activeMsByCategory) state.totals.activeMsByCategory = {};
  if (!state.events) state.events = [];
  if (!state.firstOpens) state.firstOpens = [];
  for (const day of Object.values(state.days || {})) {
    if (!day.activeMsByCategory) day.activeMsByCategory = {};
    if (!day.pageVisitsByCategory) day.pageVisitsByCategory = {};
    if (!day.sessionIds) day.sessionIds = [];
  }
}

function pruneState(state: UserActivityState) {
  if (state.sessions.length > MAX_SESSIONS) {
    state.sessions = state.sessions.slice(-MAX_SESSIONS);
  }
  const dayKeys = Object.keys(state.days).sort();
  if (dayKeys.length > MAX_DAY_KEYS) {
    for (const key of dayKeys.slice(0, dayKeys.length - MAX_DAY_KEYS)) {
      delete state.days[key];
    }
  }
  if (state.firstOpens.length > MAX_FIRST_OPENS) {
    state.firstOpens = state.firstOpens.slice(-MAX_FIRST_OPENS);
  }
  if (state.events.length > MAX_EVENTS) {
    state.events = state.events.slice(-MAX_EVENTS);
  }
}

function bumpCategory(
  map: Partial<Record<ActivityCategory, number>>,
  cat: ActivityCategory,
  n = 1,
) {
  map[cat] = (map[cat] || 0) + n;
}

function pushEvent(
  state: UserActivityState,
  type: ActivityEventType,
  category: ActivityCategory,
  opts?: { path?: string; meta?: Record<string, unknown> },
) {
  const session = currentSession(state);
  const event: ActivityEvent = {
    id: uid('ev'),
    at: new Date().toISOString(),
    type,
    category,
    path: opts?.path,
    sessionId: session?.id,
    meta: opts?.meta,
  };
  state.events.push(event);
}

export function getUserActivityState(userId: string): UserActivityState {
  const map = loadAll();
  if (!map[userId]) {
    const now = new Date().toISOString();
    map[userId] = {
      userId,
      createdAt: now,
      updatedAt: now,
      totals: emptyTotals(),
      days: {},
      sessions: [],
      firstOpens: [],
      events: [],
    };
    saveAll(map);
  }
  migrateState(map[userId]);
  return map[userId];
}

export function persistUserActivityState(state: UserActivityState) {
  state.updatedAt = new Date().toISOString();
  pruneState(state);
  const map = loadAll();
  map[state.userId] = state;
  saveAll(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(USER_ACTIVITY_HQ_EVENT, { detail: { userId: state.userId, state } }),
    );
  }
}

function ensureDay(state: UserActivityState, date = localDateKey()): DayBucket {
  if (!state.days[date]) state.days[date] = emptyDay(date);
  const day = state.days[date];
  if (!day.activeMsByCategory) day.activeMsByCategory = {};
  return day;
}

function currentSession(state: UserActivityState): ActivitySession | null {
  if (!state.currentSessionId) return null;
  return state.sessions.find((s) => s.id === state.currentSessionId) || null;
}

/** Start or resume a browsing session; count as login when new session. */
export function ensureActivitySession(
  userId: string,
  opts?: { forceNew?: boolean; path?: string },
): ActivitySession | null {
  if (!userId) return null;
  const state = getUserActivityState(userId);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let session = currentSession(state);
  const cat = opts?.path ? categorizePath(opts.path) : 'other';

  const idle =
    session && session.lastActiveAt
      ? now - Date.parse(session.lastActiveAt)
      : Number.POSITIVE_INFINITY;

  if (opts?.forceNew || !session || idle > SESSION_IDLE_MS) {
    if (session && !session.endedAt) {
      session.endedAt = nowIso;
      session.durationMs = Math.max(
        session.durationMs,
        now - Date.parse(session.startedAt),
      );
      pushEvent(state, 'session_end', session.lastCategory || 'other', {
        path: session.lastPath,
        meta: { durationMs: session.durationMs },
      });
    }
    session = {
      id: uid('sess'),
      startedAt: nowIso,
      lastActiveAt: nowIso,
      durationMs: 0,
      pageCount: 0,
      firstPath: opts?.path,
      lastPath: opts?.path,
      lastCategory: opts?.path ? cat : undefined,
      paths: opts?.path ? [opts.path] : [],
    };
    state.sessions.push(session);
    state.currentSessionId = session.id;
    state.totals.logins += 1;
    state.totals.sessions += 1;
    const day = ensureDay(state);
    day.logins += 1;
    if (!day.sessionIds.includes(session.id)) day.sessionIds.push(session.id);
    pushEvent(state, 'login', cat, { path: opts?.path });
  } else {
    session.lastActiveAt = nowIso;
  }

  persistUserActivityState(state);
  return session;
}

export function recordPageVisit(userId: string, pathname: string): void {
  if (!userId || !pathname) return;
  ensureActivitySession(userId, { path: pathname });
  const state = getUserActivityState(userId);

  const session = currentSession(state);
  const day = ensureDay(state);
  const cat = categorizePath(pathname);
  const nowIso = new Date().toISOString();

  state.totals.visits += 1;
  day.visits += 1;
  bumpCategory(state.totals.pageVisitsByCategory, cat);
  bumpCategory(day.pageVisitsByCategory, cat);
  state.lastPath = pathname;
  state.lastCategory = cat;

  if (session) {
    session.lastActiveAt = nowIso;
    session.lastPath = pathname;
    session.lastCategory = cat;
    session.pageCount += 1;
    if (!session.firstPath) session.firstPath = pathname;
    if (!session.paths.includes(pathname)) {
      session.paths.push(pathname);
      if (session.paths.length > 40) session.paths = session.paths.slice(-40);
    }
    if (!day.sessionIds.includes(session.id)) day.sessionIds.push(session.id);
  }

  pushEvent(state, 'page_visit', cat, { path: pathname });

  if (isMeaningfulPath(pathname) && !day.firstOpenCategory) {
    day.firstOpenCategory = cat;
    day.firstOpenPath = pathname;
    day.firstOpenAt = nowIso;
    state.firstOpens.push({
      date: day.date,
      category: cat,
      path: pathname,
      at: nowIso,
    });
  }

  persistUserActivityState(state);
}

/**
 * Heartbeat: add active time while tab is visible.
 * Attributed to current page category (complete time tracking, not only first open).
 */
export function recordActiveTime(
  userId: string,
  ms: number,
  pathHint?: string,
): void {
  if (!userId || ms <= 0) return;
  const capped = Math.min(ms, 60_000);
  ensureActivitySession(userId);
  const state = getUserActivityState(userId);
  const day = ensureDay(state);
  const session = currentSession(state);
  const nowIso = new Date().toISOString();
  const path = pathHint || state.lastPath;
  const cat =
    (path ? categorizePath(path) : state.lastCategory) || 'other';

  state.totals.activeMs += capped;
  day.activeMs += capped;
  bumpCategory(state.totals.activeMsByCategory, cat, capped);
  bumpCategory(day.activeMsByCategory, cat, capped);

  if (session) {
    session.durationMs += capped;
    session.lastActiveAt = nowIso;
    session.lastCategory = cat;
  }

  // Log time slices sparsely (~every ~minute of attributed time) to avoid flood
  const lastTimeEv = [...state.events].reverse().find((e) => e.type === 'time_slice');
  const lastAt = lastTimeEv ? Date.parse(lastTimeEv.at) : 0;
  if (Date.now() - lastAt >= 60_000) {
    pushEvent(state, 'time_slice', cat, {
      path,
      meta: { durationMs: capped, rolling: true },
    });
  }

  persistUserActivityState(state);
}

export function trackJobCardClick(userId: string, jobId?: string): void {
  if (!userId) return;
  ensureActivitySession(userId);
  const state = getUserActivityState(userId);
  const day = ensureDay(state);
  state.totals.jobCardClicks += 1;
  day.jobCardClicks += 1;
  bumpCategory(state.totals.pageVisitsByCategory, 'jobs');
  bumpCategory(day.pageVisitsByCategory, 'jobs');
  pushEvent(state, 'job_card_click', 'jobs', {
    path: '/explore-jobs',
    meta: jobId ? { jobId } : undefined,
  });
  persistUserActivityState(state);
  if (typeof window !== 'undefined' && jobId) {
    window.dispatchEvent(
      new CustomEvent('saasa:job-card-click', {
        detail: { userId, jobId, at: new Date().toISOString() },
      }),
    );
  }
}

export function trackJobCardClickForCurrentUser(jobId?: string): void {
  if (typeof window === 'undefined') return;
  const userId =
    localStorage.getItem('candidateId') ||
    sessionStorage.getItem('candidateId') ||
    '';
  if (!userId || userId === 'guest') return;
  trackJobCardClick(userId, jobId);
}

export function trackApplicationSubmit(userId: string): void {
  if (!userId) return;
  const state = getUserActivityState(userId);
  const day = ensureDay(state);
  state.totals.applies += 1;
  day.applies += 1;
  bumpCategory(state.totals.pageVisitsByCategory, 'applications');
  bumpCategory(day.pageVisitsByCategory, 'applications');
  pushEvent(state, 'apply', 'applications', { path: '/explore-jobs' });
  persistUserActivityState(state);
}

export function trackApplicationSubmitForCurrentUser(): void {
  if (typeof window === 'undefined') return;
  const userId =
    localStorage.getItem('candidateId') ||
    sessionStorage.getItem('candidateId') ||
    '';
  if (!userId || userId === 'guest') return;
  trackApplicationSubmit(userId);
}

export function syncProfileActivitySnapshot(
  userId: string,
  snapshot: Omit<ProfileActivitySnapshot, 'updatedAt'>,
): void {
  if (!userId) return;
  const state = getUserActivityState(userId);
  state.profileSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  persistUserActivityState(state);
}

export function endActivitySession(userId: string): void {
  if (!userId) return;
  const state = getUserActivityState(userId);
  const session = currentSession(state);
  if (!session || session.endedAt) return;
  session.endedAt = new Date().toISOString();
  session.lastActiveAt = session.endedAt;
  pushEvent(state, 'session_end', session.lastCategory || 'other', {
    path: session.lastPath,
    meta: { durationMs: session.durationMs },
  });
  persistUserActivityState(state);
}

export function listDateKeysInRange(
  fromInclusive: string,
  toInclusive: string,
): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = fromInclusive.split('-').map(Number);
  const [ty, tm, td] = toInclusive.split('-').map(Number);
  const cur = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  while (cur <= end) {
    out.push(localDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function getRecentActivityEvents(
  userId: string,
  limit = 80,
): ActivityEvent[] {
  if (!userId) return [];
  const state = getUserActivityState(userId);
  return [...(state.events || [])].slice(-limit).reverse();
}
