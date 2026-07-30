import { withJobApiLocale } from '@/lib/jobApiLocale';
import type { AppLocale } from '@/lib/i18n';
import { mergeGeneralJobWithPersonalizedOverlay } from '@/lib/map-portal-job';
import { EXPLORE_JOBS_BATCH_SIZE } from '@/lib/explore-jobs-session-cache';

function extractJobsFromResponse(result: unknown): unknown[] {
  if (!result || typeof result !== 'object') return [];
  const r = result as Record<string, unknown>;
  if (Array.isArray(r)) return r as unknown[];
  if (Array.isArray(r.data)) return r.data as unknown[];
  const data = r.data as Record<string, unknown> | undefined;
  if (Array.isArray(data?.jobs)) return data!.jobs as unknown[];
  if (Array.isArray(data?.items)) return data!.items as unknown[];
  if (Array.isArray(r.jobs)) return r.jobs as unknown[];
  return [];
}

function jobId(job: unknown): string {
  if (!job || typeof job !== 'object') return '';
  const j = job as Record<string, unknown>;
  return String(j.id || j._id || j.jobId || '').trim();
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

/** Yield once so React can paint, without slowing the fetch pipeline. */
function paintFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export type ExploreProgressiveMeta = {
  isPersonalized: boolean;
  totalCatalog: number;
  totalMatches: number;
  batchIndex: number;
  done: boolean;
};

type CatalogPageResult = {
  jobs: unknown[];
  total: number;
  totalPages: number;
};

async function fetchCatalogPage(
  base: string,
  locale: AppLocale,
  page: number,
  limit: number,
): Promise<CatalogPageResult | null> {
  const url = withJobApiLocale(`${base}/jobs?page=${page}&limit=${limit}`, locale);
  const json = (await fetchJson(url)) as Record<string, unknown> | null;
  if (!json || json.success === false) return null;
  const jobs = extractJobsFromResponse(json);
  const pagination = (json.data as { pagination?: Record<string, number> } | undefined)
    ?.pagination;
  const total = typeof pagination?.total === 'number' ? pagination.total : jobs.length;
  const totalPages =
    typeof pagination?.totalPages === 'number'
      ? pagination.totalPages
      : Math.max(1, Math.ceil(total / limit) || 1);
  return { jobs, total, totalPages };
}

/**
 * Progressive explore-jobs loader:
 * 1) Match profile → top 10 + totalMatches (fast first paint)
 * 2) Pull remaining matches, emit detail lots of 10
 * 3) Prefetch catalog pages in parallel chunks for speed
 */
export async function fetchExploreJobsProgressive(input: {
  apiBases: string[];
  locale: AppLocale;
  candidateId: string | null;
  batchSize?: number;
  shouldAbort?: () => boolean;
  onBatch: (rawJobs: unknown[], meta: ExploreProgressiveMeta) => void;
}): Promise<ExploreProgressiveMeta> {
  const batchSize = input.batchSize ?? EXPLORE_JOBS_BATCH_SIZE;
  const aborted = () => Boolean(input.shouldAbort?.());
  /** How many catalog pages to fetch in parallel. */
  const prefetchWindow = 3;

  let personalizedJobs: unknown[] = [];
  let totalMatches = 0;
  let isPersonalized = false;
  let totalCatalog = 0;
  let workingBase = input.apiBases[0] || '';
  let batchIndex = 0;

  const emit = (jobs: unknown[], done: boolean) => {
    input.onBatch(jobs, {
      isPersonalized,
      totalCatalog,
      totalMatches: totalMatches || totalCatalog,
      batchIndex,
      done,
    });
    if (jobs.length > 0 || done) batchIndex += 1;
  };

  // --- Phase 1a: profile match → first 10 + total count ---
  if (input.candidateId) {
    for (const base of input.apiBases) {
      if (aborted()) break;
      const url = withJobApiLocale(
        `${base}/jobs/personalized?candidateId=${encodeURIComponent(input.candidateId)}&skipAi=1&limit=${batchSize}`,
        input.locale,
      );
      const json = (await fetchJson(url)) as Record<string, unknown> | null;
      if (!json || json.success === false) continue;
      const parsed = extractJobsFromResponse(json);
      if (parsed.length === 0 && typeof json.totalMatches !== 'number') continue;
      personalizedJobs = parsed;
      totalMatches =
        typeof json.totalMatches === 'number' ? json.totalMatches : parsed.length;
      isPersonalized = personalizedJobs.length > 0 || totalMatches > 0;
      workingBase = base;
      break;
    }
  }

  if (aborted()) {
    return { isPersonalized, totalCatalog, totalMatches, batchIndex: 0, done: true };
  }

  if (totalMatches > 0 || personalizedJobs.length > 0) {
    emit(personalizedJobs.slice(0, batchSize), false);
    await paintFrame();
  }

  const personalizedById = new Map<string, unknown>();
  const seen = new Set<string>();
  for (const job of personalizedJobs) {
    const id = jobId(job);
    if (!id) continue;
    personalizedById.set(id, job);
    seen.add(id);
  }

  // Start catalog discovery in parallel with deeper personalized pull
  const basesToTry = workingBase
    ? [workingBase, ...input.apiBases.filter((b) => b !== workingBase)]
    : input.apiBases;

  const catalogDiscoverPromise = (async (): Promise<{
    base: string;
    first: CatalogPageResult;
  } | null> => {
    for (const base of basesToTry) {
      if (aborted()) return null;
      const first = await fetchCatalogPage(base, input.locale, 1, batchSize);
      if (!first) continue;
      return { base, first };
    }
    return null;
  })();

  // --- Phase 1b: remaining match details in lots of 10 ---
  if (input.candidateId && workingBase && !aborted()) {
    const deeperLimit = Math.max(batchSize * 12, 120);
    const url = withJobApiLocale(
      `${workingBase}/jobs/personalized?candidateId=${encodeURIComponent(input.candidateId)}&skipAi=1&limit=${deeperLimit}`,
      input.locale,
    );
    const json = (await fetchJson(url)) as Record<string, unknown> | null;
    if (json && json.success !== false) {
      const parsed = extractJobsFromResponse(json);
      if (typeof json.totalMatches === 'number') totalMatches = json.totalMatches;
      if (parsed.length > 0) {
        isPersonalized = true;
        personalizedJobs = parsed;
        for (const job of parsed) {
          const id = jobId(job);
          if (id) personalizedById.set(id, job);
        }
        const remaining: unknown[] = [];
        for (const job of parsed) {
          const id = jobId(job);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          remaining.push(job);
        }
        for (let i = 0; i < remaining.length; i += batchSize) {
          if (aborted()) break;
          emit(remaining.slice(i, i + batchSize), false);
          await paintFrame();
        }
      }
    }
  }

  if (aborted()) {
    return { isPersonalized, totalCatalog, totalMatches, batchIndex, done: true };
  }

  // --- Phase 2: catalog pages (parallel prefetch windows) ---
  const discovered = await catalogDiscoverPromise;
  let catalogBase = workingBase;
  let totalPages = 1;
  let firstPageJobs: unknown[] = [];

  if (discovered) {
    catalogBase = discovered.base;
    firstPageJobs = discovered.first.jobs;
    totalCatalog = discovered.first.total;
    totalPages = discovered.first.totalPages;
  }

  if (!totalMatches && !input.candidateId) {
    totalMatches = totalCatalog;
  }

  const emitMergedPage = (pageJobs: unknown[]) => {
    const merged: unknown[] = [];
    for (const job of pageJobs) {
      const id = jobId(job);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const personalizedMatch = personalizedById.get(id);
      merged.push(
        personalizedMatch
          ? mergeGeneralJobWithPersonalizedOverlay(
              job as Record<string, unknown>,
              personalizedMatch as Record<string, unknown>,
            )
          : job,
      );
    }
    if (merged.length === 0) return;
    emit(merged, false);
  };

  if (firstPageJobs.length > 0) {
    emitMergedPage(firstPageJobs);
    await paintFrame();
  }

  let page = 2;
  while (page <= totalPages && !aborted()) {
    const end = Math.min(page + prefetchWindow - 1, totalPages);
    const pages = Array.from({ length: end - page + 1 }, (_, i) => page + i);
    const results = await Promise.all(
      pages.map((p) => fetchCatalogPage(catalogBase, input.locale, p, batchSize)),
    );
    for (let i = 0; i < results.length; i += 1) {
      if (aborted()) break;
      const result = results[i];
      if (!result || result.jobs.length === 0) {
        totalPages = page + i - 1;
        break;
      }
      if (result.total > 0) totalCatalog = result.total;
      if (result.totalPages > 0) totalPages = result.totalPages;
      emitMergedPage(result.jobs);
      await paintFrame();
    }
    page = end + 1;
  }

  const finalMeta: ExploreProgressiveMeta = {
    isPersonalized,
    totalCatalog,
    totalMatches: totalMatches || totalCatalog,
    batchIndex,
    done: true,
  };
  input.onBatch([], finalMeta);
  return finalMeta;
}
