import type { ActivityCategory } from './types';

/** Map pathname → activity category for first-open + visit counts */
export function categorizePath(pathname: string): ActivityCategory {
  const path = (pathname || '/').split('?')[0].toLowerCase();

  if (path.startsWith('/explore-jobs') || path.startsWith('/searchjobs')) return 'jobs';
  if (path.startsWith('/applications')) return 'applications';
  if (path.startsWith('/subscriptions') || path.startsWith('/services')) return 'premium';
  if (path.startsWith('/community') || path.startsWith('/reference-check')) return 'community';
  if (
    path.startsWith('/profile') ||
    path.startsWith('/personal-details') ||
    path.startsWith('/skills') ||
    path.startsWith('/work-exp') ||
    path.startsWith('/edu-details') ||
    path.startsWith('/career-preferences') ||
    path.startsWith('/salary-expectation') ||
    path.startsWith('/completion-profile') ||
    path.startsWith('/uploadcv')
  ) {
    return 'profile';
  }
  if (path.startsWith('/lms/courses') || path.startsWith('/courses')) return 'courses';
  if (
    path.startsWith('/lms/interview-prep') ||
    path.startsWith('/Aimockinter') ||
    path.startsWith('/aimockinter')
  ) {
    return 'interview_prep';
  }
  if (
    path.startsWith('/lms/resume-builder') ||
    path.startsWith('/aicveditor') ||
    path.startsWith('/cveditor') ||
    path.startsWith('/cvscore')
  ) {
    return 'ai_cv';
  }
  if (path.startsWith('/lms/events')) return 'events';
  if (path.startsWith('/lms')) return 'lms';
  if (
    path.startsWith('/candidate-dashboard') ||
    path.startsWith('/candidate-home') ||
    path.startsWith('/candmain')
  ) {
    return 'dashboard';
  }
  return 'other';
}

export function categoryLabel(cat: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    jobs: 'Jobs',
    lms: 'LMS',
    courses: 'Courses',
    premium: 'Premium services',
    community: 'Community',
    profile: 'Profile',
    applications: 'Applications',
    interview_prep: 'Interview prep',
    ai_cv: 'AI CV',
    events: 'Events',
    dashboard: 'Dashboard',
    other: 'Other',
  };
  return labels[cat] || cat;
}

/** Skip auth/marketing noise for "first open" */
export function isMeaningfulPath(pathname: string): boolean {
  const path = (pathname || '/').split('?')[0].toLowerCase();
  if (!path || path === '/') return false;
  if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/whatsapp')) {
    return false;
  }
  if (path.startsWith('/privacypolicy') || path.startsWith('/terms') || path.startsWith('/help')) {
    return false;
  }
  if (path === '/user-stats') return false;
  return true;
}

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
