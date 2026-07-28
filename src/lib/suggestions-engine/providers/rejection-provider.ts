import { pickCoursesForText } from '../catalog';
import type {
  AppSnapshot,
  RejectionEvent,
  SuggestionCandidate,
  SuggestionEngineContext,
  SuggestionEngineState,
  SuggestionProvider,
} from '../types';

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
): SuggestionCandidate[] {
  const out: SuggestionCandidate[] = [];
  const courses = pickCoursesForText(
    rejection.jobTitle,
    state.metrics.repeatRejectionCount >= 2 ? 2 : 1,
  );
  const top = courses[0];

  out.push({
    dedupeKey: `rejection:course:${rejection.applicationId}:${top.id}`,
    scenario: 'rejection_recovery',
    kind: 'course',
    title: top.title,
    actionUrl: top.href,
    priority: 100,
    applicationId: rejection.applicationId,
    text: rejection.postInterview
      ? `Tough outcome for ${rejection.jobTitle} at ${rejection.company} after your interview stage. Most effective paid upgrade: "${top.title}" (${top.effectiveness}% success signal). ${top.reason}`
      : `Update for ${rejection.jobTitle} at ${rejection.company}: strengthen your next attempt with "${top.title}" (${top.effectiveness}% effectiveness).`,
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
      text: `Second recommendation: "${second.title}" (${second.effectiveness}% effectiveness). ${second.reason}`,
    });
  }

  out.push({
    dedupeKey: `rejection:cv:${rejection.applicationId}`,
    scenario: 'rejection_recovery',
    kind: 'ai_cv',
    title: 'AI-powered CV upgrade',
    actionUrl: '/lms/resume-builder/editor',
    priority: 90,
    applicationId: rejection.applicationId,
    text:
      state.metrics.repeatRejectionCount >= 2
        ? 'Multiple rejections recently — refresh your CV with the AI editor: keywords, impact bullets, and ATS fit.'
        : 'Before your next application, run the AI-powered CV editor to align your resume with this role family.',
  });

  if (rejection.postInterview) {
    out.push({
      dedupeKey: `rejection:interview:${rejection.applicationId}`,
      scenario: 'rejection_recovery',
      kind: 'interview_prep',
      title: 'Interview prep drills',
      actionUrl: '/lms/interview-prep',
      priority: 85,
      applicationId: rejection.applicationId,
      text: 'Practice mock interviews and company question banks — especially after an interview-stage rejection.',
    });
  }

  if (state.metrics.salesFollowUpReady) {
    out.push({
      dedupeKey: 'rejection:sales_followup',
      scenario: 'rejection_recovery',
      kind: 'sales_followup',
      title: 'Personal guidance',
      actionUrl: '/subscriptions',
      priority: 80,
      text:
        'You are exploring upgrades but have not unlocked a paid course yet. Our career team may reach out — or browse token packages anytime.',
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
      candidates.push(...buildRejectionSuggestions(state, rejection));
    }

    return candidates;
  },
};
