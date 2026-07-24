/**
 * Client-side earn-task helpers. Canonical order/hrefs live in backend
 * tokenCatalog EARN_TASK_CATALOG — keep these aligned when adding triggers.
 */

export type EarnLifecycleStatus = 'done' | 'pending';

export type EarnLifecycleTask = {
  id: string;
  name: string;
  description?: string;
  tokens: number;
  category?: string;
  order?: number;
  stage?: string;
  auto?: boolean;
  href?: string;
  status?: EarnLifecycleStatus;
  done?: boolean;
};

const FALLBACK_HREF: Record<string, string> = {
  welcome: '/candidate-dashboard',
  'earn.cv_upload': '/uploadcv',
  'earn.profile.basicInformation':
    '/profile?open=basic-information&tab=personal-details',
  'earn.profile.summary': '/profile?open=summary&tab=personal-details',
  'earn.profile.education': '/profile?open=education&tab=education',
  'earn.profile.skills': '/profile?open=skills&tab=skills',
  'earn.profile.languages': '/profile?open=languages&tab=skills',
  'earn.profile.projects':
    '/profile?open=projects&tab=projects-certifications',
  'earn.profile.careerPreferences':
    '/profile?open=career-preferences&tab=job-preferences',
};

/** Resolve task page for navigation (deep-link into the right modal when possible). */
export function resolveEarnTaskHref(task: {
  id: string;
  href?: string | null;
}): string {
  if (task.href && task.href.startsWith('/')) return task.href;
  return FALLBACK_HREF[task.id] || '/profile';
}

/** Localize path while preserving ?query for profile deep links. */
export function localizeEarnPath(path: string, locale: string): string {
  const qIndex = path.indexOf('?');
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const search = qIndex >= 0 ? path.slice(qIndex) : '';
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const localized =
    normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
  return `${localized}${search}`;
}
