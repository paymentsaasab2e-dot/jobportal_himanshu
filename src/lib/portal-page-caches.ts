import { invalidateApplicationsCache, removeApplicationFromCache } from '@/lib/applications-cache';
import { invalidateCvDashboardCache } from '@/lib/cv-dashboard-cache';
import { clearDashboardSessionCache } from '@/lib/dashboard-session-cache';
import { clearExploreJobsCache } from '@/lib/explore-jobs-session-cache';
import { clearOgEventsCache } from '@/lib/og-events-session-cache';
import { invalidateProfileSessionCache } from '@/lib/profile-session-cache';
import { getQueryClient } from '@/lib/query/query-client';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';
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

function applicationRowId(row: unknown): string {
  if (!row || typeof row !== 'object' || !('id' in row)) return '';
  return String((row as { id?: string }).id || '');
}

function applicationRowJobId(row: unknown): string {
  if (!row || typeof row !== 'object' || !('jobId' in row)) return '';
  return String((row as { jobId?: string }).jobId || '');
}

const WITHDRAWN_IDS_KEY = 'saasa:withdrawn-application-ids:v1';
const withdrawnApplicationIds = new Set<string>();
let withdrawnIdsHydrated = false;

function hydrateWithdrawnApplicationIds() {
  if (withdrawnIdsHydrated || typeof window === 'undefined') return;
  withdrawnIdsHydrated = true;
  try {
    const raw = sessionStorage.getItem(WITHDRAWN_IDS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    for (const value of parsed) {
      const id = String(value || '').trim();
      if (id) withdrawnApplicationIds.add(id);
    }
  } catch {
    /* ignore */
  }
}

function persistWithdrawnApplicationIds() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(WITHDRAWN_IDS_KEY, JSON.stringify([...withdrawnApplicationIds]));
  } catch {
    /* ignore */
  }
}

export function rememberWithdrawnApplicationIds(ids: Array<string | null | undefined>) {
  hydrateWithdrawnApplicationIds();
  let changed = false;
  for (const raw of ids) {
    const id = String(raw || '').trim();
    if (!id || withdrawnApplicationIds.has(id)) continue;
    withdrawnApplicationIds.add(id);
    changed = true;
  }
  if (changed) persistWithdrawnApplicationIds();
}

export function getWithdrawnApplicationIds(): Set<string> {
  hydrateWithdrawnApplicationIds();
  return new Set(withdrawnApplicationIds);
}

export function isWithdrawnApplicationRow(row: { id?: string; jobId?: string } | null | undefined) {
  const hidden = getWithdrawnApplicationIds();
  const id = String(row?.id || '').trim();
  const jobId = String(row?.jobId || '').trim();
  return Boolean((id && hidden.has(id)) || (jobId && hidden.has(jobId)));
}

/** Drop a withdrawn application from local caches so the list card disappears immediately. */
export function removePortalApplicationLocally(
  candidateId: string | null | undefined,
  applicationId: string,
  jobId?: string | null,
) {
  const id = String(candidateId || '').trim();
  const appId = String(applicationId || '').trim();
  const job = String(jobId || '').trim();
  if (!appId) return;

  rememberWithdrawnApplicationIds([appId, job]);
  const hidden = getWithdrawnApplicationIds();

  if (id) {
    removeApplicationFromCache(id, appId);
    if (job) removeApplicationFromCache(id, job);
    clearExploreJobsCache(id);
    invalidateCvDashboardCache(id);
    clearDashboardSessionCache(id);
  }

  try {
    const qc = getQueryClient();
    if (id) {
      void qc.cancelQueries({ queryKey: portalQueryKeys.applications(id) });
      qc.setQueryData(portalQueryKeys.applications(id), (current: unknown) => {
        if (!Array.isArray(current)) return current;
        return current.filter((row) => {
          const rowId = applicationRowId(row);
          const rowJobId = applicationRowJobId(row);
          return !hidden.has(rowId) && !hidden.has(rowJobId);
        });
      });
      void qc.invalidateQueries({ queryKey: portalQueryKeys.cvDashboard(id) });
    }
    qc.removeQueries({ queryKey: portalQueryKeys.applicationDetail(appId) });
  } catch {
    /* ignore */
  }
}
