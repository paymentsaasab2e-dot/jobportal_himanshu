'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { resolveCandidateIdForApi } from '@/lib/auth-storage';
import { fetchProfileCompleteness } from '@/lib/profile-completion';
import { getMissingProfileSections } from '@/lib/profile-section-routes';
import {
  fetchPortalApplications,
  fetchPortalCvDashboard,
} from '@/lib/query/portal-api';
import {
  buildProfileSignalsFromDashboard,
  recordSuggestionClick,
  runSuggestionsEngine,
  SUGGESTIONS_ENGINE_STORAGE_KEY,
} from '@/lib/suggestions-engine';
import { warmSuggestionJobsCache } from '@/lib/suggestions-engine/job-intent-resolve';
import { stripLocaleFromPathname } from '@/lib/i18n';

/**
 * Runs the suggestions engine globally:
 * - Rejection recovery (applications)
 * - Rotating engagement nudges (~30 min — courses, CV, jobs, profile, etc.)
 *
 * HQ: listen for `saasa:hq-suggestion-metrics`
 */
export function SuggestionsEngineHost() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const userId = user?.id || null;
  const trackedClicks = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) return;

    // Skip heavy profile/dashboard fetches on CV upload & extract (keeps those pages snappy).
    const bare = stripLocaleFromPathname(pathname || '/');
    if (
      bare === '/uploadcv' ||
      bare.startsWith('/uploadcv/') ||
      bare === '/extract' ||
      bare.startsWith('/extract/')
    ) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const run = async () => {
      const candidateId = resolveCandidateIdForApi(userId);
      if (!candidateId || cancelled) return;

      try {
        const [apps, dashboard, profileDetails] = await Promise.all([
          fetchPortalApplications(candidateId).catch(() => []),
          fetchPortalCvDashboard(candidateId).catch(() => null),
          fetchProfileCompleteness(candidateId).catch(() => null),
          warmSuggestionJobsCache(candidateId).catch(() => []),
        ]);
        if (cancelled) return;

        const profile = dashboard
          ? buildProfileSignalsFromDashboard(dashboard)
          : null;
        const missingProfileSections = profileDetails
          ? getMissingProfileSections(null, profileDetails, { forAlerts: true })
          : [];

        runSuggestionsEngine({
          userId,
          applications: apps,
          profile,
          missingProfileSections,
        });
      } catch {
        /* best-effort */
      }
    };

    void run();
    timer = window.setInterval(run, 90_000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [isAuthenticated, isLoading, userId, pathname]);

  useEffect(() => {
    if (!userId || !pathname) return;
    try {
      const raw = localStorage.getItem(SUGGESTIONS_ENGINE_STORAGE_KEY);
      if (!raw) return;
      const map = JSON.parse(raw) as Record<
        string,
        { suggestions?: Array<{ id: string; actionUrl: string; clickedAt?: string }> }
      >;
      const state = map[userId];
      if (!state?.suggestions?.length) return;

      for (const suggestion of state.suggestions) {
        if (suggestion.clickedAt) continue;
        const path = suggestion.actionUrl.split('?')[0];
        if (!path || trackedClicks.current.has(suggestion.id)) continue;
        if (pathname === path || pathname.startsWith(`${path}/`)) {
          trackedClicks.current.add(suggestion.id);
          recordSuggestionClick(userId, suggestion.id);
        }
      }
    } catch {
      /* ignore */
    }
  }, [pathname, userId]);

  return null;
}

/** @deprecated use SuggestionsEngineHost */
export const RejectionRecoveryHost = SuggestionsEngineHost;
