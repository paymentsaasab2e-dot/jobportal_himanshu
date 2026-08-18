export type PortalStatusCopy = {
  title: string;
  message: string;
};

export const CONNECTION_STATUS = {
  slow: {
    title: 'This is taking longer than usual',
    message: 'Please wait a moment. We’re still trying to load this for you.',
  },
  failed: {
    title: 'Unable to connect right now',
    message: 'Please try again in a little while. Your work is safe.',
  },
  timeout: {
    title: 'This is taking longer than usual',
    message: 'We couldn’t finish loading in time. Try again in a few minutes.',
  },
  offline: {
    title: 'You’re offline',
    message: 'Check your internet connection, then try again.',
  },
  rateLimit: {
    title: 'Please wait a moment',
    message: 'Try again shortly.',
  },
} as const satisfies Record<string, PortalStatusCopy>;

export const JOB_PORTAL_STATUS = {
  serviceNotFound: {
    title: 'Page not found',
    message: 'This page isn’t available. It may have been moved or the link is no longer valid.',
  },
  courseMissing: {
    title: 'We couldn’t find this',
    message: 'It may have been removed. Go back and choose another course.',
  },
  lessonMissing: {
    title: 'We couldn’t find this',
    message: 'It may have been removed. Go back and choose another lesson.',
  },
  companyResearchMissing: {
    title: 'We couldn’t find this',
    message: 'This company isn’t available yet. Go back and choose another option.',
  },
  plannedItemMissing: {
    title: 'We couldn’t find this',
    message: 'It may have been removed. Go back and choose another option.',
  },
  lmsEventMissing: {
    title: 'We couldn’t find this',
    message: 'This event isn’t available. It may have been removed.',
  },
  publicEventMissing: {
    title: 'We couldn’t find this',
    message: 'This event isn’t available. It may have been removed.',
  },
  noteMissing: {
    title: 'We couldn’t find this',
    message: 'This note isn’t available.',
  },
  interviewSetMissing: {
    title: 'We couldn’t find this',
    message: 'This set isn’t available any more.',
  },
  interviewMissing: {
    title: 'Interview not found',
    message: 'This interview isn’t available, or you don’t have access.',
  },
  applyInvalid: {
    title: 'This job isn’t available',
    message: 'Ask the recruiter for a new link and try again.',
  },
  filtersEmpty: {
    title: 'No results',
    message: 'Try fewer filters or a different search.',
  },
  quizzesEmpty: {
    title: 'No completed quizzes yet',
    message: 'Finish a quiz and it will show up here.',
  },
  lmsFetchFailed: {
    title: 'Unable to connect right now',
    message: 'Please try again in a little while.',
  },
  tokens: {
    title: 'Not enough tokens',
    message: 'You need more tokens to continue. Open Subscriptions to add some.',
  },
  sessionEnded: {
    title: 'Please sign in again',
    message: 'Your session ended. Sign in to continue.',
  },
  signInRequired: {
    title: 'Please sign in',
    message: 'Sign in to continue.',
  },
} as const satisfies Record<string, PortalStatusCopy>;

export type StatusCatalogGroup = {
  heading: string;
  items: Array<{
    id: string;
    trigger: string;
    copy: PortalStatusCopy;
  }>;
};

export const JOB_PORTAL_STATUS_CATALOG: StatusCatalogGroup[] = [
  {
    heading: 'Connection / delay',
    items: [
      { id: 'slow', trigger: 'Request is slow', copy: CONNECTION_STATUS.slow },
      { id: 'failed', trigger: 'Request fails / can’t reach service', copy: CONNECTION_STATUS.failed },
      { id: 'timeout', trigger: 'Timed out', copy: CONNECTION_STATUS.timeout },
      { id: 'offline', trigger: 'Browser offline', copy: CONNECTION_STATUS.offline },
      { id: 'rateLimit', trigger: 'Too many requests', copy: CONNECTION_STATUS.rateLimit },
    ],
  },
  {
    heading: 'Job portal screens',
    items: [
      { id: 'serviceNotFound', trigger: 'Unknown service slug', copy: JOB_PORTAL_STATUS.serviceNotFound },
      { id: 'courseMissing', trigger: 'Bad /lms/courses/[id]', copy: JOB_PORTAL_STATUS.courseMissing },
      { id: 'lessonMissing', trigger: 'Bad lesson id', copy: JOB_PORTAL_STATUS.lessonMissing },
      { id: 'companyResearchMissing', trigger: 'Unknown interview-prep company', copy: JOB_PORTAL_STATUS.companyResearchMissing },
      { id: 'plannedItemMissing', trigger: 'Bad career-path planned id', copy: JOB_PORTAL_STATUS.plannedItemMissing },
      { id: 'lmsEventMissing', trigger: 'Bad /lms/events/[id]', copy: JOB_PORTAL_STATUS.lmsEventMissing },
      { id: 'publicEventMissing', trigger: 'Bad public event id', copy: JOB_PORTAL_STATUS.publicEventMissing },
      { id: 'noteMissing', trigger: 'Bad /lms/notes/[id]', copy: JOB_PORTAL_STATUS.noteMissing },
      { id: 'interviewSetMissing', trigger: 'Bad question-set id', copy: JOB_PORTAL_STATUS.interviewSetMissing },
      { id: 'interviewMissing', trigger: 'Missing interview or no access', copy: JOB_PORTAL_STATUS.interviewMissing },
      { id: 'applyInvalid', trigger: 'Invalid/expired apply token', copy: JOB_PORTAL_STATUS.applyInvalid },
      { id: 'filtersEmpty', trigger: 'Filters match nothing', copy: JOB_PORTAL_STATUS.filtersEmpty },
      { id: 'quizzesEmpty', trigger: 'No completed quizzes', copy: JOB_PORTAL_STATUS.quizzesEmpty },
      { id: 'lmsFetchFailed', trigger: 'LMS API error', copy: JOB_PORTAL_STATUS.lmsFetchFailed },
      { id: 'tokens', trigger: 'Paid LMS/AI action, not enough tokens', copy: JOB_PORTAL_STATUS.tokens },
      { id: 'sessionEnded', trigger: 'Auth gone while saving', copy: JOB_PORTAL_STATUS.sessionEnded },
      { id: 'signInRequired', trigger: 'Apply/save while logged out', copy: JOB_PORTAL_STATUS.signInRequired },
    ],
  },
];

export function formatPortalStatusLine(copy: PortalStatusCopy): string {
  return `${copy.title}. ${copy.message}`;
}

export function connectionCopyFromResponse(status?: number, offline?: boolean): PortalStatusCopy {
  if (offline || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return CONNECTION_STATUS.offline;
  }
  if (status === 429) return CONNECTION_STATUS.rateLimit;
  if (status === 408 || status === 504) return CONNECTION_STATUS.timeout;
  return CONNECTION_STATUS.failed;
}
