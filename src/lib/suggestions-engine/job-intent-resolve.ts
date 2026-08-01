/**
 * Soft job intent for HRYantra suggestions:
 * - If the researched company has openings → deep-link to those jobs
 * - If not → similar roles / companies / courses (never a bare /explore-jobs)
 */

import { DEFAULT_LOCALE } from '@/lib/i18n';
import {
  fetchPortalJobsList,
  fetchPortalPersonalizedJobs,
} from '@/lib/query/portal-api';
import { loadCommunityState } from '@/lib/community-store';
import { pickCoursesForText } from '@/lib/suggestions-engine/catalog';
import type { UserBehaviourSuggestion } from '@/lib/behaviour-user-suggestions';

export type SuggestionJobHit = {
  id: string;
  title: string;
  company: string;
};

type JobsCache = {
  at: number;
  jobs: SuggestionJobHit[];
};

const CACHE_TTL_MS = 5 * 60_000;
let jobsCache: JobsCache | null = null;

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
}

function normalizeJob(raw: unknown): SuggestionJobHit | null {
  const j = asRecord(raw);
  const id = asString(j.id || j._id || j.jobId);
  if (!id) return null;
  const title = asString(j.title || j.jobTitle) || 'Open role';
  const company =
    asString(j.companyName || j.company || asRecord(j.employer).name) || 'Company';
  return { id, title, company };
}

function brandToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z]{2,}$/i, '')
    .replace(/[^a-z0-9]+/g, '');
}

/** Warm / refresh local jobs index (best-effort, called from SuggestionsEngineHost). */
export async function warmSuggestionJobsCache(candidateId?: string | null): Promise<SuggestionJobHit[]> {
  if (typeof window === 'undefined') return jobsCache?.jobs || [];
  if (jobsCache && Date.now() - jobsCache.at < CACHE_TTL_MS) {
    return jobsCache.jobs;
  }
  try {
    let raw: unknown[] = [];
    if (candidateId) {
      raw = await fetchPortalPersonalizedJobs(candidateId, DEFAULT_LOCALE).catch(() => []);
    }
    if (!raw.length) {
      raw = await fetchPortalJobsList(DEFAULT_LOCALE, 80).catch(() => []);
    }
    const jobs = raw.map(normalizeJob).filter(Boolean) as SuggestionJobHit[];
    jobsCache = { at: Date.now(), jobs };
    return jobs;
  } catch {
    return jobsCache?.jobs || [];
  }
}

export function getCachedSuggestionJobs(): SuggestionJobHit[] {
  return jobsCache?.jobs || [];
}

export function findJobsForCompany(companyName: string, jobs = getCachedSuggestionJobs()): SuggestionJobHit[] {
  const needle = brandToken(companyName);
  if (!needle || needle.length < 2) return [];
  return jobs.filter((j) => {
    const co = brandToken(j.company);
    return co === needle || co.includes(needle) || needle.includes(co);
  });
}

function findJobsForRole(role: string, jobs = getCachedSuggestionJobs()): SuggestionJobHit[] {
  const tokens = role
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2);
  if (!tokens.length) return [];
  return jobs
    .map((j) => {
      const hay = `${j.title} ${j.company}`.toLowerCase();
      const hits = tokens.filter((t) => hay.includes(t)).length;
      return { j, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((x) => x.j);
}

function findOgCompanyPage(companyName: string) {
  try {
    const needle = brandToken(companyName);
    if (!needle) return null;
    return (
      loadCommunityState().companyPages.find((p) => {
        const n = brandToken(p.name);
        const d = brandToken(p.domainKey);
        return n === needle || n.includes(needle) || needle.includes(n) || d.includes(needle);
      }) || null
    );
  } catch {
    return null;
  }
}

function exploreJobsUrl(opts: { q?: string; jobId?: string; company?: string }) {
  const sp = new URLSearchParams();
  if (opts.q) sp.set('q', opts.q);
  if (opts.jobId) sp.set('job', opts.jobId);
  if (opts.company) sp.set('company', opts.company);
  const qs = sp.toString();
  return qs ? `/explore-jobs?${qs}` : '/explore-jobs';
}

export type CompanyIntentCtx = {
  userId?: string;
  topCompany?: string;
  topRole?: string;
  otherCompanies?: string[];
  marketFit?: number | null;
  cvScore?: number | null;
  jobCardClicks?: number;
  jobVisits?: number;
  applies?: number;
  topRoleCount?: number;
  topCompanyCount?: number;
  premiumVisits?: number;
  totalVisits?: number;
};

/** Low match + real browsing history (not a first peek). */
export function shouldPrepareBeforeApply(ctx: CompanyIntentCtx): boolean {
  const fit = ctx.marketFit;
  const cv = ctx.cvScore;
  const lowMatch =
    (fit != null && fit < 55) ||
    (cv != null && cv < 65) ||
    (fit != null && cv != null && fit < 62 && cv < 72);

  if (!lowMatch) return false;

  const repeatedInterest =
    (ctx.jobCardClicks || 0) >= 4 ||
    (ctx.jobVisits || 0) >= 3 ||
    (ctx.topRoleCount || 0) >= 3 ||
    (ctx.topCompanyCount || 0) >= 3;

  // Avoid firing on a cold first visit — need some session footprint
  const notFirstTouch = (ctx.totalVisits || 0) >= 3 || (ctx.jobCardClicks || 0) >= 3;

  return repeatedInterest && notFirstTouch;
}

function pickPremiumServiceHref(ctx: CompanyIntentCtx): string {
  const hay = `${ctx.topRole || ''} ${ctx.topCompany || ''}`.toLowerCase();
  if (hay.includes('interview') || (ctx.cvScore != null && ctx.cvScore >= 70 && (ctx.marketFit ?? 100) < 50)) {
    return '/services/mock-interview';
  }
  if ((ctx.cvScore != null && ctx.cvScore < 65) || hay.includes('resume') || hay.includes('cv')) {
    return '/services/ai-resume-review';
  }
  return '/services';
}

function pivotApplyToPrep(
  base: UserBehaviourSuggestion,
  ctx: CompanyIntentCtx,
  jobHint?: { title: string; company: string; id?: string },
): UserBehaviourSuggestion {
  const role = ctx.topRole?.trim();
  const company = jobHint?.company || ctx.topCompany?.trim() || 'this company';
  const jobTitle = jobHint?.title;
  const hay = `${role || ''} ${jobTitle || ''} ${company}`.trim();
  const course = pickCoursesForText(hay || 'career job skills interview', 1)[0];
  const veryLow =
    (ctx.marketFit != null && ctx.marketFit < 45) ||
    (ctx.cvScore != null && ctx.cvScore < 55);
  const preferPremium = veryLow || (ctx.premiumVisits || 0) >= 1;
  const scoreBits = [
    ctx.marketFit != null ? `market fit ~${Math.round(ctx.marketFit)}%` : null,
    ctx.cvScore != null ? `CV ~${Math.round(ctx.cvScore)}%` : null,
  ]
    .filter(Boolean)
    .join(', ');

  if (preferPremium) {
    const href = pickPremiumServiceHref(ctx);
    return {
      ...base,
      triggerId: base.triggerId,
      slotId: 'course',
      kind: 'sales_followup',
      title: jobTitle
        ? `Prepare for “${jobTitle}” before you apply`
        : role
          ? `Prepare for ${role} before you apply`
          : 'Prepare before you apply',
      text: [
        scoreBits
          ? `You’ve been looking at ${company} roles, but your scores look low (${scoreBits}).`
          : `You’ve been looking at ${company} roles, but your match looks low right now.`,
        course
          ? `Start “${course.title}” or open a guided premium service to close the gap, then apply when you’re stronger.`
          : 'Open a guided premium service to close the gap, then apply when you’re stronger.',
        jobTitle ? `Target role to aim for: “${jobTitle}”.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      actionUrl: href,
      priority: Math.max(base.priority, 90),
    };
  }

  if (course) {
    return {
      ...base,
      slotId: 'course',
      kind: 'course',
      title: jobTitle
        ? `Course prep for “${jobTitle}”`
        : role
          ? `Course prep for ${role}`
          : 'Strengthen your match before applying',
      text: [
        scoreBits
          ? `Your interest is clear, but scores are still low (${scoreBits}).`
          : 'Your interest is clear, but your match with these jobs is still low.',
        `Take “${course.title}” to prepare${jobTitle ? ` for “${jobTitle}”` : role ? ` for ${role}` : ''}, then apply with a stronger profile.`,
        'If you want hands-on help, premium career services are available too.',
      ].join(' '),
      actionUrl: course.href,
      priority: Math.max(base.priority, 88),
    };
  }

  return {
    ...base,
    slotId: 'course',
    kind: 'sales_followup',
    title: 'Get ready before applying',
    text: `You’ve visited these jobs more than once, but your match looks low${
      scoreBits ? ` (${scoreBits})` : ''
    }. Open premium services or a short course, prepare, then come back to apply.`,
    actionUrl: '/services',
    priority: Math.max(base.priority, 87),
  };
}

/**
 * Rewrite company / job nudges so Open never lands on a blind generic jobs board
 * when we already know the company has no openings.
 * Also: low match + repeated interest → prepare (course / premium) instead of apply-first.
 */
export function enrichJobIntentSuggestion(
  suggestion: UserBehaviourSuggestion,
  ctx: CompanyIntentCtx,
): UserBehaviourSuggestion {
  const companyTriggers = new Set([
    'hq_company_research_no_apply',
    'hq_company_high_intent',
  ]);
  const roleTriggers = new Set([
    'hq_ready_but_not_applying',
    'hq_learn_then_target_role',
    'hq_role_research',
  ]);
  const prepTriggers = new Set([
    'hq_low_market_fit',
    'hq_role_skill_mismatch',
  ]);

  const company = ctx.topCompany?.trim();
  const role = ctx.topRole?.trim();
  const jobs = getCachedSuggestionJobs();
  const prepFirst = shouldPrepareBeforeApply(ctx);

  if (prepTriggers.has(suggestion.triggerId) || (prepFirst && suggestion.kind === 'job')) {
    const roleJobs = role ? findJobsForRole(role, jobs) : [];
    const companyJobs = company ? findJobsForCompany(company, jobs) : [];
    const hint = companyJobs[0] || roleJobs[0];
    return pivotApplyToPrep(suggestion, ctx, hint);
  }

  if (companyTriggers.has(suggestion.triggerId) && company) {
    const companyJobs = findJobsForCompany(company, jobs);
    if (companyJobs.length > 0) {
      const hit = companyJobs[0];
      const applySuggestion: UserBehaviourSuggestion = {
        ...suggestion,
        title: `Apply at ${company}`,
        text: `${company} has open roles that fit what you’ve been browsing. Start with “${hit.title}” — open it and submit one strong application.`,
        actionUrl: exploreJobsUrl({ q: company, jobId: hit.id, company }),
        kind: 'job',
        slotId: 'jobs',
      };
      if (prepFirst) return pivotApplyToPrep(applySuggestion, ctx, hit);
      return applySuggestion;
    }

    // No jobs from that company — similar JD / companies / courses / OG page
    const hay = `${role || ''} ${company}`.trim();
    const roleJobs = role ? findJobsForRole(role, jobs) : [];
    const similarJob =
      roleJobs.find((j) => brandToken(j.company) !== brandToken(company)) || roleJobs[0];
    const similarCompany =
      (ctx.otherCompanies || []).find(
        (c) => brandToken(c) && brandToken(c) !== brandToken(company),
      ) || similarJob?.company;
    const course = pickCoursesForText(hay || 'career job skills', 1)[0];
    const ogPage = findOgCompanyPage(company);

    if (prepFirst) {
      return pivotApplyToPrep(suggestion, ctx, similarJob);
    }

    if (similarJob) {
      return {
        ...suggestion,
        title: role ? `Similar roles to ${company}` : `Openings near ${company}`,
        text: `${company} doesn’t have open jobs for you right now. A close match is “${similarJob.title}” at ${similarJob.company}${
          course ? ` — or start “${course.title}” to strengthen your fit` : ''
        }.`,
        actionUrl: exploreJobsUrl({
          q: role || similarJob.title,
          jobId: similarJob.id,
        }),
        kind: 'job',
        slotId: 'jobs',
      };
    }

    if (course) {
      return {
        ...suggestion,
        title: `Build skills while ${company} has no openings`,
        text: `${company} hasn’t posted matching jobs yet. Take “${course.title}” based on your interests${
          similarCompany ? `, or explore roles at ${similarCompany}` : role ? ` for ${role}` : ''
        }${ogPage ? `. You can also open their page for updates or a reference check.` : '.'}`,
        actionUrl: course.href,
        kind: 'course',
        slotId: 'course',
      };
    }

    if (ogPage) {
      return {
        ...suggestion,
        title: `No jobs at ${company} yet`,
        text: `${company} doesn’t have openings in Explore Jobs right now. Open their company page for updates, or start a reference check if you know someone there.`,
        actionUrl: `/community?company=${encodeURIComponent(ogPage.id)}`,
        kind: 'community',
        slotId: 'community',
      };
    }

    return {
      ...suggestion,
      title: role ? `Try ${role} openings` : `Browse roles like your interest`,
      text: `${company} doesn’t have open jobs right now. Explore matching roles${
        role ? ` for ${role}` : ''
      } and apply to one that fits your profile.`,
      actionUrl: exploreJobsUrl({ q: role || company }),
      kind: 'job',
      slotId: 'jobs',
    };
  }

  if (roleTriggers.has(suggestion.triggerId)) {
    const roleJobs = role ? findJobsForRole(role, jobs) : [];
    if (roleJobs.length > 0) {
      const hit = roleJobs[0];
      const applySuggestion: UserBehaviourSuggestion = {
        ...suggestion,
        title: role ? `Apply for ${role}` : suggestion.title,
        text: `A matching opening is “${hit.title}” at ${hit.company}. Open it and submit one application today.`,
        actionUrl: exploreJobsUrl({ q: role || hit.title, jobId: hit.id }),
      };
      if (prepFirst) return pivotApplyToPrep(applySuggestion, ctx, hit);
      return applySuggestion;
    }
    if (prepFirst) {
      return pivotApplyToPrep(suggestion, ctx);
    }
    if (role) {
      return {
        ...suggestion,
        actionUrl: exploreJobsUrl({ q: role }),
        text: suggestion.text.replace(
          /Open Explore Jobs[^.]*\./i,
          `Open matched ${role} jobs and apply to one that fits.`,
        ),
      };
    }
  }

  // Last resort: never leave a bare /explore-jobs if we have any signal
  if (suggestion.actionUrl === '/explore-jobs') {
    if (prepFirst) return pivotApplyToPrep(suggestion, ctx);
    if (role) return { ...suggestion, actionUrl: exploreJobsUrl({ q: role }) };
    if (company) return { ...suggestion, actionUrl: exploreJobsUrl({ q: company }) };
    const course = pickCoursesForText('career job skills interview', 1)[0];
    if (course) {
      return {
        ...suggestion,
        title: 'Strengthen your match first',
        text: `No specific company openings queued. Start “${course.title}”, then come back to matched jobs.`,
        actionUrl: course.href,
        kind: 'course',
        slotId: 'course',
      };
    }
  }

  return suggestion;
}
