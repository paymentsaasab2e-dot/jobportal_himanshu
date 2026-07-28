/** Core types for the HRYantra suggestions engine (extensible for HQ + new providers). */

export type SuggestionKind =
  | 'course'
  | 'ai_cv'
  | 'interview_prep'
  | 'job'
  | 'event'
  | 'community'
  | 'sales_followup'
  | 'profile';

export type SuggestionScenario =
  | 'rejection_recovery'
  | 'profile_match'
  | 'interest_nudge'
  | 'engagement';

export type SuggestionCandidate = {
  dedupeKey: string;
  scenario: SuggestionScenario;
  kind: SuggestionKind;
  title: string;
  text: string;
  actionUrl: string;
  priority: number;
  applicationId?: string;
  hqMeta?: Record<string, unknown>;
};

export type SuggestionRecord = {
  id: string;
  dedupeKey: string;
  scenario: SuggestionScenario;
  kind: SuggestionKind;
  title: string;
  actionUrl: string;
  pushedAt: string;
  clickedAt?: string;
  purchasedAt?: string;
  applicationId?: string;
};

export type ProfileSignals = {
  profileText: string;
  skills: string[];
  targetRole?: string;
  cvScore?: number | null;
  profileCompleteness?: number | null;
  email?: string;
  workDomain?: string;
};

export type RejectionEvent = {
  applicationId: string;
  jobTitle: string;
  company: string;
  rejectedAt: string;
  postInterview: boolean;
  previousStatus?: string;
};

export type AppSnapshot = {
  id: string;
  status: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  interviewScheduledAt?: string | null;
};

export type HqSuggestionMetrics = {
  userId: string;
  updatedAt: string;
  totalRejections: number;
  postInterviewRejections: number;
  repeatRejectionCount: number;
  suggestionsPushed: number;
  suggestionsClicked: number;
  suggestionsPurchased: number;
  salesFollowUpScore: number;
  salesFollowUpReady: boolean;
  lastRejection?: RejectionEvent;
  recentSuggestions: SuggestionRecord[];
  salesQueueReason?: string;
  /** Provider-level counters for HQ dashboards */
  byScenario: Partial<Record<SuggestionScenario, number>>;
};

export type SuggestionEngineState = {
  userId: string;
  appSnapshots: Record<string, AppSnapshot>;
  processedRejections: Record<string, RejectionEvent>;
  suggestions: SuggestionRecord[];
  pushedDedupeKeys: Record<string, string>;
  /** Rotates which activity we nudge next (courses, CV, jobs, etc.) */
  engagementRotationIndex?: number;
  /** Last time any engagement nudge was pushed — gates repeat like profile alerts */
  lastEngagementPushAt?: string;
  metrics: {
    totalRejections: number;
    postInterviewRejections: number;
    repeatRejectionCount: number;
    suggestionsPushed: number;
    suggestionsClicked: number;
    suggestionsPurchased: number;
    salesFollowUpScore: number;
    salesFollowUpReady: boolean;
    salesQueueReason?: string;
    byScenario: Partial<Record<SuggestionScenario, number>>;
  };
};

export type SuggestionEngineContext = {
  userId: string;
  applications?: unknown[];
  profile?: ProfileSignals | null;
  missingProfileSections?: Array<{ slug: string; label: string; tabId: string }>;
};

export type SuggestionProvider = {
  id: string;
  run: (ctx: SuggestionEngineContext, state: SuggestionEngineState) => SuggestionCandidate[];
};
