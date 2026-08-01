/**
 * Multi-topic interest ratings (0–100) derived from behaviour tracking + OG engagement.
 * Used to personalize Office Gossips feed discovery and can feed suggestions later.
 */

import { getBehaviourSignalsForSuggestions } from '@/lib/user-activity-tracker';

export type InterestTopic = {
  key: string;
  label: string;
  /** 0–100 interest strength */
  score: number;
  updatedAt: string;
};

export type UserInterestProfile = {
  userId: string;
  topics: Record<string, InterestTopic>;
  updatedAt: string;
};

const STORAGE_KEY = 'saasa:interest-affinity-v1';
const SYNC_META_KEY = 'saasa:interest-affinity-sync-v1';
const SYNC_THROTTLE_MS = 60 * 60 * 1000;

/** Dispatched when interest ratings change — HQ behavior relay listens. */
export const INTEREST_AFFINITY_HQ_EVENT = 'saasa:interest-affinity-updated';

function emitInterestUpdated(userId: string) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.dispatchEvent(
      new CustomEvent(INTEREST_AFFINITY_HQ_EVENT, { detail: { userId } }),
    );
  } catch {
    /* ignore */
  }
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'your', 'you', 'this', 'that', 'are', 'our',
  'into', 'will', 'have', 'has', 'been', 'about', 'over', 'circle', 'hub', 'lounge',
  'community', 'office', 'gossips', 'the', 'a', 'an', 'of', 'to', 'in', 'on',
]);

/** Canonical interest buckets mapped from common OG / career language. */
export const INTEREST_TOPIC_ALIASES: Record<string, { key: string; label: string; keywords: string[] }> = {
  interview_prep: {
    key: 'interview_prep',
    label: 'Interview prep',
    keywords: ['interview', 'prep', 'behavioral', 'system', 'design', 'mock'],
  },
  job_search: {
    key: 'job_search',
    label: 'Job search',
    keywords: ['job', 'seeker', 'hiring', 'career', 'apply', 'application', 'recruiter'],
  },
  frontend: {
    key: 'frontend',
    label: 'Frontend',
    keywords: ['frontend', 'react', 'next', 'ui', 'javascript', 'typescript', 'css'],
  },
  backend: {
    key: 'backend',
    label: 'Backend',
    keywords: ['backend', 'api', 'node', 'java', 'python', 'server', 'database'],
  },
  product: {
    key: 'product',
    label: 'Product / PM',
    keywords: ['product', 'pm', 'manager', 'roadmap', 'stakeholder'],
  },
  leadership: {
    key: 'leadership',
    label: 'Leadership',
    keywords: ['manager', 'lead', 'leadership', 'people', 'communication'],
  },
  watercooler: {
    key: 'watercooler',
    label: 'Workplace chat',
    keywords: ['watercooler', 'gossip', 'office', 'culture', 'banter'],
  },
  learning: {
    key: 'learning',
    label: 'Learning & courses',
    keywords: ['course', 'lms', 'learn', 'skill', 'quiz', 'training'],
  },
};

function normalizeKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

function loadAll(): Record<string, UserInterestProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UserInterestProfile>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, UserInterestProfile>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function getUserInterestProfile(userId: string): UserInterestProfile {
  if (!userId) {
    return { userId: '', topics: {}, updatedAt: new Date().toISOString() };
  }
  const map = loadAll();
  if (!map[userId]) {
    map[userId] = {
      userId,
      topics: {},
      updatedAt: new Date().toISOString(),
    };
    saveAll(map);
  }
  return map[userId];
}

export function listUserInterests(userId: string, minScore = 1): InterestTopic[] {
  const profile = getUserInterestProfile(userId);
  return Object.values(profile.topics)
    .filter((t) => t.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/** Clamp score 0–100. */
export function bumpInterest(
  userId: string,
  topicRaw: string,
  delta: number,
  label?: string,
): InterestTopic | null {
  if (!userId || !topicRaw.trim()) return null;
  const key = normalizeKey(topicRaw);
  if (!key || key.length < 2) return null;
  const map = loadAll();
  const profile = map[userId] || {
    userId,
    topics: {},
    updatedAt: new Date().toISOString(),
  };
  const prev = profile.topics[key];
  const nextScore = Math.max(0, Math.min(100, (prev?.score || 0) + delta));
  const topic: InterestTopic = {
    key,
    label: label?.trim() || prev?.label || topicRaw.trim(),
    score: Math.round(nextScore * 10) / 10,
    updatedAt: new Date().toISOString(),
  };
  profile.topics[key] = topic;
  profile.updatedAt = topic.updatedAt;
  map[userId] = profile;
  saveAll(map);
  emitInterestUpdated(userId);
  return topic;
}

/** Raise a topic to at least `minScore` without overshooting on repeat syncs. */
export function ensureInterestAtLeast(
  userId: string,
  topicRaw: string,
  minScore: number,
  label?: string,
): InterestTopic | null {
  if (!userId || !topicRaw.trim()) return null;
  const key = normalizeKey(topicRaw);
  if (!key || key.length < 2) return null;
  const prev = getUserInterestProfile(userId).topics[key]?.score || 0;
  if (prev >= minScore) {
    const existing = getUserInterestProfile(userId).topics[key];
    return existing || null;
  }
  return bumpInterest(userId, topicRaw, minScore - prev, label);
}

function loadSyncMeta(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSyncMeta(meta: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

/** Map free text (circle name, post, role) onto canonical + freeform topics. */
export function topicsFromText(...parts: string[]): Array<{ key: string; label: string }> {
  const blob = parts.filter(Boolean).join(' ').toLowerCase();
  if (!blob.trim()) return [];
  const out: Array<{ key: string; label: string }> = [];
  const seen = new Set<string>();

  for (const alias of Object.values(INTEREST_TOPIC_ALIASES)) {
    if (alias.keywords.some((k) => blob.includes(k))) {
      if (!seen.has(alias.key)) {
        seen.add(alias.key);
        out.push({ key: alias.key, label: alias.label });
      }
    }
  }

  const tokens = blob
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
    .slice(0, 8);
  for (const t of tokens) {
    const key = normalizeKey(t);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      label: t.charAt(0).toUpperCase() + t.slice(1),
    });
  }
  return out.slice(0, 10);
}

export function bumpInterestsFromText(
  userId: string,
  text: string,
  delta: number,
  extraLabel?: string,
) {
  const topics = topicsFromText(text, extraLabel || '');
  for (const t of topics) {
    bumpInterest(userId, t.key, delta / Math.max(1, topics.length * 0.6), t.label);
  }
}

/**
 * Soft-sync from behavioural engine (top roles / companies / slots) into interest ratings.
 * Safe to call often — floors topics (no inflation) and throttles to ~1/hour.
 */
export function syncInterestsFromBehaviour(userId: string): UserInterestProfile {
  const profile = getUserInterestProfile(userId);
  if (!userId) return profile;

  const meta = loadSyncMeta();
  const last = meta[userId] || 0;
  if (Date.now() - last < SYNC_THROTTLE_MS && Object.keys(profile.topics).length > 0) {
    return profile;
  }

  try {
    const signals = getBehaviourSignalsForSuggestions(userId);
    if (!signals) return profile;

    for (const role of (signals.topRoles || []).slice(0, 5)) {
      const floor = Math.min(52, 14 + (role.count || 1) * 5);
      const topics = topicsFromText(`${role.label} ${role.key}`);
      for (const t of topics) {
        ensureInterestAtLeast(userId, t.key, floor / Math.max(1, topics.length * 0.7), t.label);
      }
    }
    for (const co of (signals.topCompanies || []).slice(0, 5)) {
      const floor = Math.min(40, 10 + (co.count || 1) * 4);
      ensureInterestAtLeast(userId, `company_${co.key}`, floor, co.label);
    }
    for (const slot of (signals.preferSlotIds || []).slice(0, 6)) {
      const alias =
        INTEREST_TOPIC_ALIASES[slot] ||
        INTEREST_TOPIC_ALIASES[
          slot === 'jobs'
            ? 'job_search'
            : slot === 'course' || slot === 'quizzes'
              ? 'learning'
              : slot === 'community' || slot === 'events'
                ? 'watercooler'
                : ''
        ];
      if (alias) ensureInterestAtLeast(userId, alias.key, 18, alias.label);
      else ensureInterestAtLeast(userId, slot, 12, slot.replace(/_/g, ' '));
    }

    meta[userId] = Date.now();
    saveSyncMeta(meta);
  } catch {
    /* ignore */
  }
  return getUserInterestProfile(userId);
}

/** Build a searchable haystack weighted by interest scores. */
export function buildInterestHaystack(userId: string): string {
  syncInterestsFromBehaviour(userId);
  const topics = listUserInterests(userId, 3);
  const parts: string[] = [];
  for (const t of topics) {
    const repeats = Math.max(1, Math.round(t.score / 20));
    for (let i = 0; i < repeats; i += 1) {
      parts.push(t.label, t.key.replace(/_/g, ' '));
    }
    const alias = INTEREST_TOPIC_ALIASES[t.key];
    if (alias) parts.push(...alias.keywords);
  }
  return parts.join(' ').toLowerCase();
}

/** Score how well a text blob matches the user's interest ratings (0+). */
export function scoreTextAgainstInterests(userId: string, blob: string): number {
  const topics = listUserInterests(userId, 1);
  if (!topics.length) return 0;
  const lower = blob.toLowerCase();
  let score = 0;
  for (const t of topics) {
    const weight = t.score / 100;
    const needles = [
      t.key.replace(/_/g, ' '),
      t.label.toLowerCase(),
      ...(INTEREST_TOPIC_ALIASES[t.key]?.keywords || []),
    ];
    let hits = 0;
    for (const n of needles) {
      if (n && lower.includes(n)) hits += 1;
    }
    if (hits > 0) score += weight * (2 + hits);
  }
  return score;
}

export type HqInterestTopic = {
  key: string;
  label: string;
  /** 0–100 interest strength */
  score: number;
  updatedAt: string;
};

export type HqPersonalizedRec = {
  id: string;
  interestKey: string;
  interestScore: number;
  title: string;
  /** Short, simple, personalized line for HQ / chat nudges */
  text: string;
  actionUrl: string;
  priority: number;
};

type RecTemplate = {
  title: string;
  actionUrl: string;
  priority: number;
  text: (label: string, score: number) => string;
};

const REC_TEMPLATES: Record<string, RecTemplate> = {
  interview_prep: {
    title: 'Quick interview practice',
    actionUrl: '/lms/interview-prep',
    priority: 84,
    text: (label, score) =>
      `You’re about ${Math.round(score)} on ${label} — try one short mock today.`,
  },
  job_search: {
    title: 'Jobs that match your focus',
    actionUrl: '/explore-jobs',
    priority: 82,
    text: (label, score) =>
      `Strong ${label} signal (${Math.round(score)}). Open 2–3 matching roles and apply to one.`,
  },
  learning: {
    title: 'One course module',
    actionUrl: '/lms/courses',
    priority: 76,
    text: (label, score) =>
      `Your ${label} interest is ${Math.round(score)}. Finish one LMS module this week.`,
  },
  frontend: {
    title: 'Frontend skill boost',
    actionUrl: '/lms/courses',
    priority: 74,
    text: (label) => `You’re leaning into ${label} — take a short course, then update your CV.`,
  },
  backend: {
    title: 'Backend skill boost',
    actionUrl: '/lms/courses',
    priority: 74,
    text: (label) => `You’re leaning into ${label} — take a short course, then update your CV.`,
  },
  product: {
    title: 'Product / PM focus',
    actionUrl: '/lms/courses',
    priority: 72,
    text: (label) => `Interest in ${label} is rising — skim a PM course or related jobs.`,
  },
  leadership: {
    title: 'Leadership prep',
    actionUrl: '/lms/interview-prep',
    priority: 70,
    text: (label) => `You’re showing ${label} interest — practice one leadership interview prompt.`,
  },
  watercooler: {
    title: 'Join the conversation',
    actionUrl: '/community',
    priority: 60,
    text: (label) => `You engage with ${label} — check one new circle post today.`,
  },
};

function recForTopic(topic: InterestTopic): HqPersonalizedRec {
  const tpl =
    REC_TEMPLATES[topic.key] ||
    (topic.key.startsWith('company_')
      ? {
          title: `Follow up on ${topic.label}`,
          actionUrl: '/community',
          priority: 68,
          text: (label: string, score: number) =>
            `High interest in ${label} (${Math.round(score)}). Check their page or open related jobs.`,
        }
      : {
          title: `Stay on ${topic.label}`,
          actionUrl: '/explore-jobs',
          priority: Math.min(70, 40 + Math.round(topic.score / 4)),
          text: (label: string, score: number) =>
            `You’re ${Math.round(score)} into ${label} — pick one job, course, or post on that theme.`,
        });

  return {
    id: `rec_${topic.key}`,
    interestKey: topic.key,
    interestScore: topic.score,
    title: tpl.title,
    text: tpl.text(topic.label, topic.score),
    actionUrl: tpl.actionUrl,
    priority: tpl.priority + Math.min(10, Math.round(topic.score / 15)),
  };
}

/**
 * Snapshot for HQ behavior API: multi-interest ratings + short personalized recs.
 */
export function buildHqInterestSnapshot(userId: string): {
  topics: HqInterestTopic[];
  personalizedRecs: HqPersonalizedRec[];
} {
  if (!userId) return { topics: [], personalizedRecs: [] };
  syncInterestsFromBehaviour(userId);
  const topics = listUserInterests(userId, 1).slice(0, 12);
  const personalizedRecs = topics
    .filter((t) => t.score >= 8)
    .slice(0, 5)
    .map(recForTopic)
    .sort((a, b) => b.priority - a.priority || b.interestScore - a.interestScore);
  return { topics, personalizedRecs };
}
