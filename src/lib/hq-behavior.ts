import type { HqSuggestionMetrics } from '@/lib/suggestions-engine';
import {
  buildUserActivityRollup,
  getUserActivityState,
  type HqBehaviourTrigger,
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
};

export function buildHqBehaviorPayload(
  userId: string,
  suggestionMetrics?: HqSuggestionMetrics | null,
): HqBehaviorPayload | null {
  if (!userId) return null;
  const rollup7d = buildUserActivityRollup(userId, 'week');
  const updatedAt = getUserActivityState(userId)?.updatedAt;
  return {
    userId,
    capturedAt: new Date().toISOString(),
    activityStateUpdatedAt: updatedAt,
    rollup7d,
    suggestionMetrics: suggestionMetrics || null,
    triggers: rollup7d?.hqTriggers || [],
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
