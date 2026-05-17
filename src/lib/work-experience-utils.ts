import type { WorkExperienceEntry } from '@/components/modals/WorkExperienceModal';

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

  return result;
}
