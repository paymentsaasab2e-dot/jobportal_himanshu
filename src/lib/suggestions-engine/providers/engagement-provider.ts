import { pickCoursesForText, SUGGESTION_COURSE_CATALOG } from '../catalog';
import { canPushEngagementBatch } from '../store';
import type {
  SuggestionCandidate,
  SuggestionEngineContext,
  SuggestionEngineState,
  SuggestionProvider,
} from '../types';
import { getBehaviourSignalsForSuggestions } from '@/lib/user-activity-tracker';

type ActivitySlot = {
  id: string;
  kind: SuggestionCandidate['kind'];
  scenario: SuggestionCandidate['scenario'];
  actionUrl: string | ((ctx: SuggestionEngineContext) => string);
  title: string;
  priority: number;
  /** Skip unless condition met */
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
    title: 'Complete your profile',
    priority: 75,
    when: (ctx) => (ctx.missingProfileSections?.length || 0) > 0,
    text: (ctx, v) => {
      const section = ctx.missingProfileSections?.[0];
      const label = section?.label || 'missing sections';
      const variants = [
        `${label} is still missing — complete it to unlock stronger job matches (same reminder as your profile alerts).`,
        `Profile alert: add ${label} when you have a minute. Stronger profiles get more recruiter views.`,
        `Quick win — finish ${label} in your profile. We'll keep nudging until it's done.`,
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'course',
    kind: 'course',
    scenario: 'profile_match',
    actionUrl: (ctx) => pickCoursesForText(profileHay(ctx), 1)[0]?.href || '/lms/courses',
    title: 'Skill upgrade course',
    priority: 65,
    text: (ctx, v) => {
      const course = pickCoursesForText(profileHay(ctx), 1)[0];
      const role = roleLabel(ctx);
      const variants = [
        `Based on ${role}, "${course.title}" is a high-impact paid course (${course.effectiveness}% effectiveness). ${course.reason}`,
        `Keep building — "${course.title}" fits your profile. Most learners see better interview outcomes after this module.`,
        `Next step for ${role}: unlock "${course.title}" when you're ready to level up.`,
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'ai_cv',
    kind: 'ai_cv',
    scenario: 'profile_match',
    actionUrl: '/lms/resume-builder/editor',
    title: 'AI-powered CV polish',
    priority: 63,
    when: (ctx) => {
      const score = ctx.profile?.cvScore;
      const pct = ctx.profile?.profileCompleteness;
      return score == null || score < 78 || (pct != null && pct < 85);
    },
    text: (ctx, v) => {
      const score = ctx.profile?.cvScore;
      const variants = [
        score != null
          ? `Your CV score is ${Math.round(score)}% — refresh it in the AI editor before your next apply.`
          : 'Polish your CV with the AI editor — better ATS fit means more callbacks.',
        'Small CV upgrades compound. Open the AI editor and tailor one section today.',
        'Recruiters skim fast — use the AI CV editor to sharpen impact bullets this week.',
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'interview_prep',
    kind: 'interview_prep',
    scenario: 'interest_nudge',
    actionUrl: '/lms/interview-prep',
    title: 'Interview prep',
    priority: 58,
    text: (ctx, v) => {
      const role = roleLabel(ctx);
      const variants = [
        `Mock interviews for ${role} — 10 minutes today keeps you sharp for real loops.`,
        `Question banks matched to ${role} are waiting in Interview Prep. Try one set now.`,
        `Stay interview-ready: practice a mock session before recruiters reach out.`,
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'jobs',
    kind: 'job',
    scenario: 'interest_nudge',
    actionUrl: '/explore-jobs',
    title: 'Matched jobs',
    priority: 55,
    text: (_ctx, v) => {
      const variants = [
        'New roles aligned with your profile are live — browse matches and apply today.',
        "Haven't checked jobs lately? Fresh openings match your skills right now.",
        'One strong application beats ten stale ones — explore matched jobs on HRYantra.',
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'events',
    kind: 'event',
    scenario: 'interest_nudge',
    actionUrl: '/community',
    title: 'Events for you',
    priority: 52,
    text: (_ctx, v) => {
      const variants = [
        'Walk-ins, webinars & job posts matched to your profile — see Events in Office Gossips.',
        'Something new in Events for your track — walk-ins and webinars worth a look.',
        'Your profile matches new walk-ins and webinars. Open Events when you have time.',
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'quizzes',
    kind: 'course',
    scenario: 'interest_nudge',
    actionUrl: '/lms/quizzes',
    title: 'Skill quizzes',
    priority: 50,
    text: (_ctx, v) => {
      const variants = [
        'Quick quiz drill — find weak spots and fix them before your next interview.',
        '5-minute quiz today keeps skills fresh. Pick a topic in LMS Quizzes.',
        'Test yourself: quizzes highlight gaps recruiters often probe in screening.',
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'community',
    kind: 'community',
    scenario: 'interest_nudge',
    actionUrl: '/community',
    title: 'Office Gossips',
    priority: 48,
    text: (_ctx, v) => {
      const variants = [
        'See what peers in your circles are discussing — join the conversation in Office Gossips.',
        'Reference checks, company pages & DMs — stay active in your professional network here.',
        'Your community feed has updates. Drop in for gossip, referrals, and insider tips.',
      ];
      return variants[v % variants.length];
    },
  },
  {
    id: 'career_path',
    kind: 'course',
    scenario: 'interest_nudge',
    actionUrl: '/lms/career-path',
    title: 'Career path',
    priority: 46,
    text: (ctx, v) => {
      const role = roleLabel(ctx);
      const variants = [
        `Map your path to ${role} — Career Path bundles courses, quizzes & events for you.`,
        'Not sure what to do next? Career Path lines up your next learning moves.',
        'Stay on track: open Career Path for a guided plan toward your goal role.',
      ];
      return variants[v % variants.length];
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
 * Rotating engagement nudges — one activity every ~30 min (like profile alerts).
 * Priority is adjusted from full behaviour tracking (not only first-open).
 */
export const engagementSuggestionProvider: SuggestionProvider = {
  id: 'engagement',
  run(ctx, state) {
    if (!canPushEngagementBatch(state)) return [];

    const signals = getBehaviourSignalsForSuggestions(ctx.userId);
    const prefer = new Set(signals?.preferSlotIds || []);
    const deprioritize = new Set(signals?.deprioritizeSlotIds || []);

    const eligible = ACTIVITY_POOL.filter((slot) => !slot.when || slot.when(ctx));
    if (!eligible.length) return [];

    // Score: base priority + behaviour boosts; still rotate among high scorers
    const scored = eligible
      .map((slot) => {
        let score = slot.priority;
        if (prefer.has(slot.id)) score += 40;
        if (deprioritize.has(slot.id)) score -= 25;
        // Mild rotation so the same boosted slot isn't always first
        const rot = (state.engagementRotationIndex || 0) % Math.max(eligible.length, 1);
        score += (slot.id.charCodeAt(0) + rot) % 7;
        return { slot, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    if (!top) return [];

    const candidate = buildSlotCandidate(top.slot, ctx, state);
    candidate.priority = top.score;
    candidate.hqMeta = {
      ...candidate.hqMeta,
      behaviourInsightIds: signals?.insightIds || [],
      preferSlotIds: signals?.preferSlotIds || [],
      topCategories: signals?.topCategories || [],
      weakCategories: signals?.weakCategories || [],
      scoredFromBehaviour: true,
    };
    return [candidate];
  },
};

/** Export for tests / HQ dashboards */
export function listEngagementActivityIds(): string[] {
  return ACTIVITY_POOL.map((a) => a.id);
}

export function listCourseCatalogTitles(): string[] {
  return SUGGESTION_COURSE_CATALOG.map((c) => c.title);
}
