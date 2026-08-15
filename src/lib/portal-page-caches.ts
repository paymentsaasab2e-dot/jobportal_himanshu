import { invalidateApplicationsCache } from '@/lib/applications-cache';
import { invalidateCvDashboardCache } from '@/lib/cv-dashboard-cache';
import { clearDashboardSessionCache } from '@/lib/dashboard-session-cache';
import { clearExploreJobsCache } from '@/lib/explore-jobs-session-cache';
import { clearOgEventsCache } from '@/lib/og-events-session-cache';
import { invalidateProfileSessionCache } from '@/lib/profile-session-cache';
import { getQueryClient } from '@/lib/query/query-client';
import { clearSessionStorageByPrefixes } from '@/lib/session-cache';

const PORTAL_PAGE_CACHE_PREFIXES = [
  'saasa:dashboard-cache:v1:',
  'saasa:explore-jobs-cache:v1:',
  'saasa:profile-cache:v1:',
  'saasa:og-events-cache:v1:',
];

/** Drop in-memory + session page caches without slowing a later first fetch. */
export function clearAllPortalPageCaches() {
  clearExploreJobsCache();
  invalidateProfileSessionCache();
  clearDashboardSessionCache();
  clearOgEventsCache();
  invalidateCvDashboardCache();
  invalidateApplicationsCache();
  clearSessionStorageByPrefixes(PORTAL_PAGE_CACHE_PREFIXES);
  try {
    getQueryClient().clear();
  } catch {
    /* ignore */
  }
}

/** After apply / profile save — keep UI, but next pull is network. */
export function invalidatePortalAfterApplication(candidateId?: string | null) {
  const id = String(candidateId || '').trim();
  clearExploreJobsCache(id || undefined);
  if (id) {
    invalidateApplicationsCache(id);
    invalidateCvDashboardCache(id);
    clearDashboardSessionCache(id);
  }
  try {
    const qc = getQueryClient();
    if (id) {
      void qc.invalidateQueries({ queryKey: ['portal'] });
    } else {
      qc.clear();
    }
  } catch {
    /* ignore */
  }
}
