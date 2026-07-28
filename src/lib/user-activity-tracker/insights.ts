import { listDateKeysInRange, getUserActivityState } from './store';
import { localDateKey } from './categories';
import type {
  ActivityCategory,
  BehaviourInsight,
  BehaviourSuggestionSignals,
  DayBucket,
  UserActivityRollup,
  UserActivityState,
} from './types';

const ALL_SUGGESTION_CATS: ActivityCategory[] = [
  'jobs',
  'courses',
  'lms',
  'interview_prep',
  'ai_cv',
  'profile',
  'community',
  'events',
  'premium',
];

/** Map activity categories → engagement slot ids */
const CAT_TO_SLOTS: Partial<Record<ActivityCategory, string[]>> = {
  jobs: ['jobs'],
  courses: ['course', 'career_path', 'quizzes'],
  lms: ['course', 'career_path', 'quizzes'],
  interview_prep: ['interview_prep'],
  ai_cv: ['ai_cv'],
  profile: ['profile'],
  community: ['community'],
  events: ['events'],
  premium: ['course'],
  applications: ['jobs'],
};

function sumDays(days: DayBucket[]): {
  logins: number;
  visits: number;
  jobCardClicks: number;
  applies: number;
  activeMs: number;
  sessionCount: number;
  pageVisitsByCategory: Partial<Record<ActivityCategory, number>>;
  activeMsByCategory: Partial<Record<ActivityCategory, number>>;
  firstOpenBreakdown: Partial<Record<ActivityCategory, number>>;
} {
  const pageVisitsByCategory: Partial<Record<ActivityCategory, number>> = {};
  const activeMsByCategory: Partial<Record<ActivityCategory, number>> = {};
  const firstOpenBreakdown: Partial<Record<ActivityCategory, number>> = {};
  let logins = 0;
  let visits = 0;
  let jobCardClicks = 0;
  let applies = 0;
  let activeMs = 0;
  const sessionIdSet = new Set<string>();

  for (const day of days) {
    logins += day.logins;
    visits += day.visits;
    jobCardClicks += day.jobCardClicks;
    applies += day.applies;
    activeMs += day.activeMs;
    for (const [k, v] of Object.entries(day.pageVisitsByCategory || {})) {
      const key = k as ActivityCategory;
      pageVisitsByCategory[key] = (pageVisitsByCategory[key] || 0) + (v || 0);
    }
    for (const [k, v] of Object.entries(day.activeMsByCategory || {})) {
      const key = k as ActivityCategory;
      activeMsByCategory[key] = (activeMsByCategory[key] || 0) + (v || 0);
    }
    if (day.firstOpenCategory) {
      firstOpenBreakdown[day.firstOpenCategory] =
        (firstOpenBreakdown[day.firstOpenCategory] || 0) + 1;
    }
    for (const id of day.sessionIds || []) sessionIdSet.add(id);
  }

  return {
    logins,
    visits,
    jobCardClicks,
    applies,
    activeMs,
    sessionCount: sessionIdSet.size,
    pageVisitsByCategory,
    activeMsByCategory,
    firstOpenBreakdown,
  };
}

function topCategory(
  map: Partial<Record<ActivityCategory, number>>,
): ActivityCategory | undefined {
  let best: ActivityCategory | undefined;
  let bestN = 0;
  for (const [k, v] of Object.entries(map)) {
    if ((v || 0) > bestN) {
      bestN = v || 0;
      best = k as ActivityCategory;
    }
  }
  return best;
}

function rankedCategories(
  visits: Partial<Record<ActivityCategory, number>>,
  time: Partial<Record<ActivityCategory, number>>,
): ActivityCategory[] {
  const score: Partial<Record<ActivityCategory, number>> = {};
  for (const cat of ALL_SUGGESTION_CATS) {
    score[cat] = (visits[cat] || 0) * 10 + Math.round((time[cat] || 0) / 1000);
  }
  return [...ALL_SUGGESTION_CATS].sort(
    (a, b) => (score[b] || 0) - (score[a] || 0),
  );
}

export function buildBehaviourInsights(
  state: UserActivityState,
  rollup: Pick<
    UserActivityRollup,
    | 'jobCardClicks'
    | 'applies'
    | 'pageVisitsByCategory'
    | 'activeMs'
    | 'logins'
    | 'activeMsByCategory'
  >,
): BehaviourInsight[] {
  const insights: BehaviourInsight[] = [];
  const snap = state.profileSnapshot;
  const skills = snap?.skillsCount ?? 0;
  const apps = snap?.applicationsTotal ?? rollup.applies;
  const rejections = snap?.rejectionsTotal ?? 0;
  const cvScore = snap?.cvScore;
  const jobViews =
    rollup.jobCardClicks + (rollup.pageVisitsByCategory.jobs || 0);
  const jobTimeMin = Math.round((rollup.activeMsByCategory?.jobs || 0) / 60000);
  const courseVisits =
    (rollup.pageVisitsByCategory.courses || 0) +
    (rollup.pageVisitsByCategory.lms || 0);
  const courseTimeMin = Math.round(
    ((rollup.activeMsByCategory?.courses || 0) +
      (rollup.activeMsByCategory?.lms || 0)) /
      60000,
  );
  const premiumVisits = rollup.pageVisitsByCategory.premium || 0;

  if (skills >= 5 && apps <= 1 && (jobViews >= 5 || jobTimeMin >= 3)) {
    insights.push({
      id: 'skills_no_apply',
      label: 'Skills but low applications',
      severity: 'action',
      summary:
        'Profile has solid skills and job browsing, but few applications. Nudge to apply.',
      evidence: [
        `${skills} skills on profile`,
        `${jobViews} job views/clicks · ${jobTimeMin}m on jobs`,
        `${apps} applications tracked`,
      ],
    });
  }

  if ((jobViews >= 8 || jobTimeMin >= 5) && rollup.applies <= 1) {
    insights.push({
      id: 'browser_not_applier',
      label: 'Browsing jobs, not applying',
      severity: 'watch',
      summary:
        'High job time/clicks vs applies — hesitation or mismatch on listings.',
      evidence: [
        `${rollup.jobCardClicks} job card clicks · ${jobTimeMin}m on jobs`,
        `${rollup.applies} applies recorded this period`,
      ],
    });
  }

  if (apps >= 5 && rejections >= 3) {
    const cvIssue = cvScore != null && cvScore < 70;
    insights.push({
      id: cvIssue ? 'rejection_cv_issue' : 'rejection_skill_gap',
      label: cvIssue
        ? 'Many rejections — likely CV issue'
        : 'Many rejections — skill / prep gap',
      severity: 'action',
      summary: cvIssue
        ? 'Repeated applications with rejections and a weak CV score. Prioritize AI CV + interview prep.'
        : 'Volume of applications with rejections suggests skill or interview gaps. Suggest courses / prep.',
      evidence: [
        `${apps} applications`,
        `${rejections} rejections`,
        cvScore != null ? `CV score ${Math.round(cvScore)}%` : 'CV score unknown',
      ],
    });
  }

  if (
    (courseVisits >= 6 || courseTimeMin >= 10) &&
    jobViews <= 2 &&
    apps <= 1
  ) {
    insights.push({
      id: 'lms_heavy',
      label: 'Learning-heavy, low job activity',
      severity: 'info',
      summary:
        'Spends time in LMS/courses more than jobs. Good for upskilling; may need job reminders.',
      evidence: [
        `${courseVisits} LMS/course visits · ${courseTimeMin}m learning`,
        `${jobViews} job views`,
      ],
    });
  }

  if (premiumVisits >= 3 && rollup.applies === 0) {
    insights.push({
      id: 'premium_curious',
      label: 'Views premium services',
      severity: 'info',
      summary:
        'Opens premium / subscription surfaces often — sales follow-up candidate.',
      evidence: [`${premiumVisits} premium page visits`],
    });
  }

  if (rollup.logins >= 5 && rollup.activeMs < 5 * 60 * 1000) {
    insights.push({
      id: 'short_sessions',
      label: 'Frequent short visits',
      severity: 'watch',
      summary:
        'Logs in often but stays briefly — engagement is shallow; push one clear next action.',
      evidence: [
        `${rollup.logins} logins/sessions starts`,
        `~${Math.round(rollup.activeMs / 60000)} min active`,
      ],
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'balanced',
      label: 'Balanced activity',
      severity: 'info',
      summary: 'No strong imbalance detected yet — keep collecting signals.',
      evidence: [
        `${rollup.jobCardClicks} job clicks`,
        `${rollup.applies} applies`,
        `${Math.round(rollup.activeMs / 60000)} min active`,
      ],
    });
  }

  return insights;
}

/**
 * Simple behaviour → suggestion preferences (used by engagement provider).
 */
export function getBehaviourSignalsForSuggestions(
  userId: string,
): BehaviourSuggestionSignals | null {
  if (!userId) return null;
  // Use month-range rollup without attaching signals (avoids recursion)
  const rollup = buildUserActivityRollup(userId, 'week', { skipSignals: true });
  if (!rollup) return null;

  const state = getUserActivityState(userId);
  const ranked = rankedCategories(
    rollup.pageVisitsByCategory,
    rollup.activeMsByCategory,
  );
  const topCategories = ranked.slice(0, 3);
  const weakCategories = ranked.slice(-3).reverse();
  const insightIds = rollup.insights
    .filter((i) => i.id !== 'balanced')
    .map((i) => i.id);

  const preferSlotIds: string[] = [];
  const deprioritizeSlotIds: string[] = [];

  if (insightIds.includes('skills_no_apply') || insightIds.includes('browser_not_applier')) {
    preferSlotIds.push('jobs');
  }
  if (insightIds.includes('rejection_cv_issue')) {
    preferSlotIds.push('ai_cv', 'interview_prep');
  }
  if (insightIds.includes('rejection_skill_gap')) {
    preferSlotIds.push('course', 'interview_prep', 'quizzes');
  }
  if (insightIds.includes('lms_heavy')) {
    preferSlotIds.push('jobs');
    deprioritizeSlotIds.push('course', 'career_path', 'quizzes');
  }
  if (insightIds.includes('premium_curious')) {
    preferSlotIds.push('course');
  }

  for (const cat of weakCategories) {
    const slots = CAT_TO_SLOTS[cat] || [];
    for (const s of slots) {
      if (!preferSlotIds.includes(s)) preferSlotIds.push(s);
    }
  }

  for (const cat of topCategories) {
    const slots = CAT_TO_SLOTS[cat] || [];
    for (const s of slots) {
      if (!preferSlotIds.includes(s) && !deprioritizeSlotIds.includes(s)) {
        deprioritizeSlotIds.push(s);
      }
    }
  }

  return {
    userId,
    topCategories,
    weakCategories,
    insightIds,
    jobCardClicks7d: rollup.jobCardClicks,
    applies7d: rollup.applies,
    activeMs7d: rollup.activeMs,
    activeMsByCategory7d: rollup.activeMsByCategory,
    pageVisitsByCategory7d: rollup.pageVisitsByCategory,
    skillsCount: state.profileSnapshot?.skillsCount ?? 0,
    rejectionsTotal: state.profileSnapshot?.rejectionsTotal ?? 0,
    cvScore: state.profileSnapshot?.cvScore ?? null,
    preferSlotIds,
    deprioritizeSlotIds,
  };
}

export function buildUserActivityRollup(
  userId: string,
  range: UserActivityRollup['range'] = 'week',
  options?: { skipSignals?: boolean },
): UserActivityRollup | null {
  if (!userId) return null;
  const state = getUserActivityState(userId);
  const today = localDateKey();

  let fromDate = today;
  if (range === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    fromDate = localDateKey(d);
  } else if (range === 'month') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    fromDate = localDateKey(d);
  } else if (range === 'all') {
    const keys = Object.keys(state.days).sort();
    fromDate = keys[0] || today;
  }

  const keys =
    range === 'all'
      ? Object.keys(state.days).sort()
      : listDateKeysInRange(fromDate, today);
  const days = keys.map((k) => state.days[k]).filter(Boolean) as DayBucket[];
  const summed = sumDays(days);
  const daysActive = days.filter(
    (d) => d.visits > 0 || d.activeMs > 0 || d.jobCardClicks > 0,
  ).length;
  const avgActiveMsPerDay =
    daysActive > 0 ? Math.round(summed.activeMs / daysActive) : 0;

  const rollupBase = {
    ...summed,
    avgActiveMsPerDay,
  };

  const insights = buildBehaviourInsights(state, rollupBase);
  const recentSessions = [...state.sessions].slice(-12).reverse();
  const fromTs = Date.parse(`${fromDate}T00:00:00`);
  const recentEvents = [...(state.events || [])]
    .filter((e) => {
      if (range === 'all') return true;
      return Date.parse(e.at) >= fromTs;
    })
    .slice(-100)
    .reverse();

  const rollup: UserActivityRollup = {
    userId,
    range,
    fromDate,
    toDate: today,
    ...rollupBase,
    daysActive,
    topFirstOpen: topCategory(summed.firstOpenBreakdown),
    insights,
    recentSessions,
    recentEvents,
    profileSnapshot: state.profileSnapshot,
  };

  if (!options?.skipSignals) {
    rollup.behaviourSignals = getBehaviourSignalsForSuggestions(userId);
  }

  return rollup;
}
