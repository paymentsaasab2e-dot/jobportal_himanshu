'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { resolveCandidateIdForApi } from '@/lib/auth-storage';
import {
  fetchPortalApplications,
  fetchPortalCvDashboard,
} from '@/lib/query/portal-api';
import {
  ensureActivitySession,
  recordActiveTime,
  recordPageVisit,
  syncProfileActivitySnapshot,
  endActivitySession,
} from '@/lib/user-activity-tracker';
import { stripLocaleFromPathname } from '@/lib/i18n';

const HEARTBEAT_MS = 15_000;
const PROFILE_SYNC_MS = 120_000;

function isRejectedStatus(status: unknown): boolean {
  const s = String(status || '').toLowerCase();
  return (
    s.includes('reject') ||
    s.includes('declin') ||
    s === 'not_selected' ||
    s === 'unsuccessful'
  );
}

function isPostInterviewRejection(app: Record<string, unknown>): boolean {
  if (!isRejectedStatus(app.status)) return false;
  const prev = String(app.previousStatus || app.lastStatus || '').toLowerCase();
  if (prev.includes('interview')) return true;
  if (app.interviewScheduledAt) return true;
  return false;
}

/**
 * Global behaviour tracker: sessions, page visits, time-on-site, profile sync.
 * Job card clicks / applies are recorded at click sites via track helpers.
 */
export function UserActivityTrackerHost() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const userId = user?.id || null;
  const lastPathRef = useRef<string | null>(null);
  const visibleRef = useRef(true);

  // Session + page visits
  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) return;
    const path = stripLocaleFromPathname(pathname || '/');
    ensureActivitySession(userId, { path });
    if (lastPathRef.current !== path) {
      recordPageVisit(userId, path);
      lastPathRef.current = path;
    }
  }, [isAuthenticated, isLoading, userId, pathname]);

  // Active time heartbeat while tab visible
  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) return;

    const onVis = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (!visibleRef.current) return;
      ensureActivitySession(userId);
    };
    document.addEventListener('visibilitychange', onVis);

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const path = stripLocaleFromPathname(pathname || '/');
      recordActiveTime(userId, HEARTBEAT_MS, path);
    }, HEARTBEAT_MS);

    const onUnload = () => endActivitySession(userId);
    window.addEventListener('pagehide', onUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(timer);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [isAuthenticated, isLoading, userId, pathname]);

  // Sync skills / applications / CV for behaviour insights
  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) return;

    let cancelled = false;

    const sync = async () => {
      const candidateId = resolveCandidateIdForApi(userId);
      if (!candidateId || cancelled) return;
      try {
        const [apps, dashboard] = await Promise.all([
          fetchPortalApplications(candidateId).catch(() => []),
          fetchPortalCvDashboard(candidateId).catch(() => null),
        ]);
        if (cancelled) return;

        const list = Array.isArray(apps) ? apps : [];
        let rejections = 0;
        let postInterviewRejections = 0;
        for (const raw of list) {
          const app = (raw || {}) as Record<string, unknown>;
          if (isRejectedStatus(app.status)) {
            rejections += 1;
            if (isPostInterviewRejection(app)) postInterviewRejections += 1;
          }
        }

        const skills = Array.isArray(dashboard?.topSkills)
          ? dashboard!.topSkills.length
          : 0;

        syncProfileActivitySnapshot(userId, {
          skillsCount: skills,
          profileCompleteness: dashboard?.stats?.profileCompleteness ?? null,
          cvScore: dashboard?.stats?.cvScore ?? null,
          applicationsTotal: list.length,
          rejectionsTotal: rejections,
          postInterviewRejections,
        });
      } catch {
        /* best-effort */
      }
    };

    void sync();
    const timer = window.setInterval(sync, PROFILE_SYNC_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, isLoading, userId]);

  return null;
}
