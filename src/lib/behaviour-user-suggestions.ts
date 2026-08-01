import type { BehaviourSuggestionSignals, HqBehaviourTrigger } from '@/lib/user-activity-tracker';
import { enrichJobIntentSuggestion } from '@/lib/suggestions-engine/job-intent-resolve';

/** Clear, task-style copy for user-facing behaviour alerts (not HQ jargon). */
export type UserBehaviourSuggestion = {
  triggerId: string;
  /** Engagement slot this maps to */
  slotId: string;
  kind:
    | 'course'
    | 'ai_cv'
    | 'interview_prep'
    | 'job'
    | 'event'
    | 'community'
    | 'sales_followup'
    | 'profile';
  title: string;
  text: string;
  actionUrl: string;
  priority: number;
};

type CopyCtx = {
  topRole?: string;
  topCompany?: string;
  missingSectionLabel?: string;
  cvScore?: number | null;
};

type BehaviourSuggestionInput = Pick<
  BehaviourSuggestionSignals,
  | 'hqTriggers'
  | 'topRoles'
  | 'topCompanies'
  | 'cvScore'
  | 'marketFit'
  | 'jobCardClicks7d'
  | 'applies7d'
  | 'pageVisitsByCategory7d'
>;

function roleBit(ctx: CopyCtx) {
  return ctx.topRole ? ` for ${ctx.topRole}` : '';
}

function companyBit(ctx: CopyCtx) {
  return ctx.topCompany || 'that company';
}

/**
 * Map HQ / behaviour triggers → plain user tasks.
 * Language: what to do + where to click. No jargon.
 */
export function suggestionFromTrigger(
  trigger: HqBehaviourTrigger,
  ctx: CopyCtx = {},
): UserBehaviourSuggestion | null {
  const audience = trigger.audience || 'both';
  if (audience === 'hq') return null;

  switch (trigger.id) {
    case 'hq_keyword_ats_gap':
      return {
        triggerId: trigger.id,
        slotId: 'ai_cv',
        kind: 'ai_cv',
        title: 'Make your CV match the job better',
        text:
          'Your CV score looks fine, but applications may still get skipped. Open the AI CV editor, pick a job you want, and rewrite your skills and experience so they clearly match what that job asks for.',
        actionUrl: '/lms/resume-builder/editor',
        priority: 94,
      };
    case 'hq_cv_risk':
      return {
        triggerId: trigger.id,
        slotId: 'ai_cv',
        kind: 'ai_cv',
        title: 'Improve your CV before applying again',
        text:
          ctx.cvScore != null
            ? `Your CV score is about ${Math.round(ctx.cvScore)}% and you have several rejections. Open the AI CV editor and strengthen your summary, work bullets, and skills list before the next apply.`
            : 'You have several rejections. Open the AI CV editor and strengthen your summary, work bullets, and skills list before the next apply.',
        actionUrl: '/lms/resume-builder/editor',
        priority: 92,
      };
    case 'hq_interview_stage_loss':
      return {
        triggerId: trigger.id,
        slotId: 'interview_prep',
        kind: 'interview_prep',
        title: 'Practice a mock interview',
        text:
          'You are getting past early steps but losing after interviews. Open Interview Prep and do one mock interview today so you are ready for the next round.',
        actionUrl: '/lms/interview-prep',
        priority: 91,
      };
    case 'hq_role_skill_mismatch':
      return {
        triggerId: trigger.id,
        slotId: 'course',
        kind: 'course',
        title: ctx.topRole ? `Build skills for ${ctx.topRole}` : 'Build skills for your target role',
        text: `You keep looking at${roleBit(ctx)} roles but rejections suggest you need stronger skills. Take a short course or quiz for that role, then update your CV in the AI CV editor so those skills show clearly.`,
        actionUrl: '/lms/courses',
        priority: 88,
      };
    case 'hq_company_research_no_apply':
      return {
        triggerId: trigger.id,
        slotId: 'jobs',
        kind: 'job',
        title: `Apply at ${companyBit(ctx)}`,
        text: `You have been checking ${companyBit(ctx)} a lot but have not applied much. Open Explore Jobs, find a matching role, and submit one strong application. You can also open a reference check if you know someone there.`,
        actionUrl: '/explore-jobs',
        priority: 87,
      };
    case 'hq_profile_incomplete_job_hunter':
      return {
        triggerId: trigger.id,
        slotId: 'profile',
        kind: 'profile',
        title: 'Finish missing profile sections',
        text: ctx.missingSectionLabel
          ? `You are browsing jobs, but your profile is still incomplete. Add “${ctx.missingSectionLabel}” first — then apply. Matches work better when your profile is filled in.`
          : 'You are browsing jobs, but your profile is still incomplete. Open Profile and fill the missing sections first — then apply.',
        actionUrl: '/profile',
        priority: 89,
      };
    case 'hq_ready_but_not_applying':
      return {
        triggerId: trigger.id,
        slotId: 'jobs',
        kind: 'job',
        title: 'Apply to one job today',
        text: 'Your profile already has skills and you browse jobs often, but you rarely apply. Open Explore Jobs, pick one role that fits, and submit the application today.',
        actionUrl: '/explore-jobs',
        priority: 86,
      };
    case 'hq_cv_hesitation':
      return {
        triggerId: trigger.id,
        slotId: 'ai_cv',
        kind: 'ai_cv',
        title: 'Finish CV edits, then apply',
        text: 'You spend a lot of time editing your CV but do not apply. Open the AI CV editor, make one clear update for a real job, save it, then apply to that job from Explore Jobs.',
        actionUrl: '/lms/resume-builder/editor',
        priority: 85,
      };
    case 'hq_low_market_fit':
      return {
        triggerId: trigger.id,
        slotId: 'course',
        kind: 'course',
        title: ctx.topRole
          ? `Prepare for ${ctx.topRole} — match is still low`
          : 'Prepare before applying — match is still low',
        text: `Your match with the jobs you’ve been viewing looks low${
          ctx.cvScore != null ? ` (CV ~${Math.round(ctx.cvScore)}%)` : ''
        }. Don’t rush an apply — take a short course for that role, or open a premium prep service, then apply when your profile is stronger.`,
        actionUrl: '/lms/courses',
        priority: 90,
      };
    case 'hq_learn_then_target_role':
      return {
        triggerId: trigger.id,
        slotId: 'jobs',
        kind: 'job',
        title: ctx.topRole ? `Apply for ${ctx.topRole} next` : 'Apply using what you learned',
        text: `You have been learning a lot${roleBit(ctx)}. Open Explore Jobs for that role and apply to 1–2 openings. Also run a short quiz if you want a quick check first.`,
        actionUrl: '/explore-jobs',
        priority: 82,
      };
    case 'hq_company_high_intent':
      return {
        triggerId: trigger.id,
        slotId: 'jobs',
        kind: 'job',
        title: `Jobs at ${companyBit(ctx)}`,
        text: `You keep opening ${companyBit(ctx)}. Go to Explore Jobs and apply to an open role there, or ask for a reference check if you know someone at the company.`,
        actionUrl: '/explore-jobs',
        priority: 80,
      };
    case 'hq_role_research':
      return {
        triggerId: trigger.id,
        slotId: 'jobs',
        kind: 'job',
        title: ctx.topRole ? `Keep going on ${ctx.topRole}` : 'Apply to your target role',
        text: `You keep researching${roleBit(ctx)}. Open matched jobs for that role and apply to one that fits. If you need practice, use Interview Prep or a short course first.`,
        actionUrl: '/explore-jobs',
        priority: 79,
      };
    default:
      return null;
  }
}

export function buildUserBehaviourSuggestions(
  signals: BehaviourSuggestionInput | null | undefined,
  opts?: { missingSectionLabel?: string; userId?: string },
): UserBehaviourSuggestion[] {
  if (!signals?.hqTriggers?.length) return [];
  const ctx: CopyCtx = {
    topRole: signals.topRoles?.[0]?.label,
    topCompany: signals.topCompanies?.[0]?.label,
    missingSectionLabel: opts?.missingSectionLabel,
    cvScore: signals.cvScore,
  };
  const otherCompanies = (signals.topCompanies || [])
    .slice(1, 4)
    .map((c) => c.label)
    .filter(Boolean);
  const intentCtx = {
    userId: opts?.userId,
    topCompany: ctx.topCompany,
    topRole: ctx.topRole,
    otherCompanies,
    marketFit: signals.marketFit,
    cvScore: signals.cvScore,
    jobCardClicks: signals.jobCardClicks7d,
    jobVisits: signals.pageVisitsByCategory7d?.jobs || 0,
    applies: signals.applies7d,
    topRoleCount: signals.topRoles?.[0]?.count || 0,
    topCompanyCount: signals.topCompanies?.[0]?.count || 0,
    premiumVisits: signals.pageVisitsByCategory7d?.premium || 0,
    totalVisits:
      Object.values(signals.pageVisitsByCategory7d || {}).reduce(
        (a, b) => a + (b || 0),
        0,
      ) || 0,
  };

  const out: UserBehaviourSuggestion[] = [];
  const seen = new Set<string>();
  for (const trigger of signals.hqTriggers) {
    const suggestion = suggestionFromTrigger(trigger, ctx);
    if (!suggestion || seen.has(suggestion.triggerId)) continue;
    seen.add(suggestion.triggerId);
    out.push(enrichJobIntentSuggestion(suggestion, intentCtx));
  }
  return out.sort((a, b) => b.priority - a.priority);
}

export function suggestionForSlot(
  slotId: string,
  suggestions: UserBehaviourSuggestion[],
): UserBehaviourSuggestion | undefined {
  return suggestions.find((s) => s.slotId === slotId);
}
