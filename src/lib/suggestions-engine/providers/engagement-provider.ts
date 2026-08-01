import { pickCoursesForText, SUGGESTION_COURSE_CATALOG } from '../catalog';
import { canPushEngagementBatch } from '../store';
import type {
  SuggestionCandidate,
  SuggestionEngineContext,
  SuggestionEngineState,
  SuggestionProvider,
} from '../types';
import { getBehaviourSignalsForSuggestions } from '@/lib/user-activity-tracker';
import {
  buildUserBehaviourSuggestions,
  suggestionForSlot,
} from '@/lib/behaviour-user-suggestions';
import { listUserInterests, syncInterestsFromBehaviour } from '@/lib/interest-affinity-store';
import { shouldPrepareBeforeApply } from '@/lib/suggestions-engine/job-intent-resolve';

/** Map rated interest topics → engagement activity slots. */
const INTEREST_TO_SLOTS: Record<string, string[]> = {
  interview_prep: ['interview_prep'],
  job_search: ['jobs', 'ai_cv', 'profile'],
  frontend: ['course', 'jobs'],
  backend: ['course', 'jobs'],
  product: ['course', 'jobs'],
  leadership: ['course', 'interview_prep'],
  learning: ['course', 'quizzes'],
  watercooler: ['community', 'events'],
};

type ActivitySlot = {
  id: string;
  kind: SuggestionCandidate['kind'];
  scenario: SuggestionCandidate['scenario'];
  actionUrl: string | ((ctx: SuggestionEngineContext) => string);
  title: string;
  priority: number;
  when?: (ctx: SuggestionEngineContext) => boolean;
  text: (ctx: SuggestionEngineContext, variant: number) => string;
};

function profileHay(ctx: SuggestionEngineContext): string {
  const p = ctx.profile;
  if (!p) return 'career job skills interview';
  return [p.profileText, p.targetRole, p.workDomain, ...(p.skills || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function roleLabel(ctx: SuggestionEngineContext): string {
  return ctx.profile?.targetRole?.trim() || 'your target role';
}

const ACTIVITY_POOL: ActivitySlot[] = [
  {
    id: 'profile',
    kind: 'profile',
    scenario: 'engagement',
    actionUrl: (ctx) => {
      const section = ctx.missingProfileSections?.[0];
      if (!section) return '/profile';
      return `/profile?open=${encodeURIComponent(section.slug)}&tab=${encodeURIComponent(section.tabId)}`;
    },
    title: 'Finish your profile',
    priority: 75,
    when: (ctx) => (ctx.missingProfileSections?.length || 0) > 0,
    text: (ctx) => {
      const section = ctx.missingProfileSections?.[0];
      const label = section?.label || 'the missing parts';
      return `Your profile is incomplete. Open Profile and add “${label}” now so job matches and applications work better.`;
    },
  },
  {
    id: 'course',
    kind: 'course',
    scenario: 'profile_match',
    actionUrl: (ctx) => pickCoursesForText(profileHay(ctx), 1)[0]?.href || '/lms/courses',
    title: 'Take a useful course',
    priority: 65,
    text: (ctx) => {
      const course = pickCoursesForText(profileHay(ctx), 1)[0];
      const role = roleLabel(ctx);
      return `For ${role}, start “${course.title}” in LMS. Finish one module, then update your CV so that skill shows clearly.`;
    },
  },
  {
    id: 'ai_cv',
    kind: 'ai_cv',
    scenario: 'profile_match',
    actionUrl: '/lms/resume-builder/editor',
    title: 'Update your CV in AI editor',
    priority: 63,
    when: (ctx) => {
      const score = ctx.profile?.cvScore;
      const pct = ctx.profile?.profileCompleteness;
      return score == null || score < 78 || (pct != null && pct < 85);
    },
    text: (ctx) => {
      const score = ctx.profile?.cvScore;
      if (score != null) {
        return `Your CV score is about ${Math.round(score)}%. Open the AI CV editor and improve your summary, skills, and work bullets so they match the jobs you want.`;
      }
      return 'Open the AI CV editor and improve your summary, skills, and work bullets so they match the jobs you want.';
    },
  },
  {
    id: 'interview_prep',
    kind: 'interview_prep',
    scenario: 'interest_nudge',
    actionUrl: '/lms/interview-prep',
    title: 'Practice interview questions',
    priority: 58,
    text: (ctx) => {
      const role = roleLabel(ctx);
      return `Open Interview Prep and do one short mock interview for ${role} today.`;
    },
  },
  {
    id: 'jobs',
    kind: 'job',
    scenario: 'interest_nudge',
    actionUrl: '/explore-jobs',
    title: 'Apply to a matching job',
    priority: 55,
    text: () =>
      'Open Explore Jobs, pick one role that fits your profile, and submit the application today.',
  },
  {
    id: 'events',
    kind: 'event',
    scenario: 'interest_nudge',
    actionUrl: '/community',
    title: 'Check events near you',
    priority: 52,
    text: () =>
      'Open Office Gossips → Events and join one walk-in or webinar that fits your role.',
  },
  {
    id: 'quizzes',
    kind: 'course',
    scenario: 'interest_nudge',
    actionUrl: '/lms/quizzes',
    title: 'Take a short skill quiz',
    priority: 50,
    text: () =>
      'Open LMS Quizzes, pick one topic for your target role, and finish a short quiz to find weak spots.',
  },
  {
    id: 'community',
    kind: 'community',
    scenario: 'interest_nudge',
    actionUrl: '/community',
    title: 'Use Office Gossips',
    priority: 48,
    text: () =>
      'Open Office Gossips to check company pages, ask for a reference, or message someone in your network.',
  },
  {
    id: 'career_path',
    kind: 'course',
    scenario: 'interest_nudge',
    actionUrl: '/lms/career-path',
    title: 'Follow your career path',
    priority: 46,
    text: (ctx) => {
      const role = roleLabel(ctx);
      return `Open Career Path and follow the next step toward ${role} (course, quiz, or event).`;
    },
  },
];

function resolveActionUrl(slot: ActivitySlot, ctx: SuggestionEngineContext): string {
  return typeof slot.actionUrl === 'function' ? slot.actionUrl(ctx) : slot.actionUrl;
}

function buildSlotCandidate(
  slot: ActivitySlot,
  ctx: SuggestionEngineContext,
  state: SuggestionEngineState,
): SuggestionCandidate {
  const variant = state.engagementRotationIndex || 0;
  const courseTitle =
    slot.id === 'course'
      ? pickCoursesForText(profileHay(ctx), 1)[0]?.title
      : undefined;

  return {
    dedupeKey: `engage:${slot.id}`,
    scenario: slot.scenario,
    kind: slot.kind,
    title: slot.id === 'course' && courseTitle ? courseTitle : slot.title,
    actionUrl: resolveActionUrl(slot, ctx),
    priority: slot.priority,
    text: slot.text(ctx, variant),
    hqMeta: { activityId: slot.id, rotation: variant },
  };
}

/**
 * Rotating engagement nudges — one activity every ~30 min.
 * Behaviour triggers override title/text with clear task copy when they match.
 */
export const engagementSuggestionProvider: SuggestionProvider = {
  id: 'engagement',
  run(ctx, state) {
    if (!canPushEngagementBatch(state)) return [];

    const signals = getBehaviourSignalsForSuggestions(ctx.userId);
    const prefer = new Set(signals?.preferSlotIds || []);
    const deprioritize = new Set(signals?.deprioritizeSlotIds || []);
    syncInterestsFromBehaviour(ctx.userId);
    const interestBoost = new Map<string, number>();
    for (const topic of listUserInterests(ctx.userId, 8).slice(0, 8)) {
      const slots = INTEREST_TO_SLOTS[topic.key] || [];
      const boost = Math.min(28, Math.round(topic.score / 4));
      for (const slotId of slots) {
        interestBoost.set(slotId, Math.max(interestBoost.get(slotId) || 0, boost));
        prefer.add(slotId);
      }
    }

    const prepCtx = {
      marketFit: signals?.marketFit,
      cvScore: signals?.cvScore ?? ctx.profile?.cvScore,
      jobCardClicks: signals?.jobCardClicks7d,
      jobVisits: signals?.pageVisitsByCategory7d?.jobs || 0,
      applies: signals?.applies7d,
      topRoleCount: signals?.topRoles?.[0]?.count || 0,
      topCompanyCount: signals?.topCompanies?.[0]?.count || 0,
      premiumVisits: signals?.pageVisitsByCategory7d?.premium || 0,
      totalVisits: Object.values(signals?.pageVisitsByCategory7d || {}).reduce(
        (a, b) => a + (b || 0),
        0,
      ),
      topRole: signals?.topRoles?.[0]?.label || ctx.profile?.targetRole || undefined,
      topCompany: signals?.topCompanies?.[0]?.label,
    };
    const prepareFirst = shouldPrepareBeforeApply(prepCtx);
    if (prepareFirst) {
      prefer.add('course');
      prefer.add('ai_cv');
      interestBoost.set('course', Math.max(interestBoost.get('course') || 0, 30));
      // Soft-deprioritize raw apply when match is weak after real browsing
      deprioritize.add('jobs');
    }

    const behaviourSuggestions = buildUserBehaviourSuggestions(signals, {
      missingSectionLabel: ctx.missingProfileSections?.[0]?.label,
      userId: ctx.userId,
    });

    const topBehaviour = behaviourSuggestions[0];
    if (topBehaviour && (prefer.has(topBehaviour.slotId) || prepareFirst)) {
      return [
        {
          dedupeKey: `engage:behaviour:${topBehaviour.triggerId}`,
          scenario: 'engagement',
          kind: topBehaviour.kind,
          title: topBehaviour.title,
          actionUrl: topBehaviour.actionUrl,
          priority: topBehaviour.priority + 20,
          text: topBehaviour.text,
          hqMeta: {
            activityId: topBehaviour.slotId,
            behaviourTriggerId: topBehaviour.triggerId,
            scoredFromBehaviour: true,
            behaviourInsightIds: signals?.insightIds || [],
            prepareBeforeApply: prepareFirst,
          },
        },
      ];
    }

    // Explicit low-match prep when no HQ trigger but interest + weak scores exist
    if (prepareFirst) {
      const hay = profileHay(ctx);
      const course = pickCoursesForText(hay, 1)[0];
      const veryLow =
        (prepCtx.marketFit != null && prepCtx.marketFit < 45) ||
        (prepCtx.cvScore != null && prepCtx.cvScore < 55);
      if (veryLow || (prepCtx.premiumVisits || 0) >= 1) {
        return [
          {
            dedupeKey: 'engage:prep:premium',
            scenario: 'interest_nudge',
            kind: 'sales_followup',
            title: prepCtx.topRole
              ? `Prepare for ${prepCtx.topRole} before applying`
              : 'Prepare before you apply',
            actionUrl:
              prepCtx.cvScore != null && prepCtx.cvScore < 65
                ? '/services/ai-resume-review'
                : '/services/mock-interview',
            priority: 92,
            text: `You’ve been browsing jobs more than once, but your match looks low${
              prepCtx.marketFit != null
                ? ` (market fit ~${Math.round(prepCtx.marketFit)}%)`
                : ''
            }. Open a premium prep service${course ? ` or “${course.title}”` : ''}, then apply when you’re stronger.`,
            hqMeta: { activityId: 'course', prepareBeforeApply: true },
          },
        ];
      }
      if (course) {
        return [
          {
            dedupeKey: `engage:prep:course:${course.id}`,
            scenario: 'interest_nudge',
            kind: 'course',
            title: `Course prep: ${course.title}`,
            actionUrl: course.href,
            priority: 90,
            text: `Your job interest is clear, but scores are still low. Take “${course.title}” to prepare${
              prepCtx.topRole ? ` for ${prepCtx.topRole}` : ''
            }, then apply with a stronger profile.`,
            hqMeta: { activityId: 'course', prepareBeforeApply: true },
          },
        ];
      }
    }

    const eligible = ACTIVITY_POOL.filter((slot) => !slot.when || slot.when(ctx));
    if (!eligible.length) {
      if (topBehaviour) {
        return [
          {
            dedupeKey: `engage:behaviour:${topBehaviour.triggerId}`,
            scenario: 'engagement',
            kind: topBehaviour.kind,
            title: topBehaviour.title,
            actionUrl: topBehaviour.actionUrl,
            priority: topBehaviour.priority,
            text: topBehaviour.text,
            hqMeta: {
              activityId: topBehaviour.slotId,
              behaviourTriggerId: topBehaviour.triggerId,
              scoredFromBehaviour: true,
            },
          },
        ];
      }
      return [];
    }

    const scored = eligible
      .map((slot) => {
        let score = slot.priority;
        if (prefer.has(slot.id)) score += 40;
        if (deprioritize.has(slot.id)) score -= 25;
        if (suggestionForSlot(slot.id, behaviourSuggestions)) score += 15;
        score += interestBoost.get(slot.id) || 0;
        const rot = (state.engagementRotationIndex || 0) % Math.max(eligible.length, 1);
        score += (slot.id.charCodeAt(0) + rot) % 7;
        return { slot, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    if (!top) return [];

    const candidate = buildSlotCandidate(top.slot, ctx, state);
    const override = suggestionForSlot(top.slot.id, behaviourSuggestions);
    if (override) {
      candidate.title = override.title;
      candidate.text = override.text;
      candidate.actionUrl = override.actionUrl;
      candidate.dedupeKey = `engage:behaviour:${override.triggerId}`;
      candidate.hqMeta = {
        ...candidate.hqMeta,
        behaviourTriggerId: override.triggerId,
      };
    }
    candidate.priority = top.score;
    candidate.hqMeta = {
      ...candidate.hqMeta,
      behaviourInsightIds: signals?.insightIds || [],
      preferSlotIds: signals?.preferSlotIds || [],
      userSuggestionHints: behaviourSuggestions.slice(0, 3).map((s) => s.title),
      scoredFromBehaviour: true,
    };
    return [candidate];
  },
};

export function listEngagementActivityIds(): string[] {
  return ACTIVITY_POOL.map((a) => a.id);
}

export function listCourseCatalogTitles(): string[] {
  return SUGGESTION_COURSE_CATALOG.map((c) => c.title);
}
