import type { PortalJobAssessment } from '@/lib/phase2-assessment-api';
import { fetchJobAssessments, fetchPortalJobAssessments } from '@/lib/phase2-assessment-api';
import { API_BASE_URL } from '@/lib/api-base';

export type JobAssessmentLink = PortalJobAssessment;

export function normalizeAssessmentTiming(timing: unknown): 'BEFORE_SUBMIT' | 'AFTER_APPLY' {
  const t = String(timing || 'AFTER_APPLY').toUpperCase().replace(/\s+/g, '_');
  if (t.includes('BEFORE')) return 'BEFORE_SUBMIT';
  return 'AFTER_APPLY';
}

export function parseJobAssessmentList(raw: unknown): JobAssessmentLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const jobAssessmentId = String(o.jobAssessmentId || o.id || '').trim();
      if (!jobAssessmentId) return null;
      const timing = normalizeAssessmentTiming(o.timing);
      return {
        jobAssessmentId,
        assessmentId: String(o.assessmentId || '').trim(),
        title: String(o.title || 'Assessment'),
        type: String(o.type || 'MCQ'),
        durationMinutes: Number(o.durationMinutes) || 15,
        required: o.required !== false,
        timing,
      } satisfies JobAssessmentLink;
    })
    .filter(Boolean) as JobAssessmentLink[];
}

export function assessmentsBeforeSubmit(links: JobAssessmentLink[]): JobAssessmentLink[] {
  return links.filter((a) => normalizeAssessmentTiming(a.timing) === 'BEFORE_SUBMIT');
}

export function assessmentsAfterApply(links: JobAssessmentLink[]): JobAssessmentLink[] {
  return links.filter((a) => normalizeAssessmentTiming(a.timing) === 'AFTER_APPLY');
}

/** After apply: only tests configured for AFTER_APPLY (BEFORE_SUBMIT runs on Apply click). */
export function assessmentsForPostApplyRedirect(links: JobAssessmentLink[]): JobAssessmentLink[] {
  return assessmentsAfterApply(links);
}

export function buildAssessmentAttemptPath(params: {
  jobId: string;
  candidateId: string;
  applicationId?: string;
  jobAssessmentId: string;
  tenantDbName?: string;
  next?: string;
}): string {
  const q = new URLSearchParams();
  q.set('jobId', params.jobId);
  q.set('candidateId', params.candidateId);
  if (params.applicationId) q.set('applicationId', params.applicationId);
  q.set('jobAssessmentId', params.jobAssessmentId);
  if (params.tenantDbName) q.set('tenantDbName', params.tenantDbName);
  if (params.next) q.set('next', params.next);
  return `/apply/assessment?${q.toString()}`;
}

function buildAssessmentChain(params: {
  jobId: string;
  candidateId: string;
  applicationId?: string;
  tenantDbName?: string;
  assessments: JobAssessmentLink[];
  finalPath: string;
}): string | null {
  const ordered = params.assessments.filter((a) => a.required !== false);
  const list = ordered.length ? ordered : params.assessments;
  if (!list.length) return null;

  const buildAt = (index: number): string => {
    const current = list[index];
    const next = index + 1 < list.length ? buildAt(index + 1) : params.finalPath;
    return buildAssessmentAttemptPath({
      jobId: params.jobId,
      candidateId: params.candidateId,
      applicationId: params.applicationId,
      jobAssessmentId: current.jobAssessmentId,
      tenantDbName: params.tenantDbName,
      next,
    });
  };

  return buildAt(0);
}

/** Redirect before application is submitted (timing = BEFORE_SUBMIT). */
export function buildBeforeSubmitAssessmentRedirect(params: {
  jobId: string;
  candidateId: string;
  tenantDbName?: string;
  assessments: JobAssessmentLink[];
}): string | null {
  const before = assessmentsBeforeSubmit(params.assessments);
  if (!before.length) return null;
  const finalPath = `/explore-jobs?pendingApply=${encodeURIComponent(params.jobId)}`;
  return buildAssessmentChain({ ...params, assessments: before, finalPath });
}

/** Redirect after application submitted (timing = AFTER_APPLY, or fallback all). */
export function buildFirstAssessmentRedirect(params: {
  jobId: string;
  candidateId: string;
  applicationId?: string;
  tenantDbName?: string;
  assessments: JobAssessmentLink[];
}): string | null {
  const list = assessmentsForPostApplyRedirect(params.assessments);
  const finalPath = params.applicationId
    ? `/applications/${params.applicationId}`
    : '/applications';
  return buildAssessmentChain({ ...params, assessments: list, finalPath });
}

export const PENDING_APPLY_STORAGE_KEY = 'prescreen_pending_apply_job_id';

export async function resolveJobAssessmentsForApply(
  jobId: string,
  detail?: Record<string, unknown> | null,
  tenantDbName?: string,
): Promise<{ assessments: JobAssessmentLink[]; tenantDbName?: string }> {
  const resolvedTenant =
    tenantDbName ||
    (typeof detail?.tenantDbName === 'string' ? detail.tenantDbName : undefined);

  const fromDetail = parseJobAssessmentList(detail?.preScreenAssessments);
  if (fromDetail.length) {
    return { assessments: fromDetail, tenantDbName: resolvedTenant };
  }

  try {
    const portal = await fetchPortalJobAssessments(jobId, String(API_BASE_URL));
    if (portal.assessments.length) {
      return {
        assessments: portal.assessments,
        tenantDbName: portal.tenantDbName || resolvedTenant,
      };
    }
  } catch {
    /* fall through */
  }

  try {
    const fromPhase2 = await fetchJobAssessments(jobId, resolvedTenant);
    if (Array.isArray(fromPhase2) && fromPhase2.length) {
      return { assessments: fromPhase2, tenantDbName: resolvedTenant };
    }
  } catch {
    /* fall through */
  }

  return { assessments: [], tenantDbName: resolvedTenant };
}

export function assessmentBannerMessage(assessments: JobAssessmentLink[]): string {
  if (!assessments.length) return '';
  const before = assessmentsBeforeSubmit(assessments);
  const after = assessmentsAfterApply(assessments);
  const titles = assessments.map((a) => a.title).filter(Boolean).join(' → ');
  if (before.length && !after.length) {
    return `When you click Apply, you will complete ${before.length} timed assessment${before.length > 1 ? 's' : ''} first: ${titles}`;
  }
  if (after.length && !before.length) {
    return `After you apply, you will complete ${after.length} timed assessment${after.length > 1 ? 's' : ''}: ${titles}`;
  }
  return `This role includes ${assessments.length} timed assessment${assessments.length > 1 ? 's' : ''}: ${titles}`;
}
