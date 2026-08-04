import type { HqSuggestionMetrics } from '@/lib/suggestions-engine';
import {
  buildHqInterestSnapshot,
  type HqInterestTopic,
  type HqPersonalizedRec,
} from '@/lib/interest-affinity-store';
import {
  buildSessionEngagementStats,
  buildUserActivityRollup,
  getUserActivityState,
  type HqBehaviourTrigger,
  type SessionEngagementStats,
  type SessionLikeForTiming,
  type UserActivityRollup,
} from '@/lib/user-activity-tracker';

export const HQ_BEHAVIOR_API_PATH = '/api/hq-behavior';

export type HqBehaviorPayload = {
  userId: string;
  capturedAt: string;
  activityStateUpdatedAt?: string;
  rollup7d: UserActivityRollup | null;
  suggestionMetrics?: HqSuggestionMetrics | null;
  triggers: HqBehaviourTrigger[];
  /** Multi-topic interest ratings (0–100) from behaviour + OG engagement */
  interests: HqInterestTopic[];
  /** Short, simple personalized recs HQ can push via chat / sales */
  personalizedRecs: HqPersonalizedRec[];
  /**
   * Session duration + location → best local hours/days to send alerts / suggestions.
   * Prefer serverSessions when provided; otherwise local browsing sessions.
   */
  sessionEngagement: SessionEngagementStats | null;
  alertTiming: SessionEngagementStats['alertTiming'] | null;
  locations: SessionEngagementStats['locations'];
};

export function buildHqBehaviorPayload(
  userId: string,
  suggestionMetrics?: HqSuggestionMetrics | null,
  serverSessions?: SessionLikeForTiming[] | null,
): HqBehaviorPayload | null {
  if (!userId) return null;
  const rollup7d = buildUserActivityRollup(userId, 'week');
  const updatedAt = getUserActivityState(userId)?.updatedAt;
  const { topics: interests, personalizedRecs } = buildHqInterestSnapshot(userId);
  const localSessions = rollup7d?.recentSessions || getUserActivityState(userId)?.sessions || [];
  const sessionsForTiming =
    Array.isArray(serverSessions) && serverSessions.length > 0
      ? serverSessions
      : localSessions;
  const sessionEngagement = buildSessionEngagementStats(sessionsForTiming);
  return {
    userId,
    capturedAt: new Date().toISOString(),
    activityStateUpdatedAt: updatedAt,
    rollup7d,
    suggestionMetrics: suggestionMetrics || null,
    triggers: rollup7d?.hqTriggers || [],
    interests,
    personalizedRecs,
    sessionEngagement,
    alertTiming: sessionEngagement.alertTiming,
    locations: sessionEngagement.locations,
  };
}

export async function postHqBehaviorPayload(payload: HqBehaviorPayload): Promise<void> {
  await fetch(HQ_BEHAVIOR_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* best-effort client relay */
  });
}
