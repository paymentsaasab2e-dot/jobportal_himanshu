/**
 * HRYantra Suggestions Engine
 *
 * Modular engine: providers emit candidates → deduped push to HRYantra Verified Chat.
 * Extensible for HQ dashboards, sales follow-up, and new scenarios.
 *
 * Providers today:
 * - rejection — post-interview / application rejections
 * - engagement — rotating activity nudges (~30 min, like profile alerts)
 *
 * HQ hook:
 *   window.addEventListener('saasa:hq-suggestion-metrics', (e) => …)
 */

import { engagementSuggestionProvider } from './providers/engagement-provider';
import { rejectionSuggestionProvider } from './providers/rejection-provider';
import {
  buildHqSuggestionMetrics,
  buildProfileSignalsFromDashboard,
  dispatchSuggestionCandidates,
  getSuggestionEngineState,
  persistSuggestionEngineState,
  pushSuggestionCandidate,
  recordSuggestionClick as clickInState,
  recordSuggestionPurchase as purchaseInState,
  REJECTION_RECOVERY_HQ_EVENT,
  REJECTION_RECOVERY_STORAGE_KEY,
  SUGGESTIONS_ENGINE_HQ_EVENT,
  SUGGESTIONS_ENGINE_STORAGE_KEY,
  ENGAGEMENT_RESURFACE_MS,
} from './store';
import type {
  HqSuggestionMetrics,
  ProfileSignals,
  SuggestionEngineContext,
  SuggestionProvider,
} from './types';

export * from './types';
export * from './catalog';
export {
  SUGGESTIONS_ENGINE_STORAGE_KEY,
  SUGGESTIONS_ENGINE_HQ_EVENT,
  REJECTION_RECOVERY_STORAGE_KEY,
  REJECTION_RECOVERY_HQ_EVENT,
  ENGAGEMENT_RESURFACE_MS,
  buildProfileSignalsFromDashboard,
  getSuggestionEngineState,
};
export { normalizePortalApplication } from './providers/rejection-provider';

const DEFAULT_PROVIDERS: SuggestionProvider[] = [
  rejectionSuggestionProvider,
  engagementSuggestionProvider,
];
/** Register extra providers later (HQ campaigns, A/B tests, etc.). */
let extraProviders: SuggestionProvider[] = [];

export function registerSuggestionProvider(provider: SuggestionProvider) {
  extraProviders = [...extraProviders.filter((p) => p.id !== provider.id), provider];
}

function getProviders(): SuggestionProvider[] {
  return [...DEFAULT_PROVIDERS, ...extraProviders];
}

/** Main engine entry — run all providers and push to verified chat. */
export function runSuggestionsEngine(
  ctx: SuggestionEngineContext,
  options?: { maxPerRun?: number },
): HqSuggestionMetrics | null {
  if (!ctx.userId) return null;

  const state = getSuggestionEngineState(ctx.userId);
  buildHqSuggestionMetrics(state);

  const allCandidates = getProviders().flatMap((provider) => provider.run(ctx, state));

  buildHqSuggestionMetrics(state);

  const rejectionCandidates = allCandidates.filter(
    (c) => c.scenario === 'rejection_recovery',
  );
  const engagementCandidates = allCandidates.filter(
    (c) => c.scenario !== 'rejection_recovery',
  );

  dispatchSuggestionCandidates(state, rejectionCandidates, {
    maxPerRun: options?.maxPerRun ?? 4,
  });
  dispatchSuggestionCandidates(state, engagementCandidates, {
    maxPerRun: 1,
    engagementOnly: true,
  });

  buildHqSuggestionMetrics(state);
  persistSuggestionEngineState(state);
  return buildHqSuggestionMetrics(state);
}

export function recordSuggestionClick(
  userId: string,
  suggestionId: string,
): HqSuggestionMetrics | null {
  if (!userId || !suggestionId) return null;
  const state = getSuggestionEngineState(userId);
  clickInState(state, suggestionId);
  buildHqSuggestionMetrics(state);

  if (
    state.metrics.salesFollowUpReady &&
    !state.suggestions.some((s) => s.kind === 'sales_followup')
  ) {
    pushSuggestionCandidate(state, {
      dedupeKey: 'engagement:sales_followup',
      scenario: 'engagement',
      kind: 'sales_followup',
      title: 'Personal guidance',
      actionUrl: '/subscriptions',
      priority: 70,
      text:
        'You have opened our suggestions more than once. Our sales team may call with a tailored plan — or pick a paid course when you are ready.',
    });
    buildHqSuggestionMetrics(state);
  }

  persistSuggestionEngineState(state);
  return buildHqSuggestionMetrics(state);
}

export function recordSuggestionPurchase(
  userId: string,
  suggestionId?: string,
): HqSuggestionMetrics | null {
  if (!userId) return null;
  const state = getSuggestionEngineState(userId);
  purchaseInState(state, suggestionId);
  persistSuggestionEngineState(state);
  return buildHqSuggestionMetrics(state);
}

export function getHqSuggestionMetrics(userId: string): HqSuggestionMetrics | null {
  if (!userId) return null;
  const state = getSuggestionEngineState(userId);
  return buildHqSuggestionMetrics(state);
}

/** Back-compat wrappers */
export function processRejectionRecovery(
  userId: string,
  rawApplications: unknown[],
  profile?: ProfileSignals | null,
): HqSuggestionMetrics | null {
  return runSuggestionsEngine({ userId, applications: rawApplications, profile });
}

export function recordRecoverySuggestionClick(userId: string, suggestionId: string) {
  return recordSuggestionClick(userId, suggestionId);
}

export function recordRecoverySuggestionPurchase(userId: string, suggestionId?: string) {
  return recordSuggestionPurchase(userId, suggestionId);
}

export function getHqRecoveryMetrics(userId: string) {
  return getHqSuggestionMetrics(userId);
}

export type HqRecoveryMetrics = HqSuggestionMetrics;
