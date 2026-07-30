import { listDateKeysInRange, getUserActivityState } from './store';
import { localDateKey } from './categories';
import type {
  ActivityCategory,
  BehaviourInsight,
  BehaviourSuggestionSignals,
  DayBucket,
  EntityInterest,
  HqBehaviourTrigger,
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

function topEntities(
  scoreMap: Record<string, { label: string; count: number; activeMs: number }>,
  limit = 5,
): EntityInterest[] {
  return Object.entries(scoreMap)
    .map(([key, row]) => ({
      key,
      label: row.label,
      count: row.count,
      activeMs: row.activeMs,
    }))
    .sort((a, b) => (b.count * 10 + (b.activeMs || 0) / 1000) - (a.count * 10 + (a.activeMs || 0) / 1000))
    .slice(0, limit);
}

function aggregateEntityInterest(state: UserActivityState, fromTs: number) {
  const companyMap: Record<string, { label: string; count: number; activeMs: number }> = {};
  const roleMap: Record<string, { label: string; count: number; activeMs: number }> = {};
  for (const ev of state.events || []) {
    if (Date.parse(ev.at) < fromTs) continue;
    const meta = (ev.meta || {}) as Record<string, unknown>;
    const companyKey = String(meta.companyId || meta.companyName || '').trim();
    const companyLabel = String(meta.companyName || meta.companyId || '').trim();
    const roleKey = String(meta.roleKey || meta.jobTitle || '').trim().toLowerCase();
    const roleLabel = String(meta.jobTitle || meta.roleKey || '').trim();
    const durationMs = Number(meta.durationMs || 0) || 0;
    if (companyKey) {
      companyMap[companyKey] ||= { label: companyLabel || companyKey, count: 0, activeMs: 0 };
      companyMap[companyKey].count += 1;
      companyMap[companyKey].activeMs += durationMs;
    }
    if (roleKey) {
      roleMap[roleKey] ||= { label: roleLabel || roleKey, count: 0, activeMs: 0 };
      roleMap[roleKey].count += 1;
      roleMap[roleKey].activeMs += durationMs;
    }
  }
  return {
    topCompanies: topEntities(companyMap),
    topRoles: topEntities(roleMap),
  };
}

function buildHqTriggers(input: {
  state: UserActivityState;
  insights: BehaviourInsight[];
  rollup: Pick<UserActivityRollup, 'applies' | 'pageVisitsByCategory' | 'activeMsByCategory' | 'jobCardClicks'>;
  topCompanies: EntityInterest[];
  topRoles: EntityInterest[];
}): HqBehaviourTrigger[] {
  const { state, insights, rollup, topCompanies, topRoles } = input;
  const out: HqBehaviourTrigger[] = [];
  const cvScore = state.profileSnapshot?.cvScore ?? null;
  const premiumVisits = rollup.pageVisitsByCategory.premium || 0;
  const jobsTimeMin = Math.round((rollup.activeMsByCategory.jobs || 0) / 60000);
  const topCompany = topCompanies[0];
  const topRole = topRoles[0];

  if (premiumVisits >= 3 && rollup.applies === 0) {
    out.push({
      id: 'hq_service_no_purchase',
      flag: 'sales_follow_up',
      title: 'Visited services but did not purchase',
      reason: 'High premium-service curiosity without conversion.',
      evidence: [`${premiumVisits} premium visits in the last 7 days`],
      recommendedAction: 'Sales/HQ can call and explain the most relevant paid service.',
      priority: 90,
    });
  }

  if (topCompany && topCompany.count >= 4) {
    out.push({
      id: 'hq_company_high_intent',
      flag: 'high_intent',
      title: `Repeated interest in ${topCompany.label}`,
      reason: 'User keeps visiting the same company surface.',
      evidence: [`${topCompany.count} tracked company interactions in the last 7 days`],
      recommendedAction: 'Recommend jobs, reference checks, and interview prep tied to this company.',
      priority: 82,
    });
  }

  if (topRole && topRole.count >= 4) {
    out.push({
      id: 'hq_role_research',
      flag: 'career_assist',
      title: `Strong interest in ${topRole.label}`,
      reason: 'User repeatedly explores the same role/position family.',
      evidence: [`${topRole.count} tracked role interactions`, `${rollup.jobCardClicks} job clicks`, `${jobsTimeMin} min on job pages`],
      recommendedAction: 'Recommend matching jobs, role-aligned courses, and mock interviews.',
      priority: 78,
    });
  }

  if (insights.some((i) => i.id === 'rejection_cv_issue') && cvScore != null && cvScore < 70) {
    out.push({
      id: 'hq_cv_risk',
      flag: 'watch',
      title: 'Repeated rejections with low CV score',
      reason: 'Candidate may need CV optimization support before more applications.',
      evidence: [`CV score ${Math.round(cvScore)}%`, `${state.profileSnapshot?.rejectionsTotal || 0} rejections`],
      recommendedAction: 'Push AI CV help first; HQ can offer guided resume services if needed.',
      priority: 85,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
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
  const communityVisits = rollup.pageVisitsByCategory.community || 0;
  const cvTimeMin = Math.round((rollup.activeMsByCategory?.ai_cv || 0) / 60000);

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

  if (cvTimeMin >= 6 && jobViews >= 4 && rollup.applies <= 1) {
    insights.push({
      id: 'cv_edit_hesitation',
      label: 'Editing CV but not applying',
      severity: 'watch',
      summary: 'The user keeps refining the CV and researching jobs, but is still hesitating to apply.',
      evidence: [
        `${cvTimeMin}m in CV tools`,
        `${jobViews} job views/clicks`,
        `${rollup.applies} applies recorded this period`,
      ],
    });
  }

  if (communityVisits >= 5 && jobViews <= 2 && apps <= 1) {
    insights.push({
      id: 'community_research_mode',
      label: 'Researching in Office Gossips',
      severity: 'info',
      summary: 'The user spends time in company/community surfaces and may benefit from company-aligned nudges.',
      evidence: [
        `${communityVisits} community/reference-check visits`,
        `${jobViews} job views`,
      ],
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
  if (insightIds.includes('cv_edit_hesitation')) {
    preferSlotIds.push('jobs', 'ai_cv');
  }
  if (insightIds.includes('community_research_mode')) {
    preferSlotIds.push('community', 'jobs', 'events');
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

  const fromTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const { topCompanies, topRoles } = aggregateEntityInterest(state, fromTs);
  const hqTriggers = buildHqTriggers({
    state,
    insights: rollup.insights,
    rollup,
    topCompanies,
    topRoles,
  });

  if ((topCompanies[0]?.count || 0) >= 4) {
    preferSlotIds.push('community', 'events', 'jobs');
  }
  if ((topRoles[0]?.count || 0) >= 4) {
    preferSlotIds.push('jobs', 'course', 'interview_prep', 'quizzes');
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
    topCompanies,
    topRoles,
    hqTriggers,
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
  const { topCompanies, topRoles } = aggregateEntityInterest(state, fromTs);

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
    topCompanies,
    topRoles,
    hqTriggers: buildHqTriggers({
      state,
      insights,
      rollup: rollupBase,
      topCompanies,
      topRoles,
    }),
    profileSnapshot: state.profileSnapshot,
  };

  if (!options?.skipSignals) {
    rollup.behaviourSignals = getBehaviourSignalsForSuggestions(userId);
  }

  return rollup;
}
