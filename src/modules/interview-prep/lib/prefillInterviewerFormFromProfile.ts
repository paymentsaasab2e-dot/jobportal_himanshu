/**
 * Maps Phase-1 candidate profile → Become Interviewer form fields.
 * Uses profile facts (work history, skills, languages, summary) with
 * keyword heuristics so expertise / interview types land on the form chips.
 */

export const INTERVIEWER_FORM_SKILLS = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'DevOps',
  'Cloud',
  'AI / Machine Learning',
  'Data Science',
  'UI / UX',
  'Product Management',
  'QA / Testing',
  'Cybersecurity',
  'Data Engineering',
  'HR Interview',
  'Behavioral Interview',
  'DSA',
  'System Design',
] as const;

export const INTERVIEWER_FORM_TYPES = [
  'Technical Interview',
  'Coding Interview',
  'Mock Interview',
  'System Design',
  'HR Round',
  'Behavioral Round',
  'Managerial Round',
  'Case Interview',
] as const;

export const INTERVIEWER_FORM_LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Odia',
  'Assamese',
  'French',
  'Spanish',
  'German',
  'Arabic',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Italian',
  'Dutch',
  'Turkish',
  'Indonesian',
  'Thai',
  'Vietnamese',
] as const;

export type InterviewerFormSkill = (typeof INTERVIEWER_FORM_SKILLS)[number];
export type InterviewerFormType = (typeof INTERVIEWER_FORM_TYPES)[number];
export type InterviewerFormLanguage = (typeof INTERVIEWER_FORM_LANGUAGES)[number];

export type InterviewerFormPrefill = {
  fullName: string;
  currentCompany: string;
  currentRole: string;
  experienceBucket: string;
  expertiseAreas: InterviewerFormSkill[];
  interviewTypes: InterviewerFormType[];
  languages: InterviewerFormLanguage[];
  aboutYourself: string;
  feedbackStyle: string;
};

type WorkExperienceLike = {
  jobTitle?: string | null;
  companyName?: string | null;
  currentlyWorkHere?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
  keyResponsibilities?: string | null;
  workSkills?: string[] | string | null;
};

type ProfileLike = {
  fullName?: string | null;
  experienceYears?: number | null;
  summaryText?: string | null;
  personalInfo?: {
    fullName?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  } | null;
  careerPreferences?: {
    currentRole?: string | null;
    preferredJobTitles?: string[] | null;
    preferredRoles?: string[] | null;
    preferredIndustries?: string[] | null;
    preferredIndustry?: string | null;
    functionalAreas?: string[] | null;
    functionalArea?: string | null;
  } | null;
  workExperience?: WorkExperienceLike[] | null;
  skills?: Array<{ name?: string | null; category?: string | null }> | null;
  languages?: Array<{ name?: string | null }> | null;
};

const SKILL_KEYWORD_MAP: Array<{ skill: InterviewerFormSkill; patterns: RegExp[] }> = [
  {
    skill: 'Frontend Development',
    patterns: [/front\s*end/i, /\breact\b/i, /\bnext\.?js\b/i, /\bvue\b/i, /\bangular\b/i, /\bhtml\b/i, /\bcss\b/i, /\btailwind\b/i],
  },
  {
    skill: 'Backend Development',
    patterns: [/back\s*end/i, /\bnode\b/i, /\bexpress\b/i, /\bnest\b/i, /\bjava\b/i, /\bspring\b/i, /\bdjango\b/i, /\b\.?net\b/i, /\blaravel\b/i, /\bfastapi\b/i],
  },
  {
    skill: 'Full Stack Development',
    patterns: [/full\s*stack/i, /mern/i, /mean/i],
  },
  {
    skill: 'Mobile Development',
    patterns: [/mobile/i, /react\s*native/i, /flutter/i, /\bkotlin\b/i, /\bswift\b/i, /\bandroid\b/i, /\bios\b/i],
  },
  {
    skill: 'DevOps',
    patterns: [/devops/i, /docker/i, /kubernetes|\bk8s\b/i, /ci\s*\/?\s*cd/i, /jenkins/i, /terraform/i],
  },
  {
    skill: 'Cloud',
    patterns: [/\baws\b/i, /\bazure\b/i, /\bgcp\b/i, /google\s*cloud/i, /cloud/i, /serverless/i],
  },
  {
    skill: 'AI / Machine Learning',
    patterns: [/\bai\b/i, /machine\s*learning|\bml\b/i, /deep\s*learning/i, /tensorflow/i, /pytorch/i, /\bnlp\b/i, /llm/i],
  },
  {
    skill: 'Data Science',
    patterns: [/data\s*science/i, /data\s*analyst/i, /\bpandas\b/i, /\bsql\b/i, /tableau/i, /power\s*bi/i],
  },
  {
    skill: 'UI / UX',
    patterns: [/\bui\b/i, /\bux\b/i, /figma/i, /design\s*system/i, /wirefram/i, /prototyp/i],
  },
  {
    skill: 'Product Management',
    patterns: [/product\s*manag/i, /\bpm\b/i, /roadmap/i, /product\s*owner/i],
  },
  {
    skill: 'QA / Testing',
    patterns: [/\bqa\b/i, /quality\s*assurance/i, /test\s*automat/i, /selenium/i, /cypress/i, /playwright/i],
  },
  {
    skill: 'Cybersecurity',
    patterns: [/cyber\s*security/i, /infosec/i, /penetration/i, /security\s*engineer/i, /\bsoc\b/i],
  },
  {
    skill: 'Data Engineering',
    patterns: [/data\s*engineer/i, /etl/i, /spark/i, /airflow/i, /warehouse/i, /kafka/i],
  },
  {
    skill: 'HR Interview',
    patterns: [/\bhr\b/i, /human\s*resource/i, /recruit/i, /talent\s*acquis/i],
  },
  {
    skill: 'Behavioral Interview',
    patterns: [/behavioral/i, /soft\s*skill/i, /leadership/i, /communication/i],
  },
  {
    skill: 'DSA',
    patterns: [/\bdsa\b/i, /data\s*structure/i, /algorithm/i, /leetcode/i, /competitive\s*program/i],
  },
  {
    skill: 'System Design',
    patterns: [/system\s*design/i, /microservices/i, /scalability/i, /distributed\s*system/i, /architecture/i],
  },
];

function cleanText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function resolveFullName(profile: ProfileLike, fallbackName = ''): string {
  const fromTop = cleanText(profile.fullName);
  const fromPersonal = cleanText(profile.personalInfo?.fullName);
  const parts = [
    profile.personalInfo?.firstName,
    profile.personalInfo?.middleName,
    profile.personalInfo?.lastName,
  ]
    .map(cleanText)
    .filter(Boolean);
  return fromTop || fromPersonal || parts.join(' ') || cleanText(fallbackName);
}

function pickCurrentWork(profile: ProfileLike): WorkExperienceLike | null {
  const rows = Array.isArray(profile.workExperience) ? profile.workExperience : [];
  if (!rows.length) return null;
  const current = rows.find((row) => Boolean(row?.currentlyWorkHere));
  return current || rows[0] || null;
}

function estimateYearsFromWork(profile: ProfileLike): number {
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
  const years = (now - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
}

export function experienceBucketFromYears(years: number): string {
  if (years >= 8) return '8+ Years';
  if (years >= 5) return '5-8 Years';
  if (years >= 3) return '3-5 Years';
  if (years >= 1) return '1-3 Years';
  return '0-1 Years';
}

function collectSkillTexts(profile: ProfileLike): string[] {
  const texts: string[] = [];
  for (const skill of profile.skills || []) {
    if (skill?.name) texts.push(String(skill.name));
    if (skill?.category) texts.push(String(skill.category));
  }
  for (const job of profile.workExperience || []) {
    if (job?.jobTitle) texts.push(String(job.jobTitle));
    if (job?.keyResponsibilities) texts.push(String(job.keyResponsibilities));
    const workSkills = job?.workSkills;
    if (Array.isArray(workSkills)) texts.push(...workSkills.map(String));
    else if (typeof workSkills === 'string' && workSkills.trim()) texts.push(workSkills);
  }
  const prefs = profile.careerPreferences;
  const role = cleanText(prefs?.currentRole);
  if (role) texts.push(role);
  for (const title of prefs?.preferredJobTitles || []) {
    if (title) texts.push(String(title));
  }
  for (const title of prefs?.preferredRoles || []) {
    if (title) texts.push(String(title));
  }
  for (const area of prefs?.functionalAreas || []) {
    if (area) texts.push(String(area));
  }
  if (prefs?.functionalArea) texts.push(String(prefs.functionalArea));
  for (const industry of prefs?.preferredIndustries || []) {
    if (industry) texts.push(String(industry));
  }
  if (prefs?.preferredIndustry) texts.push(String(prefs.preferredIndustry));
  const summary = cleanText(profile.summaryText);
  if (summary) texts.push(summary);
  return texts;
}

function matchExpertiseAreas(profile: ProfileLike): InterviewerFormSkill[] {
  const blob = collectSkillTexts(profile).join(' · ');
  if (!blob.trim()) return [];
  const matched: InterviewerFormSkill[] = [];
  for (const entry of SKILL_KEYWORD_MAP) {
    if (entry.patterns.some((pattern) => pattern.test(blob))) {
      matched.push(entry.skill);
    }
  }
  // Exact chip name hits from skill list
  for (const skill of INTERVIEWER_FORM_SKILLS) {
    if (matched.includes(skill)) continue;
    if (new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(blob)) {
      matched.push(skill);
    }
  }
  return matched;
}

function inferInterviewTypes(expertise: InterviewerFormSkill[]): InterviewerFormType[] {
  const types = new Set<InterviewerFormType>(['Technical Interview', 'Mock Interview']);
  if (expertise.includes('DSA')) types.add('Coding Interview');
  if (expertise.includes('System Design')) types.add('System Design');
  if (expertise.includes('HR Interview')) types.add('HR Round');
  if (expertise.includes('Behavioral Interview')) types.add('Behavioral Round');
  if (expertise.includes('Product Management')) {
    types.add('Case Interview');
    types.add('Managerial Round');
  }
  if (expertise.includes('Frontend Development') || expertise.includes('Backend Development') || expertise.includes('Full Stack Development')) {
    types.add('Coding Interview');
  }
  return INTERVIEWER_FORM_TYPES.filter((type) => types.has(type));
}

function matchLanguages(profile: ProfileLike): InterviewerFormLanguage[] {
  const names = (profile.languages || [])
    .map((row) => cleanText(row?.name))
    .filter(Boolean);
  const matched = INTERVIEWER_FORM_LANGUAGES.filter((lang) =>
    names.some((name) => name.toLowerCase() === lang.toLowerCase() || name.toLowerCase().includes(lang.toLowerCase())),
  );
  return matched.length ? matched : names.length ? [] : ['English'];
}

/** Extra spoken languages from profile that are not in the default chip catalog. */
export function collectExtraProfileLanguages(profile: ProfileLike | null | undefined): string[] {
  if (!profile) return [];
  const catalog = new Set(INTERVIEWER_FORM_LANGUAGES.map((lang) => lang.toLowerCase()));
  const extras: string[] = [];
  const seen = new Set<string>();
  for (const row of profile.languages || []) {
    const name = cleanText(row?.name);
    if (!name) continue;
    const key = name.toLowerCase();
    if (catalog.has(key) || seen.has(key)) continue;
    // Skip proficiency-only or junk labels
    if (name.length < 2 || name.length > 40) continue;
    if (/^(native|fluent|basic|intermediate|advanced|beginner)$/i.test(name)) continue;
    seen.add(key);
    extras.push(name);
  }
  return extras;
}

export type InterviewerChipCatalog = {
  expertiseOptions: string[];
  interviewTypeOptions: string[];
  languageOptions: string[];
  suggestedExpertise: string[];
  suggestedInterviewTypes: string[];
  suggestedLanguages: string[];
  prefill: InterviewerFormPrefill | null;
};

/**
 * Build chip options + suggestions from this candidate's Phase 1 profile.
 * Options change per candidate; full catalog remains available after profile matches.
 */
export function resolveInterviewerChipsFromProfile(
  profile: ProfileLike | null | undefined,
  options?: { fallbackName?: string; selectedExpertise?: string[]; selectedTypes?: string[]; selectedLanguages?: string[] },
): InterviewerChipCatalog {
  const uniq = (values: string[]) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      const key = String(value || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(String(value).trim());
    }
    return out;
  };

  const prefill = buildInterviewerFormPrefillFromProfile(profile, {
    fallbackName: options?.fallbackName,
  });
  const extraLanguages = collectExtraProfileLanguages(profile);

  const suggestedExpertise = prefill?.expertiseAreas?.length
    ? [...prefill.expertiseAreas]
    : [];
  const suggestedInterviewTypes = prefill?.interviewTypes?.length
    ? [...prefill.interviewTypes]
    : ['Technical Interview', 'Mock Interview'];
  const suggestedLanguages = uniq([
    ...(prefill?.languages || []),
    ...extraLanguages,
  ]);
  if (!suggestedLanguages.length) suggestedLanguages.push('English');

  return {
    suggestedExpertise,
    suggestedInterviewTypes,
    suggestedLanguages,
    expertiseOptions: uniq([
      ...suggestedExpertise,
      ...(options?.selectedExpertise || []),
      ...INTERVIEWER_FORM_SKILLS,
    ]),
    interviewTypeOptions: uniq([
      ...suggestedInterviewTypes,
      ...(options?.selectedTypes || []),
      ...INTERVIEWER_FORM_TYPES,
    ]),
    languageOptions: uniq([
      ...suggestedLanguages,
      ...(options?.selectedLanguages || []),
      ...INTERVIEWER_FORM_LANGUAGES,
    ]),
    prefill,
  };
}

function buildAboutYourself(profile: ProfileLike, role: string, company: string, expertise: string[]): string {
  const summary = cleanText(profile.summaryText);
  if (summary.length >= 20) return summary.slice(0, 1000);

  const parts: string[] = [];
  if (role && company) {
    parts.push(`I am a ${role} at ${company}.`);
  } else if (role) {
    parts.push(`I work as a ${role}.`);
  } else if (company) {
    parts.push(`I currently work at ${company}.`);
  }
  if (expertise.length) {
    parts.push(`I can conduct interviews focused on ${expertise.slice(0, 4).join(', ')}.`);
  }
  parts.push('I help candidates prepare with structured questions, clear scoring, and practical feedback.');
  return parts.join(' ').slice(0, 1000);
}

function buildFeedbackStyle(expertise: string[], role: string): string {
  const focus = expertise.slice(0, 3).join(', ') || role || 'the target role';
  return [
    `I use a structured rubric covering fundamentals, problem-solving, and communication for ${focus}.`,
    'After each session I share strengths, gaps, and concrete next steps candidates can practice immediately.',
  ]
    .join(' ')
    .slice(0, 500);
}

export function buildInterviewerFormPrefillFromProfile(
  profile: ProfileLike | null | undefined,
  options?: { fallbackName?: string },
): InterviewerFormPrefill | null {
  if (!profile || typeof profile !== 'object') return null;

  const currentWork = pickCurrentWork(profile);
  const currentCompany = cleanText(currentWork?.companyName);
  const currentRole =
    cleanText(profile.careerPreferences?.currentRole) || cleanText(currentWork?.jobTitle);
  const years = estimateYearsFromWork(profile);
  const expertiseAreas = matchExpertiseAreas(profile);
  const interviewTypes = inferInterviewTypes(expertiseAreas);
  const languages = matchLanguages(profile);
  const aboutYourself = buildAboutYourself(profile, currentRole, currentCompany, expertiseAreas);
  const feedbackStyle = buildFeedbackStyle(expertiseAreas, currentRole);

  return {
    fullName: resolveFullName(profile, options?.fallbackName),
    currentCompany,
    currentRole,
    experienceBucket: experienceBucketFromYears(years),
    expertiseAreas,
    interviewTypes: interviewTypes.length ? interviewTypes : ['Technical Interview'],
    languages,
    aboutYourself,
    feedbackStyle,
  };
}
