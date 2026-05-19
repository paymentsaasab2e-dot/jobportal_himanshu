import type { WorkExperienceEntry } from '@/components/modals/WorkExperienceModal';

const EMPLOYMENT_FROM_DB: Record<string, string> = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
};

const WORK_MODE_FROM_DB: Record<string, string> = {
  REMOTE: 'remote',
  HYBRID: 'hybrid',
  ON_SITE: 'onsite',
  ONSITE: 'onsite',
};

export function normalizeEmploymentTypeFromApi(value?: string | null): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (EMPLOYMENT_FROM_DB[upper]) return EMPLOYMENT_FROM_DB[upper];
  const lower = trimmed.toLowerCase().replace(/_/g, '-');
  if (Object.values(EMPLOYMENT_FROM_DB).includes(lower)) return lower;
  return lower;
}

export function normalizeWorkModeFromApi(value?: string | null): string {
  if (!value) return '';
  const trimmed = String(value).trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (WORK_MODE_FROM_DB[upper]) return WORK_MODE_FROM_DB[upper];
  const lower = trimmed.toLowerCase().replace(/_/g, '-');
  if (lower === 'on-site' || lower === 'on site') return 'onsite';
  if (['remote', 'hybrid', 'onsite'].includes(lower)) return lower;
  return lower;
}

export function normalizeWorkExperienceFromApi(
  entry: WorkExperienceEntry,
): WorkExperienceEntry {
  return {
    ...entry,
    employmentType: normalizeEmploymentTypeFromApi(entry.employmentType),
    workMode: normalizeWorkModeFromApi(entry.workMode),
  };
}

export function isPersistedWorkExperienceId(value?: string): boolean {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

function workExperienceFingerprint(entry: WorkExperienceEntry): string {
  return [
    entry.jobTitle?.trim().toLowerCase(),
    entry.companyName?.trim().toLowerCase(),
    entry.startDate,
    entry.endDate,
  ].join('|');
}

/** Remove duplicate rows (same DB id or same role fingerprint). */
export function dedupeWorkExperiences(entries: WorkExperienceEntry[]): WorkExperienceEntry[] {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const result: WorkExperienceEntry[] = [];

  for (const entry of entries) {
    const fingerprint = workExperienceFingerprint(entry);

    if (isPersistedWorkExperienceId(entry.id)) {
      if (seenIds.has(entry.id) || seenFingerprints.has(fingerprint)) {
        continue;
      }
      seenIds.add(entry.id);
      seenFingerprints.add(fingerprint);
      result.push(entry);
      continue;
    }

    if (!seenFingerprints.has(fingerprint)) {
      seenFingerprints.add(fingerprint);
      result.push(entry);
    }
  }

  return result.map(normalizeWorkExperienceFromApi);
}
