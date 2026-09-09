/**
 * Maps Phase-1 candidate profile → Career Path assessment form fields.
 */

import type { CareerAssessment, CareerExperienceLevel } from '../types';

type WorkExperienceLike = {
  jobTitle?: string | null;
  companyName?: string | null;
  currentlyWorkHere?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
  industryDomain?: string | null;
  keyResponsibilities?: string | null;
  workSkills?: string[] | string | null;
};

type EducationLike = {
  degreeProgram?: string | null;
  degree?: string | null;
  institutionName?: string | null;
  institution?: string | null;
  specialization?: string | null;
  fieldOfStudy?: string | null;
};

type ProfileLike = {
  summaryText?: string | null;
  experienceYears?: number | null;
  personalInfo?: {
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
  } | null;
  careerPreferences?: {
    currentRole?: string | null;
    preferredRoles?: string[] | string | null;
    preferredJobTitles?: string[] | string | null;
    preferredIndustries?: string[] | string | null;
    preferredIndustry?: string | null;
    functionalArea?: string | null;
    careerGoal?: string | null;
    jobSearchStatus?: string | null;
  } | null;
  workExperience?: WorkExperienceLike[] | null;
  education?: EducationLike[] | null;
  educations?: EducationLike[] | null;
  skills?: Array<{ name?: string | null; category?: string | null }> | null;
};

function clean(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const text = clean(value);
  if (!text) return [];
  return text
    .split(/[,|/;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pickCurrentWork(profile: ProfileLike): WorkExperienceLike | null {
  const rows = Array.isArray(profile.workExperience) ? profile.workExperience : [];
  if (!rows.length) return null;
  return rows.find((row) => Boolean(row?.currentlyWorkHere)) || rows[0] || null;
}

function estimateYears(profile: ProfileLike): number {
  const explicit = Number(profile.experienceYears);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const rows = Array.isArray(profile.workExperience) ? profile.workExperience : [];
  let earliest: number | null = null;
  const now = Date.now();
  for (const row of rows) {
    const start = row?.startDate ? Date.parse(String(row.startDate)) : NaN;
    if (!Number.isFinite(start)) continue;
    if (earliest == null || start < earliest) earliest = start;
  }
  if (earliest == null) return 0;
  return Math.max(0, (now - earliest) / (365.25 * 24 * 60 * 60 * 1000));
}

export function experienceLevelFromYears(years: number): CareerExperienceLevel {
  if (years >= 5) return 'Advanced';
  if (years >= 2) return 'Intermediate';
  return 'Beginner';
}

function formatEducation(profile: ProfileLike): string {
  const rows = Array.isArray(profile.education)
    ? profile.education
    : Array.isArray(profile.educations)
      ? profile.educations
      : [];
  if (!rows.length) return '';
  const top = rows[0];
  const degree = clean(top?.degreeProgram || top?.degree);
  const specialization = clean(top?.specialization || top?.fieldOfStudy);
  const institution = clean(top?.institutionName || top?.institution);
  return [degree, specialization, institution].filter(Boolean).join(', ');
}

function formatSkills(profile: ProfileLike): string {
  const names = new Set<string>();
  for (const skill of profile.skills || []) {
    const name = clean(skill?.name);
    if (name) names.add(name);
  }
  for (const job of profile.workExperience || []) {
    const workSkills = job?.workSkills;
    if (Array.isArray(workSkills)) {
      workSkills.map(clean).filter(Boolean).forEach((item) => names.add(item));
    } else if (typeof workSkills === 'string') {
      asList(workSkills).forEach((item) => names.add(item));
    }
  }
  return Array.from(names).slice(0, 20).join(', ');
}

function inferInterestedField(profile: ProfileLike, skills: string, role: string): string {
  const prefs = profile.careerPreferences;
  const industry = clean(prefs?.preferredIndustry || prefs?.functionalArea);
  if (industry) return industry;
  const industries = asList(prefs?.preferredIndustries);
  if (industries.length) return industries.slice(0, 4).join(', ');

  const blob = `${skills} ${role} ${clean(profile.summaryText)}`.toLowerCase();
  const fields: Array<{ label: string; pattern: RegExp }> = [
    { label: 'AI / Machine Learning', pattern: /\bai\b|machine learning|\bml\b|llm|deep learning/i },
    { label: 'Data Science', pattern: /data science|data analyst|analytics|pandas|tableau/i },
    { label: 'Web Development', pattern: /web|react|next\.?js|frontend|full\s*stack|node/i },
    { label: 'Mobile Development', pattern: /mobile|android|ios|flutter|react native/i },
    { label: 'Cloud / DevOps', pattern: /cloud|aws|azure|devops|kubernetes|docker/i },
    { label: 'UI / UX', pattern: /\bui\b|\bux\b|figma|design/i },
    { label: 'Backend Development', pattern: /backend|java|spring|django|\.net/i },
  ];
  const matched = fields.filter((field) => field.pattern.test(blob)).map((field) => field.label);
  return matched.slice(0, 3).join(', ');
}

function buildAboutMe(profile: ProfileLike, role: string, company: string, skills: string): string {
  const summary = clean(profile.summaryText);
  if (summary.length >= 20) return summary.slice(0, 800);

  const parts: string[] = [];
  if (role && company) parts.push(`I am a ${role} at ${company}.`);
  else if (role) parts.push(`I currently work as a ${role}.`);
  else if (company) parts.push(`I currently work at ${company}.`);
  if (skills) parts.push(`My skills include ${skills}.`);
  parts.push('I want a clear learning path to grow into my next career goal.');
  return parts.join(' ').slice(0, 800);
}

export function buildCareerAssessmentFromProfile(
  profile: ProfileLike | null | undefined,
): Partial<CareerAssessment> | null {
  if (!profile || typeof profile !== 'object') return null;

  const currentWork = pickCurrentWork(profile);
  const role =
    clean(profile.careerPreferences?.currentRole) || clean(currentWork?.jobTitle);
  const company = clean(currentWork?.companyName);
  const skills = formatSkills(profile);
  const education = formatEducation(profile);
  const preferredRoles = [
    ...asList(profile.careerPreferences?.preferredJobTitles),
    ...asList(profile.careerPreferences?.preferredRoles),
  ];
  const careerGoalPref = clean(profile.careerPreferences?.careerGoal);
  const targetRole = preferredRoles[0] || role || '';
  const careerGoal =
    careerGoalPref ||
    (targetRole ? `Become a ${targetRole}` : '') ||
    (role ? `Grow beyond ${role}` : '');
  const interestedField = inferInterestedField(profile, skills, role || targetRole);
  const experienceLevel = experienceLevelFromYears(estimateYears(profile));
  const aboutMe = buildAboutMe(profile, role, company, skills);

  const draft: Partial<CareerAssessment> = {};
  if (aboutMe) draft.aboutMe = aboutMe;
  if (education) draft.education = education;
  if (skills) draft.currentSkills = skills;
  draft.experienceLevel = experienceLevel;
  if (interestedField) draft.interestedField = interestedField;
  if (careerGoal) draft.careerGoal = careerGoal;
  if (targetRole) draft.targetRole = targetRole;
  // Keep default hours unless profile later stores learning prefs.
  return Object.keys(draft).length ? draft : null;
}
