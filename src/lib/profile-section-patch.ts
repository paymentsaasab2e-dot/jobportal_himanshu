/**
 * Typed profile section patching — mutation response → local UI + session cache.
 * Avoids a full profile GET after section saves (P0/P1).
 */

import {
  patchProfileSessionCache,
  type ProfileSessionCacheEntry,
} from '@/lib/profile-session-cache';

export type ProfileSectionKey =
  | 'personalInfo'
  | 'summaryText'
  | 'workExperiences'
  | 'educations'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'accomplishments'
  | 'projects'
  | 'portfolioLinks'
  | 'internships'
  | 'gapExplanations'
  | 'academicAchievements'
  | 'competitiveExams'
  | 'careerPreferences'
  | 'visaWorkAuthorization'
  | 'vaccination'
  | 'resume';

export type SectionPatchMap = Partial<Record<ProfileSectionKey, unknown>>;

/**
 * Apply authoritative section data from a mutation response.
 * Updates session cache immediately; callers update React state with the same payload.
 */
export function applySectionPatch(
  candidateId: string | null | undefined,
  patch: SectionPatchMap,
): ProfileSessionCacheEntry | null {
  const id = String(candidateId || '').trim();
  if (!id || !patch || Object.keys(patch).length === 0) return null;
  return patchProfileSessionCache(id, patch as Record<string, unknown>);
}

/**
 * Prefer server-returned section arrays/objects; fall back to client payload.
 */
export function pickAuthoritativeSection<T>(
  responseData: unknown,
  fallback: T,
  keys: string[] = ['data', 'items', 'entries'],
): T {
  if (responseData == null) return fallback;
  if (Array.isArray(responseData)) return responseData as T;
  if (typeof responseData === 'object') {
    const obj = responseData as Record<string, unknown>;
    for (const key of keys) {
      if (obj[key] != null) {
        return obj[key] as T;
      }
    }
    // Whole object is the section DTO
    if (!('success' in obj)) return responseData as T;
    if (obj.data != null) return obj.data as T;
  }
  return fallback;
}
