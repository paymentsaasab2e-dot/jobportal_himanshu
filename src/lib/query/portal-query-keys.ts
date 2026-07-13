export const portalQueryKeys = {
  all: ['portal'] as const,
  cvDashboard: (candidateId: string) =>
    [...portalQueryKeys.all, 'cv-dashboard', candidateId] as const,
  applications: (candidateId: string) =>
    [...portalQueryKeys.all, 'applications', candidateId] as const,
  applicationDetail: (applicationId: string) =>
    [...portalQueryKeys.all, 'application-detail', applicationId] as const,
  jobsList: (locale: string, limit: number) =>
    [...portalQueryKeys.all, 'jobs', locale, limit] as const,
  personalizedJobs: (candidateId: string, locale: string) =>
    [...portalQueryKeys.all, 'jobs-personalized', candidateId, locale] as const,
};
