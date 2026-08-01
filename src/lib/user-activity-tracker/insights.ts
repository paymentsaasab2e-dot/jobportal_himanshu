import { listDateKeysInRange, getUserActivityState } from './store';
import { localDateKey } from './categories';
import { buildUserBehaviourSuggestions } from '@/lib/behaviour-user-suggestions';
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

function insightHas(insights: BehaviourInsight[], id: string) {
  return insights.some((i) => i.id === id);
}

function pushTrigger(out: HqBehaviourTrigger[], trigger: HqBehaviourTrigger) {
  if (out.some((t) => t.id === trigger.id)) return;
  out.push(trigger);
}

function buildHqTriggers(input: {
  state: UserActivityState;
  insights: BehaviourInsight[];
  rollup: Pick<
    UserActivityRollup,
    'applies' | 'pageVisitsByCategory' | 'activeMsByCategory' | 'jobCardClicks' | 'logins' | 'activeMs'
  >;
  topCompanies: EntityInterest[];
  topRoles: EntityInterest[];
}): HqBehaviourTrigger[] {
  const { state, insights, rollup, topCompanies, topRoles } = input;
  const out: HqBehaviourTrigger[] = [];
  const snap = state.profileSnapshot;
  const cvScore = snap?.cvScore ?? null;
  const marketFit = snap?.marketFit ?? null;
  const completeness = snap?.profileCompleteness ?? null;
  const missingSections = snap?.missingSectionsCount ?? 0;
  const skills = snap?.skillsCount ?? 0;
  const rejections = snap?.rejectionsTotal ?? 0;
  const postInterviewRejections = snap?.postInterviewRejections ?? 0;
  const apps = snap?.applicationsTotal ?? rollup.applies;
  const premiumVisits = rollup.pageVisitsByCategory.premium || 0;
  const communityVisits = rollup.pageVisitsByCategory.community || 0;
  const interviewVisits = rollup.pageVisitsByCategory.interview_prep || 0;
  const cvVisits = rollup.pageVisitsByCategory.ai_cv || 0;
  const jobsTimeMin = Math.round((rollup.activeMsByCategory.jobs || 0) / 60000);
  const cvTimeMin = Math.round((rollup.activeMsByCategory.ai_cv || 0) / 60000);
  const topCompany = topCompanies[0];
  const topRole = topRoles[0];
  const goodCv = cvScore != null && cvScore >= 70;
  const weakCv = cvScore != null && cvScore < 70;
  const incompleteProfile =
    missingSections >= 2 || (completeness != null && completeness < 75);
  const keywordGapSuspected =
    goodCv &&
    rejections >= 3 &&
    apps >= 4 &&
    (skills <= 4 || incompleteProfile || (marketFit != null && marketFit < 65));

  // --- Single / classic signals ---
  if (premiumVisits >= 3 && rollup.applies === 0) {
    pushTrigger(out, {
      id: 'hq_service_no_purchase',
      flag: 'sales_follow_up',
      title: 'Visited services but did not purchase',
      reason: 'High premium-service curiosity without conversion.',
      evidence: [`${premiumVisits} premium visits in the last 7 days`],
      recommendedAction: 'Sales/HQ can call and explain the most relevant paid service.',
      priority: 90,
      audience: 'hq',
      comboSignals: ['premium_visits', 'no_apply'],
    });
  }

  if (topCompany && topCompany.count >= 4) {
    pushTrigger(out, {
      id: 'hq_company_high_intent',
      flag: 'high_intent',
      title: `Repeated interest in ${topCompany.label}`,
      reason: 'User keeps visiting the same company surface.',
      evidence: [`${topCompany.count} tracked company interactions in the last 7 days`],
      recommendedAction: 'Recommend jobs, reference checks, and interview prep tied to this company.',
      priority: 82,
      audience: 'both',
      comboSignals: ['company_repeat'],
    });
  }

  if (topRole && topRole.count >= 4) {
    pushTrigger(out, {
      id: 'hq_role_research',
      flag: 'career_assist',
      title: `Strong interest in ${topRole.label}`,
      reason: 'User repeatedly explores the same role/position family.',
      evidence: [
        `${topRole.count} tracked role interactions`,
        `${rollup.jobCardClicks} job clicks`,
        `${jobsTimeMin} min on job pages`,
      ],
      recommendedAction: 'Recommend matching jobs, role-aligned courses, and mock interviews.',
      priority: 78,
      audience: 'both',
      comboSignals: ['role_repeat'],
    });
  }

  if (insightHas(insights, 'rejection_cv_issue') && weakCv) {
    pushTrigger(out, {
      id: 'hq_cv_risk',
      flag: 'watch',
      title: 'Repeated rejections with low CV score',
      reason: 'Candidate may need CV optimization support before more applications.',
      evidence: [
        `CV score ${Math.round(cvScore!)}%`,
        `${rejections} rejections`,
      ],
      recommendedAction: 'Push AI CV help first; HQ can offer guided resume services if needed.',
      priority: 85,
      audience: 'both',
      comboSignals: ['rejections', 'weak_cv'],
    });
  }

  // --- Multi-signal combinations ---

  // Good CV + rejections → likely keyword / ATS / JD mismatch (not "bad CV")
  if (keywordGapSuspected || insightHas(insights, 'rejection_keyword_gap')) {
    pushTrigger(out, {
      id: 'hq_keyword_ats_gap',
      flag: 'sales_follow_up',
      title: 'Rejections despite strong CV — keyword / ATS gap likely',
      reason:
        'CV quality looks fine, but applications still fail — missing role keywords, JD tailor, or incomplete profile sections are likely.',
      evidence: [
        cvScore != null ? `CV score ${Math.round(cvScore)}%` : 'CV score unknown',
        `${rejections} rejections · ${apps} applications`,
        skills <= 4 ? `Only ${skills} skills listed` : `${skills} skills listed`,
        incompleteProfile
          ? `${missingSections} missing profile sections · completeness ${completeness ?? '?'}%`
          : `Profile completeness ${completeness ?? '?'}%`,
        marketFit != null ? `Market fit ${Math.round(marketFit)}%` : 'Market fit unknown',
      ],
      recommendedAction:
        'User: open AI CV / job tailor for missing keywords. Sales: offer ATS rewrite or keyword coaching package.',
      priority: 92,
      audience: 'both',
      comboSignals: ['rejections', 'good_cv', 'skills_or_profile_gap'],
    });
  }

  // Survived screen but lost after interview
  if (postInterviewRejections >= 2 && (goodCv || apps >= 4)) {
    pushTrigger(out, {
      id: 'hq_interview_stage_loss',
      flag: 'career_assist',
      title: 'Losing after interview stage',
      reason: 'Candidate clears early filters but fails later — coaching / mock interviews matter more than CV polish.',
      evidence: [
        `${postInterviewRejections} post-interview rejections`,
        cvScore != null ? `CV score ${Math.round(cvScore)}%` : 'CV score unknown',
        `${interviewVisits} interview-prep visits this week`,
      ],
      recommendedAction:
        'User: start mock interview + prep forms. Sales: offer paid interviewer sessions / coaching.',
      priority: 88,
      audience: 'both',
      comboSignals: ['post_interview_rejections', 'good_or_active_apps'],
    });
  }

  // Role research + skill/rejection gap
  if (
    topRole &&
    topRole.count >= 3 &&
    (insightHas(insights, 'rejection_skill_gap') ||
      insightHas(insights, 'rejection_keyword_gap') ||
      (rejections >= 2 && skills <= 5))
  ) {
    pushTrigger(out, {
      id: 'hq_role_skill_mismatch',
      flag: 'career_assist',
      title: `Role focus on ${topRole.label} with skill / keyword gap`,
      reason: 'User keeps researching one role family but signals suggest they are not shortlist-ready yet.',
      evidence: [
        `${topRole.count} interactions on ${topRole.label}`,
        `${rejections} rejections`,
        `${skills} skills on profile`,
      ],
      recommendedAction:
        'Suggest role quizzes, targeted courses, and CV keyword write-ups for that role. Sales can bundle LMS + CV.',
      priority: 84,
      audience: 'both',
      comboSignals: ['role_repeat', 'rejections', 'low_skills'],
    });
  }

  // Company intent + community research + no apply → high-intent sales / reference product
  if (
    topCompany &&
    topCompany.count >= 3 &&
    communityVisits >= 3 &&
    rollup.applies <= 1
  ) {
    pushTrigger(out, {
      id: 'hq_company_research_no_apply',
      flag: 'high_intent',
      title: `Researching ${topCompany.label} without applying`,
      reason: 'Strong company curiosity via community/reference surfaces, but conversion to apply is low.',
      evidence: [
        `${topCompany.count} company interactions`,
        `${communityVisits} community/reference visits`,
        `${rollup.applies} applies this period`,
      ],
      recommendedAction:
        'User: open matching jobs + reference check for that company. Sales: offer company intel / referral package.',
      priority: 86,
      audience: 'both',
      comboSignals: ['company_repeat', 'community', 'low_apply'],
    });
  }

  // Premium curious + high company or role intent → warmer sales lead
  if (
    premiumVisits >= 2 &&
    ((topCompany?.count || 0) >= 3 || (topRole?.count || 0) >= 3)
  ) {
    pushTrigger(out, {
      id: 'hq_premium_plus_intent',
      flag: 'sales_follow_up',
      title: 'Premium curiosity + focused company/role intent',
      reason: 'User is both window-shopping paid services and deeply researching a target — strong sales combo.',
      evidence: [
        `${premiumVisits} premium visits`,
        topCompany ? `${topCompany.label} ×${topCompany.count}` : 'no top company',
        topRole ? `${topRole.label} ×${topRole.count}` : 'no top role',
      ],
      recommendedAction:
        'HQ call with a package tied to their top company/role (CV + interview + reference).',
      priority: 93,
      audience: 'hq',
      comboSignals: ['premium_visits', 'entity_intent'],
    });
  }

  // Editing CV a lot + still not applying
  if (insightHas(insights, 'cv_edit_hesitation') || (cvTimeMin >= 6 && rollup.applies <= 1)) {
    pushTrigger(out, {
      id: 'hq_cv_hesitation',
      flag: 'user_nudge',
      title: 'Polishing CV but hesitating to apply',
      reason: 'Time in CV tools is high while applications stay low — needs one clear apply path.',
      evidence: [`${cvTimeMin}m in CV tools`, `${cvVisits} AI CV visits`, `${rollup.applies} applies`],
      recommendedAction: 'In-app nudge: pick one tailored job and apply today; optional sales assist for rewrite.',
      priority: 74,
      audience: 'both',
      comboSignals: ['ai_cv_time', 'low_apply'],
    });
  }

  // Incomplete profile + active job browsing
  if (incompleteProfile && (rollup.jobCardClicks >= 5 || jobsTimeMin >= 4)) {
    pushTrigger(out, {
      id: 'hq_profile_incomplete_job_hunter',
      flag: 'user_nudge',
      title: 'Job hunting with incomplete profile',
      reason: 'Browsing/applying interest is high but profile gaps reduce match and ATS pass rate.',
      evidence: [
        `${missingSections} missing sections`,
        completeness != null ? `Completeness ${Math.round(completeness)}%` : 'Completeness unknown',
        `${rollup.jobCardClicks} job clicks · ${jobsTimeMin}m on jobs`,
      ],
      recommendedAction: 'User: finish missing profile sections. Sales: guided profile completion service.',
      priority: 80,
      audience: 'both',
      comboSignals: ['missing_sections', 'job_activity'],
    });
  }

  // Browser not applier + skills present → conversion assist
  if (
    (insightHas(insights, 'browser_not_applier') || insightHas(insights, 'skills_no_apply')) &&
    skills >= 3
  ) {
    pushTrigger(out, {
      id: 'hq_ready_but_not_applying',
      flag: 'career_assist',
      title: 'Profile looks ready but user is not applying',
      reason: 'Skills and browsing exist; friction is likely confidence, fit, or process — not empty profile.',
      evidence: [
        `${skills} skills`,
        `${rollup.jobCardClicks} job clicks`,
        `${rollup.applies} applies`,
      ],
      recommendedAction: 'Nudge one-click apply + interview prep; sales can offer application coaching.',
      priority: 76,
      audience: 'both',
      comboSignals: ['skills', 'browse_heavy', 'low_apply'],
    });
  }

  // Short sessions + premium = nurture, don't hard-sell
  if (insightHas(insights, 'short_sessions') && premiumVisits >= 2) {
    pushTrigger(out, {
      id: 'hq_shallow_premium_browse',
      flag: 'sales_follow_up',
      title: 'Short visits on premium surfaces',
      reason: 'Frequent but shallow sessions on paid surfaces — nurture with a concise offer, not a long pitch.',
      evidence: [
        `${rollup.logins} logins`,
        `~${Math.round(rollup.activeMs / 60000)} min active`,
        `${premiumVisits} premium visits`,
      ],
      recommendedAction: 'HQ: short WhatsApp/call with one clear package. In-app: one sticky CTA.',
      priority: 70,
      audience: 'hq',
      comboSignals: ['short_sessions', 'premium_visits'],
    });
  }

  // Learning-heavy + role intent → convert learning to jobs
  if (insightHas(insights, 'lms_heavy') && topRole && topRole.count >= 2) {
    pushTrigger(out, {
      id: 'hq_learn_then_target_role',
      flag: 'user_nudge',
      title: `Learning path can convert into ${topRole.label} applications`,
      reason: 'User is investing in LMS while also eyeing a role — bridge courses to concrete applications.',
      evidence: [`LMS/course heavy insight`, `${topRole.label} ×${topRole.count}`],
      recommendedAction: 'Suggest jobs matching that role + a quiz checkpoint; sales can offer career-path bundle.',
      priority: 72,
      audience: 'both',
      comboSignals: ['lms_heavy', 'role_repeat'],
    });
  }

  // Low market fit + active applications
  if (marketFit != null && marketFit < 55 && (apps >= 3 || rollup.jobCardClicks >= 6)) {
    pushTrigger(out, {
      id: 'hq_low_market_fit',
      flag: 'career_assist',
      title: 'Low market fit while actively job hunting',
      reason: 'Market-fit score is weak relative to activity — skills/keywords/role target may be off.',
      evidence: [
        `Market fit ${Math.round(marketFit)}%`,
        `${apps} applications`,
        `${rollup.jobCardClicks} job clicks`,
      ],
      recommendedAction: 'User: CV gap coach + role quizzes. Sales: market-fit consultation.',
      priority: 81,
      audience: 'both',
      comboSignals: ['low_market_fit', 'job_activity'],
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
    const keywordGap =
      !cvIssue &&
      cvScore != null &&
      cvScore >= 70 &&
      (skills <= 4 ||
        (snap?.missingSectionsCount || 0) >= 2 ||
        (snap?.profileCompleteness != null && snap.profileCompleteness < 75) ||
        (snap?.marketFit != null && snap.marketFit < 65));

    if (keywordGap) {
      insights.push({
        id: 'rejection_keyword_gap',
        label: 'Rejections with strong CV — keyword / profile gaps',
        severity: 'action',
        summary:
          'CV score is healthy but applications still fail. Likely missing JD keywords, thin skills list, or incomplete profile sections.',
        evidence: [
          `${apps} applications`,
          `${rejections} rejections`,
          `CV score ${Math.round(cvScore!)}%`,
          `${skills} skills · ${snap?.missingSectionsCount || 0} missing sections`,
        ],
      });
    } else {
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
  }

  if ((snap?.postInterviewRejections || 0) >= 2) {
    insights.push({
      id: 'post_interview_drop',
      label: 'Drop-offs after interview',
      severity: 'action',
      summary:
        'Multiple post-interview rejections — prioritize mock interviews and coaching over more applications.',
      evidence: [
        `${snap?.postInterviewRejections || 0} post-interview rejections`,
        `${apps} applications total`,
      ],
    });
  }

  if (
    ((snap?.missingSectionsCount || 0) >= 2 ||
      (snap?.profileCompleteness != null && snap.profileCompleteness < 70)) &&
    (jobViews >= 4 || apps >= 2)
  ) {
    insights.push({
      id: 'incomplete_profile_active',
      label: 'Active on jobs with incomplete profile',
      severity: 'watch',
      summary: 'Profile gaps will hurt match scores and ATS — finish sections before more applies.',
      evidence: [
        `${snap?.missingSectionsCount || 0} missing sections`,
        snap?.profileCompleteness != null
          ? `Completeness ${Math.round(snap.profileCompleteness)}%`
          : 'Completeness unknown',
        `${jobViews} job views`,
      ],
    });
  }

  if (snap?.marketFit != null && snap.marketFit < 55 && (jobViews >= 5 || apps >= 3)) {
    insights.push({
      id: 'low_market_fit_active',
      label: 'Low market fit while job hunting',
      severity: 'watch',
      summary: 'Market-fit score is weak relative to activity — retarget skills/keywords to the role.',
      evidence: [`Market fit ${Math.round(snap.marketFit)}%`, `${jobViews} job views`, `${apps} apps`],
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
  if (insightIds.includes('rejection_keyword_gap')) {
    preferSlotIds.push('ai_cv', 'jobs', 'profile');
  }
  if (insightIds.includes('post_interview_drop')) {
    preferSlotIds.push('interview_prep');
  }
  if (insightIds.includes('incomplete_profile_active')) {
    preferSlotIds.push('profile', 'ai_cv');
  }
  if (insightIds.includes('low_market_fit_active')) {
    preferSlotIds.push('ai_cv', 'course', 'quizzes', 'jobs');
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

  // Combo trigger → suggestion slots + clear user task hints
  const behaviourTasks = buildUserBehaviourSuggestions(
    {
      hqTriggers,
      topRoles,
      topCompanies,
      cvScore: state.profileSnapshot?.cvScore ?? null,
      marketFit: state.profileSnapshot?.marketFit ?? null,
      jobCardClicks7d: rollup.jobCardClicks,
      applies7d: rollup.applies,
      pageVisitsByCategory7d: rollup.pageVisitsByCategory,
    },
    { userId },
  );
  for (const task of behaviourTasks) {
    preferSlotIds.push(task.slotId);
    if (task.triggerId === 'hq_keyword_ats_gap') preferSlotIds.push('ai_cv', 'jobs', 'profile');
    if (task.triggerId === 'hq_role_skill_mismatch') {
      preferSlotIds.push('course', 'quizzes', 'ai_cv', 'interview_prep');
    }
    if (task.triggerId === 'hq_company_research_no_apply') {
      preferSlotIds.push('jobs', 'community', 'events');
    }
    if (task.triggerId === 'hq_profile_incomplete_job_hunter') preferSlotIds.push('profile', 'ai_cv');
    if (task.triggerId === 'hq_cv_hesitation') preferSlotIds.push('jobs', 'ai_cv');
    if (task.triggerId === 'hq_low_market_fit') preferSlotIds.push('course', 'quizzes', 'ai_cv');
    if (task.triggerId === 'hq_learn_then_target_role') preferSlotIds.push('jobs', 'quizzes');
    if (task.kind === 'course' || task.kind === 'sales_followup') {
      preferSlotIds.push('course');
    }
  }
  const userSuggestionHints = behaviourTasks.slice(0, 5).map((s) => `${s.title} — ${s.text}`);

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
    marketFit: state.profileSnapshot?.marketFit ?? null,
    missingSectionsCount: state.profileSnapshot?.missingSectionsCount ?? 0,
    topCompanies,
    topRoles,
    hqTriggers,
    preferSlotIds: [...new Set(preferSlotIds)],
    deprioritizeSlotIds: [...new Set(deprioritizeSlotIds)].filter(
      (id) => !new Set(preferSlotIds).has(id),
    ),
    userSuggestionHints: [...new Set(userSuggestionHints)].slice(0, 5),
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
    rollup.behaviourSignals = getBehaviourSignalsForSuggestions(userId) || undefined;
  }

  return rollup;
}
