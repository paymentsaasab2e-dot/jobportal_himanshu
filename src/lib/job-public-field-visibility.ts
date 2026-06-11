export const JOB_PUBLIC_VISIBILITY_FIELDS = [
  'nationality',
  'jobTitle',
  'client',
  'contactPerson',
  'openings',
  'location',
  'industryType',
  'employmentType',
  'targetHireDate',
  'experience',
  'salary',
  'languages',
  'keyResponsibilities',
  'qualifications',
  'candidateRequirements',
  'skills',
  'jobDescription',
  'videoMediaLink',
  'forecastRevenue',
  'priority',
] as const;

export type JobPublicVisibilityField = (typeof JOB_PUBLIC_VISIBILITY_FIELDS)[number];

export type JobPublicFieldVisibility = Partial<Record<JobPublicVisibilityField, boolean>>;

export const DEFAULT_JOB_PUBLIC_FIELD_VISIBILITY: JobPublicFieldVisibility = Object.fromEntries(
  JOB_PUBLIC_VISIBILITY_FIELDS.map((key) => [key, true]),
) as JobPublicFieldVisibility;

export function parseJobPublicFieldVisibility(raw: unknown): JobPublicFieldVisibility {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_JOB_PUBLIC_FIELD_VISIBILITY };
  }
  const source = raw as Record<string, unknown>;
  const merged: JobPublicFieldVisibility = { ...DEFAULT_JOB_PUBLIC_FIELD_VISIBILITY };
  for (const key of JOB_PUBLIC_VISIBILITY_FIELDS) {
    if (source[key] === false) merged[key] = false;
    else if (source[key] === true) merged[key] = true;
  }
  return merged;
}

export function isJobFieldPubliclyVisible(
  visibility: JobPublicFieldVisibility | null | undefined,
  field: JobPublicVisibilityField,
  legacyShowClient?: boolean,
): boolean {
  if (field === 'client') {
    if (legacyShowClient === false) return false;
    if (visibility?.client === false) return false;
    return true;
  }
  if (!visibility) return true;
  return visibility[field] !== false;
}

export function resolveShowClientNamePublicly(
  visibility: JobPublicFieldVisibility | null | undefined,
  legacyShowClient?: boolean | null,
): boolean {
  if (legacyShowClient === false) return false;
  return isJobFieldPubliclyVisible(visibility, 'client', legacyShowClient ?? true);
}

/** Strip hidden CRM fields from a Phase 1 job listing — no placeholders or confidential labels. */
export function redactPortalJobListing<T extends Record<string, unknown>>(
  listing: T,
  options?: {
    showClientNamePublicly?: boolean;
    publicFieldVisibility?: Record<string, boolean> | null;
  },
): T {
  const visibility = parseJobPublicFieldVisibility(options?.publicFieldVisibility);
  const legacyShowClient = options?.showClientNamePublicly !== false;
  const show = (field: JobPublicVisibilityField) =>
    isJobFieldPubliclyVisible(visibility, field, legacyShowClient);

  const out: Record<string, unknown> = { ...listing };

  if (!show('client')) {
    out.company = '';
    out.companyOverview = '';
    out.logo = '/perosn_icon.png';
    out.contactPerson = '';
  }
  if (!show('jobTitle')) {
    out.title = '';
  }
  if (!show('location')) {
    out.location = '';
    out.city = undefined;
    out.state = undefined;
    out.country = undefined;
  }
  if (!show('salary')) {
    out.salary = '';
    out.salaryMin = null;
    out.salaryMax = null;
    out.salaryCurrency = null;
  }
  if (!show('experience')) {
    out.experienceLevel = '';
    out.experienceMin = null;
    out.experienceMax = null;
    out.experienceDisplay = null;
  }
  if (!show('employmentType')) {
    out.type = '';
    out.employmentType = '';
  }
  if (!show('openings')) {
    out.openings = undefined;
  }
  if (!show('nationality')) {
    out.nationality = undefined;
  }
  if (!show('industryType')) {
    out.industryType = undefined;
    out.industry = '';
    out.department = undefined;
  }
  if (!show('targetHireDate')) {
    out.targetHireDate = undefined;
  }
  if (!show('priority')) {
    out.priority = undefined;
  }
  if (!show('languages')) {
    out.languages = [];
  }
  if (!show('skills')) {
    out.skills = [];
    out.requiredSkills = [];
    out.niceToHaveSkills = [];
    out.preferredSkills = [];
  }
  if (!show('keyResponsibilities')) {
    out.responsibilities = [];
  }
  if (!show('qualifications')) {
    out.preferredQualifications = [];
    out.education = undefined;
  }
  if (!show('candidateRequirements')) {
    out.candidateRequirements = [];
  }
  if (!show('jobDescription')) {
    out.description = '';
    out.jobOverview = undefined;
    out.fullDescription = '';
    out.companyOverview = '';
    out.benefits = [];
  }
  if (!show('videoMediaLink')) {
    out.videoMediaLink = undefined;
  }
  if (!show('forecastRevenue')) {
    out.forecastRevenue = undefined;
  }
  if (!show('contactPerson')) {
    out.contactPerson = '';
  }

  return out as T;
}

/** Whether a JD section heading from HTML/plain text should show on Phase 1. */
export function htmlSectionTitleVisibleOnPortal(
  title: string,
  show: (field: JobPublicVisibilityField) => boolean,
): boolean {
  const normalized = String(title || '').trim().toLowerCase();
  if (/^job title$/.test(normalized)) return show('jobTitle');
  if (/key responsibilities|^responsibilities$|role & responsibilities/.test(normalized)) {
    return show('keyResponsibilities');
  }
  if (
    /^requirements$|^required skills$|qualifications|preferred education|preferred qualifications/.test(
      normalized,
    )
  ) {
    return show('qualifications');
  }
  if (/candidate requirements?/.test(normalized)) return show('candidateRequirements');
  if (/^skills$|^key skills$/.test(normalized)) return show('skills');
  if (/benefits|compensation/.test(normalized)) return show('jobDescription');
  if (/^overview$|^job summary$|^about this role$/.test(normalized)) return show('jobDescription');
  return show('jobDescription');
}
