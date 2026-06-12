import { API_BASE_URL } from '@/lib/api-base';

function resolvePhase2ProxyBase(): string {
  if (typeof window !== 'undefined') {
    return '/api/proxy/phase2-pre-screen-assessments';
  }
  return (
    process.env.PHASE2_PRE_SCREEN_ASSESSMENTS_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_PHASE2_API_URL?.replace(/\/$/, '') ||
    'http://localhost:5001/api/v1/pre-screen-assessments'
  );
}

function tenantQuery(tenantDbName?: string) {
  const t = String(
    tenantDbName ||
      process.env.NEXT_PUBLIC_PHASE2_TENANT_DB ||
      process.env.PHASE2_PUBLIC_FEED_TENANT_DB ||
      '',
  ).trim();
  return t ? `tenantDbName=${encodeURIComponent(t)}` : '';
}

async function phase2Fetch<T>(path: string, init?: RequestInit, tenantDbName?: string): Promise<T> {
  const base = resolvePhase2ProxyBase();
  const sep = path.includes('?') ? '&' : '?';
  const tq = tenantQuery(tenantDbName);
  const url = tq ? `${base}${path}${sep}${tq}` : `${base}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(json?.message || `Request failed (${res.status})`));
  }
  return (json?.data ?? json) as T;
}

/** Load assessments mirrored on the portal job document (backend1). */
export async function fetchPortalJobAssessments(
  jobId: string,
  apiBase = String(API_BASE_URL),
): Promise<{ assessments: PortalJobAssessment[]; tenantDbName?: string }> {
  const bases = [apiBase, 'http://localhost:5000/api', '/api/proxy'].filter(Boolean);
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/jobs/${encodeURIComponent(jobId)}/pre-screen-assessments`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: PortalJobAssessment[];
        tenantDbName?: string;
      };
      if (json?.success && Array.isArray(json.data)) {
        return {
          assessments: json.data,
          tenantDbName: json.tenantDbName || undefined,
        };
      }
    } catch {
      /* try next base */
    }
  }
  return { assessments: [] };
}

export type PortalJobAssessment = {
  jobAssessmentId: string;
  assessmentId: string;
  title: string;
  type: string;
  durationMinutes: number;
  required: boolean;
  timing: string;
};

export async function fetchJobAssessments(jobId: string, tenantDbName?: string) {
  return phase2Fetch<PortalJobAssessment[]>(
    `/public/jobs/${encodeURIComponent(jobId)}`,
    { method: 'GET' },
    tenantDbName,
  );
}

export async function startAssessmentSession(payload: {
  jobId: string;
  candidateId: string;
  applicationId?: string;
  jobAssessmentId: string;
  tenantDbName?: string;
}) {
  const { tenantDbName, ...body } = payload;
  return phase2Fetch<Record<string, unknown>>(
    '/public/sessions/start',
    { method: 'POST', body: JSON.stringify({ ...body, tenantDbName }) },
    tenantDbName,
  );
}

export async function getAssessmentSession(token: string, tenantDbName?: string) {
  return phase2Fetch<Record<string, unknown>>(
    `/public/sessions/${encodeURIComponent(token)}`,
    { method: 'GET' },
    tenantDbName,
  );
}

export async function logProctoringEvent(
  token: string,
  eventType: string,
  tenantDbName?: string,
  metadata?: Record<string, unknown>,
) {
  return phase2Fetch(
    `/public/sessions/${encodeURIComponent(token)}/proctoring`,
    { method: 'POST', body: JSON.stringify({ eventType, metadata }) },
    tenantDbName,
  );
}

export async function submitAssessmentSession(
  token: string,
  answers: Record<string, unknown>,
  tenantDbName?: string,
) {
  return phase2Fetch<Record<string, unknown>>(
    `/public/sessions/${encodeURIComponent(token)}/submit`,
    { method: 'POST', body: JSON.stringify({ answers }) },
    tenantDbName,
  );
}
