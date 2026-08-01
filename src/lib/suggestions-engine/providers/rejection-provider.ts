import { pickCoursesForText } from '../catalog';
import type {
  AppSnapshot,
  RejectionEvent,
  SuggestionCandidate,
  SuggestionEngineContext,
  SuggestionEngineState,
  SuggestionProvider,
} from '../types';
import { getBehaviourSignalsForSuggestions } from '@/lib/user-activity-tracker';

const POST_INTERVIEW_STATUSES = new Set([
  'interview',
  'assessment',
  'final decision',
  'shortlisted',
  'under review',
]);

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : '';
}

function normalizeStatus(value: unknown): string {
  return asString(value).toLowerCase();
}

function isRejectedStatus(status: string): boolean {
  return normalizeStatus(status) === 'rejected';
}

export function normalizePortalApplication(raw: unknown): AppSnapshot | null {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (!row) return null;
  const id = asString(row.id || row._id || row.applicationId);
  if (!id) return null;
  return {
    id,
    status: asString(row.status || row.applicationStatus) || 'Applied',
    jobTitle: asString(row.jobTitle || row.title) || 'Role',
    company: asString(row.company || row.companyName) || 'Company',
    appliedDate:
      asString(row.appliedDate || row.appliedAt || row.createdAt) ||
      new Date().toISOString(),
    interviewScheduledAt:
      asString(row.interviewScheduledAt || row.interviewDate) || null,
  };
}

function detectNewRejections(
  state: SuggestionEngineState,
  apps: AppSnapshot[],
): RejectionEvent[] {
  const out: RejectionEvent[] = [];

  for (const app of apps) {
    const prev = state.appSnapshots[app.id];
    const nowRejected = isRejectedStatus(app.status);
    const wasRejected = prev ? isRejectedStatus(prev.status) : false;

    if (nowRejected && !state.processedRejections[app.id]) {
      if (!prev) {
        state.processedRejections[app.id] = {
          applicationId: app.id,
          jobTitle: app.jobTitle,
          company: app.company,
          rejectedAt: new Date().toISOString(),
          postInterview: Boolean(app.interviewScheduledAt),
        };
      } else if (!wasRejected) {
        const prevStatus = prev.status || '';
        const postInterview =
          Boolean(app.interviewScheduledAt) ||
          POST_INTERVIEW_STATUSES.has(normalizeStatus(prevStatus));

        out.push({
          applicationId: app.id,
          jobTitle: app.jobTitle,
          company: app.company,
          rejectedAt: new Date().toISOString(),
          postInterview,
          previousStatus: prevStatus || undefined,
        });
      }
    }

    state.appSnapshots[app.id] = app;
  }

  return out;
}

function buildRejectionSuggestions(
  state: SuggestionEngineState,
  rejection: RejectionEvent,
  userId: string,
): SuggestionCandidate[] {
  const out: SuggestionCandidate[] = [];
  const signals = getBehaviourSignalsForSuggestions(userId);
  const insightIds = new Set(signals?.insightIds || []);
  const keywordGap =
    insightIds.has('rejection_keyword_gap') ||
    ((signals?.cvScore ?? 0) >= 70 && (signals?.rejectionsTotal || 0) >= 3);
  const weakCv =
    insightIds.has('rejection_cv_issue') ||
    (signals?.cvScore != null && signals.cvScore < 70);

  const courses = pickCoursesForText(
    rejection.jobTitle,
    state.metrics.repeatRejectionCount >= 2 ? 2 : 1,
  );
  const top = courses[0];

  out.push({
    dedupeKey: `rejection:course:${rejection.applicationId}:${top.id}`,
    scenario: 'rejection_recovery',
    kind: 'course',
    title: `Learn for ${rejection.jobTitle}`,
    actionUrl: top.href,
    priority: 100,
    applicationId: rejection.applicationId,
    text: rejection.postInterview
      ? `${rejection.company} rejected you after the interview for ${rejection.jobTitle}. Open "${top.title}" in LMS and finish one module before your next interview.`
      : `${rejection.company} rejected your application for ${rejection.jobTitle}. Open "${top.title}" in LMS to build the skills this role needs, then try again.`,
  });

  if (courses[1] && state.metrics.postInterviewRejections >= 2) {
    const second = courses[1];
    out.push({
      dedupeKey: `rejection:course2:${rejection.applicationId}:${second.id}`,
      scenario: 'rejection_recovery',
      kind: 'course',
      title: second.title,
      actionUrl: second.href,
      priority: 95,
      applicationId: rejection.applicationId,
      text: `Also open "${second.title}" — another useful course after recent interview rejections.`,
    });
  }

  if (keywordGap && !weakCv) {
    out.push({
      dedupeKey: `rejection:cv:${rejection.applicationId}`,
      scenario: 'rejection_recovery',
      kind: 'ai_cv',
      title: 'Make your CV match this job better',
      actionUrl: '/lms/resume-builder/editor',
      priority: 98,
      applicationId: rejection.applicationId,
      text: `Your CV score looks okay, but ${rejection.company} still rejected you for ${rejection.jobTitle}. Open the AI CV editor and rewrite your skills and experience so they clearly match what this job asks for.`,
    });
  } else {
    out.push({
      dedupeKey: `rejection:cv:${rejection.applicationId}`,
      scenario: 'rejection_recovery',
      kind: 'ai_cv',
      title: 'Improve your CV in AI editor',
      actionUrl: '/lms/resume-builder/editor',
      priority: 90,
      applicationId: rejection.applicationId,
      text:
        state.metrics.repeatRejectionCount >= 2
          ? `You have several rejections recently. Open the AI CV editor and improve your summary, skills, and work bullets before you apply again.`
          : `Before you apply again for roles like ${rejection.jobTitle}, open the AI CV editor and improve your summary, skills, and work bullets.`,
    });
  }

  if (rejection.postInterview) {
    out.push({
      dedupeKey: `rejection:interview:${rejection.applicationId}`,
      scenario: 'rejection_recovery',
      kind: 'interview_prep',
      title: 'Practice a mock interview',
      actionUrl: '/lms/interview-prep',
      priority: 85,
      applicationId: rejection.applicationId,
      text: `You reached interview stage at ${rejection.company} but did not get the role. Open Interview Prep and do one mock interview for ${rejection.jobTitle} today.`,
    });
  }

  if (state.metrics.salesFollowUpReady) {
    out.push({
      dedupeKey: 'rejection:sales_followup',
      scenario: 'rejection_recovery',
      kind: 'sales_followup',
      title: 'Get personal help',
      actionUrl: '/subscriptions',
      priority: 80,
      text:
        'If you want help choosing the next course or CV plan, open Subscriptions or wait for our team to reach out.',
    });
  }

  return out;
}

export const rejectionSuggestionProvider: SuggestionProvider = {
  id: 'rejection',
  run(ctx, state) {
    const apps = (ctx.applications || [])
      .map(normalizePortalApplication)
      .filter((a): a is AppSnapshot => Boolean(a));
    if (!apps.length) return [];

    const newRejections = detectNewRejections(state, apps);
    const candidates: SuggestionCandidate[] = [];

    for (const rejection of newRejections) {
      state.processedRejections[rejection.applicationId] = rejection;
      state.metrics.totalRejections += 1;
      if (rejection.postInterview) state.metrics.postInterviewRejections += 1;
      state.metrics.repeatRejectionCount += 1;
      candidates.push(...buildRejectionSuggestions(state, rejection, ctx.userId));
    }

    return candidates;
  },
};
