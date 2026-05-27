export interface PendingJobApply {
  token: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string | null;
  tenantDbName?: string | null;
  createdAt: number;
}

const PENDING_JOB_APPLY_STORAGE_KEY = 'pendingJobApply';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readPendingJobApply(): PendingJobApply | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(PENDING_JOB_APPLY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingJobApply>;
    if (!parsed || typeof parsed !== 'object') return null;
    const token = String(parsed.token || '').trim();
    const jobId = String(parsed.jobId || '').trim();
    if (!token || !jobId) return null;
    return {
      token,
      jobId,
      jobTitle: String(parsed.jobTitle || '').trim() || 'Job',
      company: String(parsed.company || '').trim() || 'Company',
      companyLogo: typeof parsed.companyLogo === 'string' ? parsed.companyLogo : null,
      tenantDbName: typeof parsed.tenantDbName === 'string' ? parsed.tenantDbName : null,
      createdAt:
        typeof parsed.createdAt === 'number' && Number.isFinite(parsed.createdAt)
          ? parsed.createdAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export function savePendingJobApply(payload: Omit<PendingJobApply, 'createdAt'>) {
  if (!isBrowser()) return;
  const next: PendingJobApply = {
    ...payload,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(PENDING_JOB_APPLY_STORAGE_KEY, JSON.stringify(next));
}

export function clearPendingJobApply() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(PENDING_JOB_APPLY_STORAGE_KEY);
}
