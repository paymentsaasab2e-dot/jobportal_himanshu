/** Per-user behaviour tracking — local for now, HQ later via saasa:hq-user-activity */

export type ActivityCategory =
  | 'jobs'
  | 'lms'
  | 'courses'
  | 'premium'
  | 'community'
  | 'profile'
  | 'applications'
  | 'interview_prep'
  | 'ai_cv'
  | 'events'
  | 'dashboard'
  | 'other';

export type ActivityEventType =
  | 'login'
  | 'page_visit'
  | 'job_card_click'
  | 'apply'
  | 'time_slice'
  | 'session_end';

/** One row in the complete activity timeline (not only first-open). */
export type ActivityEvent = {
  id: string;
  at: string;
  type: ActivityEventType;
  category: ActivityCategory;
  path?: string;
  sessionId?: string;
  /** Extra: jobId, durationMs, etc. */
  meta?: Record<string, unknown>;
};

export type DayBucket = {
  date: string; // YYYY-MM-DD local
  logins: number;
  visits: number;
  jobCardClicks: number;
  applies: number;
  pageVisitsByCategory: Partial<Record<ActivityCategory, number>>;
  /** Time spent per area (ms) — full day, not only first open */
  activeMsByCategory: Partial<Record<ActivityCategory, number>>;
  /** First meaningful surface opened that calendar day */
  firstOpenCategory?: ActivityCategory;
  firstOpenPath?: string;
  firstOpenAt?: string;
  activeMs: number;
  sessionIds: string[];
};

export type ActivitySession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  lastActiveAt: string;
  durationMs: number;
  pageCount: number;
  firstPath?: string;
  lastPath?: string;
  lastCategory?: ActivityCategory;
  paths: string[];
};

export type ProfileActivitySnapshot = {
  skillsCount: number;
  profileCompleteness: number | null;
  cvScore: number | null;
  applicationsTotal: number;
  rejectionsTotal: number;
  postInterviewRejections: number;
  updatedAt: string;
};

export type BehaviourInsight = {
  id: string;
  label: string;
  severity: 'info' | 'watch' | 'action';
  summary: string;
  evidence: string[];
};

export type EntityInterest = {
  key: string;
  label: string;
  count: number;
  activeMs?: number;
};

export type HqBehaviourTrigger = {
  id: string;
  flag: 'watch' | 'sales_follow_up' | 'career_assist' | 'high_intent';
  title: string;
  reason: string;
  evidence: string[];
  recommendedAction: string;
  priority: number;
};

/**
 * Compact signals for the suggestions engine — change nudges by behaviour.
 */
export type BehaviourSuggestionSignals = {
  userId: string;
  topCategories: ActivityCategory[];
  weakCategories: ActivityCategory[];
  /** Insight ids driving suggestion priority, e.g. skills_no_apply */
  insightIds: string[];
  jobCardClicks7d: number;
  applies7d: number;
  activeMs7d: number;
  activeMsByCategory7d: Partial<Record<ActivityCategory, number>>;
  pageVisitsByCategory7d: Partial<Record<ActivityCategory, number>>;
  skillsCount: number;
  rejectionsTotal: number;
  cvScore: number | null;
  topCompanies: EntityInterest[];
  topRoles: EntityInterest[];
  hqTriggers: HqBehaviourTrigger[];
  /** Prefer these engagement slot ids next */
  preferSlotIds: string[];
  /** Soft-deprioritize these (user already heavy here) */
  deprioritizeSlotIds: string[];
};

export type UserActivityState = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  totals: {
    logins: number;
    visits: number;
    jobCardClicks: number;
    applies: number;
    activeMs: number;
    sessions: number;
    pageVisitsByCategory: Partial<Record<ActivityCategory, number>>;
    activeMsByCategory: Partial<Record<ActivityCategory, number>>;
  };
  days: Record<string, DayBucket>;
  sessions: ActivitySession[];
  currentSessionId?: string;
  /** Last path/category for attributing time heartbeats */
  lastPath?: string;
  lastCategory?: ActivityCategory;
  profileSnapshot?: ProfileActivitySnapshot;
  firstOpens: Array<{
    date: string;
    category: ActivityCategory;
    path: string;
    at: string;
  }>;
  /** Complete chronological activity log */
  events: ActivityEvent[];
};

export type UserActivityRollup = {
  userId: string;
  range: 'today' | 'week' | 'month' | 'all';
  fromDate: string;
  toDate: string;
  logins: number;
  visits: number;
  jobCardClicks: number;
  applies: number;
  activeMs: number;
  avgActiveMsPerDay: number;
  sessionCount: number;
  pageVisitsByCategory: Partial<Record<ActivityCategory, number>>;
  activeMsByCategory: Partial<Record<ActivityCategory, number>>;
  firstOpenBreakdown: Partial<Record<ActivityCategory, number>>;
  topFirstOpen?: ActivityCategory;
  daysActive: number;
  insights: BehaviourInsight[];
  recentSessions: ActivitySession[];
  recentEvents: ActivityEvent[];
  topCompanies: EntityInterest[];
  topRoles: EntityInterest[];
  hqTriggers: HqBehaviourTrigger[];
  profileSnapshot?: ProfileActivitySnapshot;
  behaviourSignals?: BehaviourSuggestionSignals;
};
