import { pushHryantraVerifiedMessage } from '@/lib/hryantra-verified-chat-store';
import type {
  HqSuggestionMetrics,
  SuggestionCandidate,
  SuggestionEngineContext,
  SuggestionEngineState,
  SuggestionRecord,
  RejectionEvent,
} from './types';

export const SUGGESTIONS_ENGINE_STORAGE_KEY = 'saasa:suggestions-engine-v1';
export const SUGGESTIONS_ENGINE_HQ_EVENT = 'saasa:hq-suggestion-metrics';

/** Same cadence as profile missing alerts — resurface engagement nudges. */
export const ENGAGEMENT_RESURFACE_MS = 30 * 60 * 1000;
export const REJECTION_RESURFACE_MS = 6 * 60 * 60 * 1000;
/** @deprecated use SUGGESTIONS_ENGINE_HQ_EVENT */
export const REJECTION_RECOVERY_HQ_EVENT = SUGGESTIONS_ENGINE_HQ_EVENT;

/** @deprecated use SUGGESTIONS_ENGINE_STORAGE_KEY */
export const REJECTION_RECOVERY_STORAGE_KEY = SUGGESTIONS_ENGINE_STORAGE_KEY;

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): Record<string, SuggestionEngineState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw =
      localStorage.getItem(SUGGESTIONS_ENGINE_STORAGE_KEY) ||
      localStorage.getItem('saasa:rejection-recovery-v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SuggestionEngineState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, SuggestionEngineState>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUGGESTIONS_ENGINE_STORAGE_KEY, JSON.stringify(map));
}

export function getSuggestionEngineState(userId: string): SuggestionEngineState {
  const map = loadAll();
  if (!map[userId]) {
    map[userId] = {
      userId,
      appSnapshots: {},
      processedRejections: {},
      suggestions: [],
      pushedDedupeKeys: {},
      metrics: {
        totalRejections: 0,
        postInterviewRejections: 0,
        repeatRejectionCount: 0,
        suggestionsPushed: 0,
        suggestionsClicked: 0,
        suggestionsPurchased: 0,
        salesFollowUpScore: 0,
        salesFollowUpReady: false,
        byScenario: {},
      },
    };
    saveAll(map);
  }
  if (!map[userId].metrics.byScenario) {
    map[userId].metrics.byScenario = {};
  }
  if (!map[userId].pushedDedupeKeys) {
    map[userId].pushedDedupeKeys = {};
  }
  return map[userId];
}

export function persistSuggestionEngineState(state: SuggestionEngineState) {
  const map = loadAll();
  map[state.userId] = state;
  saveAll(map);
}

function computeSalesScore(state: SuggestionEngineState): {
  score: number;
  ready: boolean;
  reason?: string;
} {
  const m = state.metrics;
  let score = 0;
  if (m.postInterviewRejections >= 1) score += 25;
  if (m.postInterviewRejections >= 2) score += 20;
  if (m.repeatRejectionCount >= 2) score += 15;
  if (m.suggestionsClicked >= 1) score += 10;
  if (m.suggestionsClicked >= 2 && m.suggestionsPurchased === 0) score += 20;
  if (m.suggestionsPushed >= 3 && m.suggestionsPurchased === 0) score += 10;

  const ready =
    (m.postInterviewRejections >= 2 &&
      m.suggestionsClicked >= 2 &&
      m.suggestionsPurchased === 0) ||
    (m.repeatRejectionCount >= 3 && m.suggestionsPurchased === 0);

  let reason: string | undefined;
  if (ready) {
    if (m.suggestionsClicked >= 2 && m.suggestionsPurchased === 0) {
      reason =
        'Clicked suggestions multiple times without purchasing — high intent, needs human follow-up.';
    } else {
      reason = 'Repeated post-interview rejections without upgrade action.';
    }
  }

  return { score: Math.min(100, score), ready, reason };
}

export function buildHqSuggestionMetrics(
  state: SuggestionEngineState,
  lastRejection?: RejectionEvent,
): HqSuggestionMetrics {
  const { score, ready, reason } = computeSalesScore(state);
  state.metrics.salesFollowUpScore = score;
  state.metrics.salesFollowUpReady = ready;
  state.metrics.salesQueueReason = reason;

  const metrics: HqSuggestionMetrics = {
    userId: state.userId,
    updatedAt: new Date().toISOString(),
    ...state.metrics,
    lastRejection,
    recentSuggestions: state.suggestions.slice(-16),
    salesQueueReason: reason,
    byScenario: { ...state.metrics.byScenario },
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SUGGESTIONS_ENGINE_HQ_EVENT, { detail: metrics }),
    );
  }

  return metrics;
}

export function shouldPushCandidate(
  state: SuggestionEngineState,
  candidate: SuggestionCandidate,
): boolean {
  const last = state.pushedDedupeKeys[candidate.dedupeKey];
  if (!last) return true;
  const age = Date.now() - Date.parse(last);
  const resurfaceMs =
    candidate.scenario === 'rejection_recovery'
      ? REJECTION_RESURFACE_MS
      : ENGAGEMENT_RESURFACE_MS;
  return age >= resurfaceMs;
}

export function canPushEngagementBatch(state: SuggestionEngineState): boolean {
  const last = state.lastEngagementPushAt ? Date.parse(state.lastEngagementPushAt) : 0;
  if (!last) return true;
  return Date.now() - last >= ENGAGEMENT_RESURFACE_MS;
}

export function markEngagementBatchPushed(state: SuggestionEngineState): void {
  state.lastEngagementPushAt = new Date().toISOString();
}
export function pushSuggestionCandidate(
  state: SuggestionEngineState,
  candidate: SuggestionCandidate,
): SuggestionRecord | null {
  if (!shouldPushCandidate(state, candidate)) return null;

  const record: SuggestionRecord = {
    id: uid('sug'),
    dedupeKey: candidate.dedupeKey,
    scenario: candidate.scenario,
    kind: candidate.kind,
    title: candidate.title,
    actionUrl: candidate.actionUrl,
    pushedAt: new Date().toISOString(),
    applicationId: candidate.applicationId,
  };

  pushHryantraVerifiedMessage({
    userId: state.userId,
    text: candidate.title
      ? `${candidate.title}\n\n${candidate.text}`
      : candidate.text,
    actionUrl: candidate.actionUrl,
    hqMeta: {
      source: 'suggestions-engine',
      suggestionId: record.id,
      scenario: candidate.scenario,
      kind: candidate.kind,
      applicationId: candidate.applicationId,
      salesFollowUpReady: state.metrics.salesFollowUpReady,
      ...candidate.hqMeta,
    },
  });

  state.suggestions.push(record);
  state.pushedDedupeKeys[candidate.dedupeKey] = record.pushedAt;
  state.metrics.suggestionsPushed += 1;
  state.metrics.byScenario[candidate.scenario] =
    (state.metrics.byScenario[candidate.scenario] || 0) + 1;

  if (candidate.scenario !== 'rejection_recovery') {
    markEngagementBatchPushed(state);
    state.engagementRotationIndex = (state.engagementRotationIndex || 0) + 1;
  }

  return record;
}

export function dispatchSuggestionCandidates(
  state: SuggestionEngineState,
  candidates: SuggestionCandidate[],
  options?: { maxPerRun?: number; engagementOnly?: boolean },
): number {
  const max = options?.maxPerRun ?? 6;
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);

  if (options?.engagementOnly && !canPushEngagementBatch(state)) {
    return 0;
  }

  let pushed = 0;
  for (const candidate of sorted) {
    if (pushed >= max) break;
    if (
      options?.engagementOnly &&
      candidate.scenario === 'rejection_recovery'
    ) {
      continue;
    }
    if (
      candidate.scenario !== 'rejection_recovery' &&
      options?.engagementOnly &&
      pushed > 0
    ) {
      break;
    }
    const record = pushSuggestionCandidate(state, candidate);
    if (record) pushed += 1;
  }
  return pushed;
}

export function recordSuggestionClick(
  state: SuggestionEngineState,
  suggestionId: string,
): SuggestionRecord | null {
  const record = state.suggestions.find((s) => s.id === suggestionId);
  if (!record || record.clickedAt) return null;

  record.clickedAt = new Date().toISOString();
  state.metrics.suggestionsClicked += 1;
  return record;
}

export function recordSuggestionPurchase(
  state: SuggestionEngineState,
  suggestionId?: string,
): void {
  if (suggestionId) {
    const record = state.suggestions.find((s) => s.id === suggestionId);
    if (record && !record.purchasedAt) {
      record.purchasedAt = new Date().toISOString();
      state.metrics.suggestionsPurchased += 1;
    }
  } else {
    state.metrics.suggestionsPurchased += 1;
  }
  state.metrics.salesFollowUpReady = false;
  state.metrics.salesQueueReason = undefined;
}

export function buildProfileSignalsFromDashboard(data: {
  profile?: { email?: string };
  stats?: { cvScore?: number; profileCompleteness?: number };
  topSkills?: Array<{ name: string }>;
  recentApplications?: Array<{ jobTitle: string; company: string }>;
}): import('./types').ProfileSignals {
  const skills = (data.topSkills || []).map((s) => s.name).filter(Boolean);
  const appBits = (data.recentApplications || [])
    .slice(0, 3)
    .map((a) => `${a.jobTitle} ${a.company}`)
    .join(' ');
  const email = data.profile?.email || '';
  const workDomain = email.includes('@') ? email.split('@')[1]?.split('.')[0] : '';

  return {
    profileText: [skills.join(' '), appBits, workDomain].filter(Boolean).join(' '),
    skills,
    targetRole: skills[0] || appBits.split(' ')[0] || undefined,
    cvScore: data.stats?.cvScore ?? null,
    profileCompleteness: data.stats?.profileCompleteness ?? null,
    email,
    workDomain,
  };
}
