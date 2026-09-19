/**
 * Career preferences DTO + API normalize helpers (shared, no React).
 * Kept separate so profile page can normalize without pulling the modal bundle.
 */

export interface CareerPreferencesData {
  currentRole?: string;
  preferredJobTitles: string[];
  preferredRoles?: string[];
  preferredIndustries: string[];
  functionalAreas: string[];
  preferredIndustry?: string;
  functionalArea?: string;
  jobTypes: string[];
  workModes: string[];
  preferredWorkMode?: string;
  preferredLocations: string[];
  relocationPreference: string;
  salaryCurrency: string;
  salaryAmount: string;
  salaryFrequency: string;
  preferredCurrency?: string;
  preferredSalary?: string;
  preferredSalaryType?: string;
  preferredBenefits?: string[];
  currentCurrency?: string;
  currentSalaryType?: string;
  currentSalary?: string;
  currentLocation?: string;
  currentBenefits?: string[];
  availabilityToStart: string;
  noticePeriod?: string;
  passportNumbersByLocation?: Record<string, string>;
}

function uniqueStrings(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function normalizeSalaryTypeLabel(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'ANNUAL' || raw === 'ANNUALLY') return 'Annual';
  if (raw === 'MONTHLY') return 'Monthly';
  if (raw === 'HOURLY') return 'Hourly';
  if (raw === 'DAILY') return 'Daily';
  return String(value).trim();
}

function normalizeWorkModeLabel(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'REMOTE') return 'Remote';
  if (raw === 'ON_SITE' || raw === 'ONSITE') return 'On-site';
  if (raw === 'HYBRID') return 'Hybrid';
  return String(value).trim();
}

export function parsePreferenceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map(String));
  }
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return [];
  return uniqueStrings(s.split(/[,;|]\s*/));
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => String(item)));
  }
  return parsePreferenceList(value);
}

export function normalizeCareerPreferencesFromApi(
  raw: unknown,
): CareerPreferencesData | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const preferredIndustries = parsePreferenceList(r.preferredIndustries ?? r.preferredIndustry);
  const functionalAreas = parsePreferenceList(r.functionalAreas ?? r.functionalArea);
  const preferredJobTitles = parseStringArray(r.preferredJobTitles ?? r.preferredRoles);
  const preferredWorkMode = normalizeWorkModeLabel(r.preferredWorkMode);
  const workModes = uniqueStrings(
    parseStringArray(r.workModes)
      .map((mode) => normalizeWorkModeLabel(mode))
      .filter(Boolean),
  );
  const normalizedWorkModes = workModes.length > 0 ? workModes : preferredWorkMode ? [preferredWorkMode] : [];
  const preferredLocations = uniqueStrings([...parseStringArray(r.preferredLocations)]);
  const preferredCurrency = String(r.preferredCurrency ?? r.salaryCurrency ?? 'USD');
  const preferredSalary = String(r.preferredSalary ?? r.salaryAmount ?? '');
  const preferredSalaryType = normalizeSalaryTypeLabel(r.preferredSalaryType ?? r.salaryFrequency);
  const currentRole = String(r.currentRole ?? r.currentTitle ?? r.designation ?? '').trim();
  return {
    currentRole: currentRole || undefined,
    preferredJobTitles,
    preferredRoles: preferredJobTitles,
    preferredIndustries,
    functionalAreas,
    preferredIndustry: preferredIndustries.length ? preferredIndustries.join('; ') : undefined,
    functionalArea: functionalAreas.length ? functionalAreas.join('; ') : undefined,
    jobTypes: parseStringArray(r.jobTypes),
    workModes: normalizedWorkModes,
    preferredWorkMode: preferredWorkMode || normalizedWorkModes[0] || '',
    preferredLocations,
    relocationPreference: String(r.relocationPreference ?? ''),
    salaryCurrency: preferredCurrency,
    salaryAmount: preferredSalary,
    salaryFrequency: preferredSalaryType,
    preferredCurrency,
    preferredSalary,
    preferredSalaryType,
    preferredBenefits: parseStringArray(r.preferredBenefits),
    currentCurrency: String(r.currentCurrency ?? ''),
    currentSalaryType: normalizeSalaryTypeLabel(r.currentSalaryType),
    currentSalary: String(r.currentSalary ?? ''),
    currentLocation: String(r.currentLocation ?? ''),
    currentBenefits: parseStringArray(r.currentBenefits),
    availabilityToStart: String(r.availabilityToStart ?? ''),
    noticePeriod: r.noticePeriod ? String(r.noticePeriod) : undefined,
  };
}
