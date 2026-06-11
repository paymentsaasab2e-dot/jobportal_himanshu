import type { ProfileCompletenessResponse } from '@/lib/profile-completion';

export type ProfileSectionSlug =
  | 'basic-information'
  | 'summary'
  | 'resume'
  | 'work-experience'
  | 'internships'
  | 'gap-explanation'
  | 'education'
  | 'academic-achievements'
  | 'competitive-exams'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'portfolio-links'
  | 'certifications'
  | 'accomplishments'
  | 'career-preferences'
  | 'visa-work-authorization'
  | 'vaccination';

export type ProfileMissingSection = {
  slug: ProfileSectionSlug;
  label: string;
  tabId: string;
};

type ProfileDataSnapshot = Record<string, unknown>;

function hasItems(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return true;
  return false;
}

function completenessIncomplete(
  completeness: ProfileCompletenessResponse | null | undefined,
  key: string,
): boolean {
  if (!completeness?.sections?.length) return false;
  const section = completeness.sections.find((s) => s.key === key);
  return section ? !section.isComplete : false;
}

function getWorkExperiences(data: ProfileDataSnapshot): unknown[] {
  if (Array.isArray(data.workExperiences)) return data.workExperiences;
  if (Array.isArray(data.workExperience)) return data.workExperience;
  if (data.workExperience) return [data.workExperience];
  return [];
}

function getInternships(data: ProfileDataSnapshot): unknown[] {
  if (Array.isArray(data.internships)) return data.internships;
  if (data.internship) return [data.internship];
  return [];
}

function getGapExplanations(data: ProfileDataSnapshot): unknown[] {
  if (Array.isArray(data.gapExplanations)) return data.gapExplanations;
  if (data.gapExplanation) return [data.gapExplanation];
  return [];
}

function getEducations(data: ProfileDataSnapshot): unknown[] {
  if (Array.isArray(data.educations)) return data.educations;
  if (data.education) return [data.education];
  return [];
}

const ORDERED_SECTIONS: Array<{
  slug: ProfileSectionSlug;
  label: string;
  tabId: string;
  isMissing: (
    data: ProfileDataSnapshot,
    completeness: ProfileCompletenessResponse | null | undefined,
  ) => boolean;
}> = [
  {
    slug: 'basic-information',
    label: 'Basic Information',
    tabId: 'personal-details',
    isMissing: (_d, c) => completenessIncomplete(c, 'basicInformation'),
  },
  {
    slug: 'resume',
    label: 'Resume',
    tabId: 'personal-details',
    isMissing: (_d, c) => completenessIncomplete(c, 'resume'),
  },
  {
    slug: 'summary',
    label: 'Professional Summary',
    tabId: 'personal-details',
    isMissing: (_d, c) => completenessIncomplete(c, 'summary'),
  },
  {
    slug: 'work-experience',
    label: 'Work Experience',
    tabId: 'work-experience',
    isMissing: (d) => getWorkExperiences(d).length === 0,
  },
  {
    slug: 'internships',
    label: 'Internships',
    tabId: 'work-experience',
    isMissing: (d) => getInternships(d).length === 0,
  },
  {
    slug: 'gap-explanation',
    label: 'Gap Explanation',
    tabId: 'work-experience',
    isMissing: (d) => getGapExplanations(d).length === 0,
  },
  {
    slug: 'education',
    label: 'Education',
    tabId: 'education',
    isMissing: (d, c) =>
      completenessIncomplete(c, 'education') || getEducations(d).length === 0,
  },
  {
    slug: 'academic-achievements',
    label: 'Academic Achievements',
    tabId: 'education',
    isMissing: (d) => !hasItems(d.academicAchievements),
  },
  {
    slug: 'competitive-exams',
    label: 'Competitive Exams',
    tabId: 'education',
    isMissing: (d) => !hasItems(d.competitiveExams),
  },
  {
    slug: 'skills',
    label: 'Skills',
    tabId: 'skills',
    isMissing: (_d, c) => completenessIncomplete(c, 'skills'),
  },
  {
    slug: 'languages',
    label: 'Languages',
    tabId: 'skills',
    isMissing: (_d, c) => completenessIncomplete(c, 'languages'),
  },
  {
    slug: 'projects',
    label: 'Projects',
    tabId: 'projects-certifications',
    isMissing: (_d, c) => completenessIncomplete(c, 'projects'),
  },
  {
    slug: 'portfolio-links',
    label: 'Portfolio Links',
    tabId: 'projects-certifications',
    isMissing: (_d, c) => completenessIncomplete(c, 'portfolioLinks'),
  },
  {
    slug: 'certifications',
    label: 'Certifications',
    tabId: 'projects-certifications',
    isMissing: (d) => !hasItems(d.certifications),
  },
  {
    slug: 'accomplishments',
    label: 'Accomplishments',
    tabId: 'projects-certifications',
    isMissing: (d) => !hasItems(d.accomplishments),
  },
  {
    slug: 'career-preferences',
    label: 'Career Preferences',
    tabId: 'job-preferences',
    isMissing: (_d, c) => completenessIncomplete(c, 'careerPreferences'),
  },
  {
    slug: 'visa-work-authorization',
    label: 'Visa & Work Authorization',
    tabId: 'additional-details',
    isMissing: (_d, c) => completenessIncomplete(c, 'visaWorkAuthorization'),
  },
  {
    slug: 'vaccination',
    label: 'Vaccination',
    tabId: 'additional-details',
    isMissing: (_d, c) => completenessIncomplete(c, 'vaccination'),
  },
];

export function getMissingProfileSections(
  profileData: ProfileDataSnapshot | null | undefined,
  completeness: ProfileCompletenessResponse | null | undefined,
): ProfileMissingSection[] {
  const data = profileData || {};
  return ORDERED_SECTIONS.filter((section) => section.isMissing(data, completeness)).map(
    ({ slug, label, tabId }) => ({ slug, label, tabId }),
  );
}

export function buildProfileMissingSignature(sections: ProfileMissingSection[]): string {
  return sections.map((s) => s.slug).join('|');
}

export const PROFILE_SECTION_SLUG_SET = new Set<string>(
  ORDERED_SECTIONS.map((s) => s.slug),
);

export function isProfileSectionSlug(value: string | null | undefined): value is ProfileSectionSlug {
  return Boolean(value && PROFILE_SECTION_SLUG_SET.has(value));
}

export type ProfileModalHandlers = {
  openBasicInfo: () => void;
  openSummary: () => void;
  openResume: () => void;
  openWorkExperience: () => void;
  openInternships: () => void;
  openGapExplanation: () => void;
  openEducation: () => void;
  openAcademicAchievements: () => void;
  openCompetitiveExams: () => void;
  openSkills: () => void;
  openLanguages: () => void;
  openProjects: () => void;
  openPortfolioLinks: () => void;
  openCertifications: () => void;
  openAccomplishments: () => void;
  openCareerPreferences: () => void;
  openVisaWorkAuthorization: () => void;
  openVaccination: () => void;
};

export function openProfileSectionBySlug(
  slug: ProfileSectionSlug,
  handlers: ProfileModalHandlers,
): boolean {
  const map: Record<ProfileSectionSlug, () => void> = {
    'basic-information': handlers.openBasicInfo,
    summary: handlers.openSummary,
    resume: handlers.openResume,
    'work-experience': handlers.openWorkExperience,
    internships: handlers.openInternships,
    'gap-explanation': handlers.openGapExplanation,
    education: handlers.openEducation,
    'academic-achievements': handlers.openAcademicAchievements,
    'competitive-exams': handlers.openCompetitiveExams,
    skills: handlers.openSkills,
    languages: handlers.openLanguages,
    projects: handlers.openProjects,
    'portfolio-links': handlers.openPortfolioLinks,
    certifications: handlers.openCertifications,
    accomplishments: handlers.openAccomplishments,
    'career-preferences': handlers.openCareerPreferences,
    'visa-work-authorization': handlers.openVisaWorkAuthorization,
    vaccination: handlers.openVaccination,
  };

  const opener = map[slug];
  if (!opener) return false;
  opener();
  return true;
}

export function getProfileSectionTabId(slug: ProfileSectionSlug): string {
  return ORDERED_SECTIONS.find((s) => s.slug === slug)?.tabId ?? 'personal-details';
}
