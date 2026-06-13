export const JOB_CV_TAILOR_STORAGE_KEY = 'jobCvTailorContext';

export type JobCvTailorContext = {
  jobId: string;
  title: string;
  company: string;
  matchScore?: number;
  /** Profile-only match from the API before CV scoring — shown as secondary context in the editor. */
  profileMatchScore?: number;
  matchLabel?: string;
  confidenceTag?: string;
  reasoning?: string;
  matchedSkills: string[];
  missingSkills: string[];
  jdKeywords: string[];
  /** JD skill pool used for CV–JD scoring (stable across Explore Jobs and the tailor editor). */
  jdSkillPool: string[];
  skills: string[];
  requiredSkills: string[];
  description: string;
  experienceLevel?: string;
  savedAt: string;
};

type JobListingLike = {
  id: string | number;
  title?: string;
  company?: string;
  matchScore?: number;
  matchLabel?: string;
  confidenceTag?: string;
  reasoning?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  topMatchedSkills?: string[];
  topMissingSkills?: string[];
  skills?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  niceToHaveSkills?: string[];
  description?: string;
  jobOverview?: string;
  fullDescription?: string;
  experienceLevel?: string;
  skillGaps?: string[];
  strengths?: string[];
};

function uniqueTokens(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const token = String(raw || '').trim();
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out;
}

/** JD-side terms only — excludes CV-derived missing-skill overlays on tailor context. */
function collectJdKeywordsForScoring(ctx: JobCvTailorContext): string[] {
  return uniqueTokens([...ctx.requiredSkills, ...ctx.skills, ...ctx.jdKeywords]);
}

export function collectJdKeywords(ctx: JobCvTailorContext): string[] {
  return uniqueTokens([
    ...collectJdKeywordsForScoring(ctx),
    ...ctx.missingSkills,
  ]);
}

function collectJdSkillsFromJob(job: JobListingLike): string[] {
  return uniqueTokens([
    ...(job.requiredSkills || []),
    ...(job.skills || []),
    ...(job.preferredSkills || []),
    ...(job.niceToHaveSkills || []),
    ...(job.missingSkills || []),
    ...(job.topMissingSkills || []),
    ...(job.matchedSkills || []),
    ...(job.topMatchedSkills || []),
  ]);
}

function collectJdSkillPoolFromContext(ctx: JobCvTailorContext): string[] {
  if (ctx.jdSkillPool?.length) return ctx.jdSkillPool;
  return uniqueTokens([...collectJdKeywordsForScoring(ctx), ...ctx.matchedSkills, ...ctx.missingSkills]);
}

export function getMissingJdKeywords(ctx: JobCvTailorContext, draftText: string): string[] {
  const haystack = draftText.toLowerCase();
  return collectJdKeywords(ctx).filter((keyword) => !haystack.includes(keyword.toLowerCase()));
}

export function buildTailorSuggestions(ctx: JobCvTailorContext): string[] {
  const suggestions: string[] = [];
  if (ctx.missingSkills.length > 0) {
    suggestions.push(`Add JD keywords to skills: ${ctx.missingSkills.slice(0, 4).join(', ')}`);
  }
  if (ctx.reasoning?.trim()) {
    suggestions.push(ctx.reasoning.trim());
  }
  if (ctx.experienceLevel?.trim()) {
    suggestions.push(`Align experience bullets with "${ctx.experienceLevel}" expectations from the JD.`);
  }
  if (ctx.matchedSkills.length > 0) {
    suggestions.push(`Highlight matched strengths in your summary: ${ctx.matchedSkills.slice(0, 3).join(', ')}.`);
  }
  if (suggestions.length === 0) {
    suggestions.push('Tailor your summary and experience bullets to mirror the role language in the job description.');
  }
  return suggestions;
}

export function buildJobCvTailorContext(job: JobListingLike): JobCvTailorContext {
  const missingSkills = uniqueTokens([
    ...(job.missingSkills || []),
    ...(job.topMissingSkills || []),
    ...(job.skillGaps || []),
  ]);
  const matchedSkills = uniqueTokens([
    ...(job.matchedSkills || []),
    ...(job.topMatchedSkills || []),
    ...(job.strengths || []),
  ]);
  const skills = uniqueTokens(job.skills || []);
  const requiredSkills = uniqueTokens([
    ...(job.requiredSkills || []),
    ...(job.preferredSkills || []),
    ...(job.niceToHaveSkills || []),
  ]);
  const description = [
    job.description,
    job.jobOverview,
    job.fullDescription,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();

  const jdKeywords = uniqueTokens([...skills, ...requiredSkills]);
  const jdSkillPool = collectJdSkillsFromJob(job);

  return {
    jobId: String(job.id),
    title: String(job.title || '').trim() || 'Role',
    company: String(job.company || '').trim() || 'Company',
    matchScore: typeof job.matchScore === 'number' ? job.matchScore : undefined,
    matchLabel: job.matchLabel,
    confidenceTag: job.confidenceTag,
    reasoning: job.reasoning,
    matchedSkills,
    missingSkills,
    jdKeywords,
    jdSkillPool,
    skills,
    requiredSkills,
    description,
    experienceLevel: job.experienceLevel,
    savedAt: new Date().toISOString(),
  };
}

export function saveJobCvTailorContext(ctx: JobCvTailorContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(JOB_CV_TAILOR_STORAGE_KEY, JSON.stringify(ctx));
  sessionStorage.setItem(`jobCvTailorDraft:${ctx.jobId}`, JSON.stringify({ linkedAt: ctx.savedAt }));
}

export function loadJobCvTailorContext(jobId?: string | null): JobCvTailorContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(JOB_CV_TAILOR_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as JobCvTailorContext;
    if (!parsed?.jobId) return null;
    if (jobId && String(parsed.jobId) !== String(jobId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearJobCvTailorContext(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(JOB_CV_TAILOR_STORAGE_KEY);
}

type ResumeExperienceLike = {
  id: string;
  company: string;
  role: string;
  duration: string;
  bullets: string;
};

type ResumeEducationLike = {
  id: string;
  institution: string;
  degree: string;
  duration: string;
};

export type CvResumeSections = {
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: string;
  experience: ResumeExperienceLike[];
  education?: ResumeEducationLike[];
};

type ResumeSectionsLike = CvResumeSections;

function appendSkillTokens(current: string, keywords: string[]): string {
  const haystack = current.toLowerCase();
  const toAdd = keywords.filter((keyword) => !haystack.includes(keyword.toLowerCase()));
  if (!toAdd.length) return current;
  return current.trim() ? `${current.trim()}, ${toAdd.join(', ')}` : toAdd.join(', ');
}

const TAILOR_INLINE_BLOCK_PATTERNS = [
  /Role alignment:[^.]*\./gi,
  /Seeking to contribute as[^.]*\./gi,
  /Seeking the [^.]* opportunity at[^.]*\./gi,
  /Targeting\s+[^.]+\s+at\s+[^.]+\./gi,
  /Core strengths:[^.]*\./gi,
  /Building alignment with[^.]*\./gi,
  /Building depth in[^.]*\./gi,
  /Proven expertise in[^.]*\./gi,
  /Experience aligned with[^.]*\./gi,
  /Highlights include[^.]*\./gi,
  /Aligned with [^.]* requirements\./gi,
];

/** Remove prior auto-tailor appendages so we rewrite from the original summary. */
export function stripPriorTailorBlocks(summary: string): string {
  const tailorBlockStart =
    /^(Targeting\s+|Role alignment:|Core strengths:|Building alignment with|Building depth in|Proven expertise in|Experience aligned with|Ready to contribute as|Highlights include|Seeking to contribute|Aligned with)/i;

  const paragraphs = summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !tailorBlockStart.test(p));

  let text = paragraphs.join(' ').trim();
  for (const pattern of TAILOR_INLINE_BLOCK_PATTERNS) {
    text = text.replace(pattern, '');
  }

  text = dedupeRepeatedOpeningPhrase(text);
  return text.replace(/\s+/g, ' ').replace(/\.{2,}/g, '.').trim();
}

/** Collapse repeated "Role with X yrs" openings left by multiple tailor passes. */
function dedupeRepeatedOpeningPhrase(text: string): string {
  const match = text.match(/^(.{8,90}?\s+with\s+[\d–\-+]+\s*(?:yrs?|years?))\s+/i);
  if (!match?.[1]) return text;
  const prefix = match[1].trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`^(?:${escaped}\\s*)+`, 'i'), `${prefix} `);
}

export function sanitizeTailoredSummary(summary: string): string {
  return stripPriorTailorBlocks(summary);
}

function extractExperiencePhrase(text: string, ctx: JobCvTailorContext): string {
  const plusYears = text.match(/(\d+)\+\s*years?/i);
  if (plusYears) return `${plusYears[1]}+ years`;
  const plainYears = text.match(/(\d+)\s*years?/i);
  if (plainYears) return `${plainYears[1]} years`;
  if (ctx.experienceLevel?.trim()) return ctx.experienceLevel.trim();
  return '4+ years';
}

/** Rewrite the original professional summary in place for the target JD (no appended duplicate blocks). */
export function tailorSummaryForJob(ctx: JobCvTailorContext, existing: string): string {
  const base = stripPriorTailorBlocks(existing);
  const role = ctx.title.trim() || 'this role';
  const company = ctx.company.trim() || 'the company';
  const matched = ctx.matchedSkills.slice(0, 4);
  const missing = ctx.missingSkills.slice(0, 4);
  const years = extractExperiencePhrase(base, ctx);
  const isFrontendRole = /front/i.test(role);
  const roleFocus = isFrontendRole ? 'Frontend engineer' : role;

  if (!base) {
    const matchedText = matched.length ? `Skilled in ${matched.join(', ')}` : 'Strong technical background';
    const missingText = missing.length ? ` and developing ${missing.join(', ')}` : '';
    return `${roleFocus} with ${years} of experience. ${matchedText}${missingText}. Seeking the ${role} opportunity at ${company}.`;
  }

  const sentences = base
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (s) =>
        !/^Targeting\s+/i.test(s) &&
        !/^Role alignment:/i.test(s) &&
        !/Core strengths:|Building alignment|Building depth|Proven expertise|Experience aligned|Highlights include|Seeking to contribute|Aligned with/i.test(
          s,
        ),
    );

  const coreSentences = sentences.slice(0, 3);
  let body =
    coreSentences.length > 0
      ? coreSentences.join(' ')
      : `${roleFocus} with ${years} of experience delivering modern web applications`;

  body = body
    .replace(/full[- ]?stack\s+software\s+engineer/gi, roleFocus)
    .replace(/senior\s+software\s+engineer/gi, roleFocus)
    .replace(/\s*seeking\s+senior\s+engineering\s+roles[^.]*\.?/gi, '')
    .trim();

  if (isFrontendRole && /full[- ]?stack|node\.?js|postgresql|mongodb|ci\/cd/i.test(body)) {
    body = `${roleFocus} with ${years} of experience building scalable web applications with React, JavaScript, and modern front-end tooling`;
  } else if (!/\d+\+?\s*(?:yrs?|years?)/i.test(body) && !body.toLowerCase().startsWith(roleFocus.toLowerCase())) {
    body = `${roleFocus} with ${years} of experience. ${body.charAt(0).toUpperCase()}${body.slice(1)}`;
  }

  const skillPhrase = matched.length
    ? `Core expertise includes ${matched.join(', ')}`
    : 'Strong technical background with a focus on quality delivery';
  const growthPhrase =
    missing.length > 0
      ? `, with ongoing development in ${missing.slice(0, 3).join(', ')}`
      : '';

  const closing = `Interested in the ${role} role at ${company}`;

  return [body.replace(/\.$/, ''), `${skillPhrase}${growthPhrase}`, closing]
    .filter(Boolean)
    .map((p) => p.trim())
    .map((p) => (p.endsWith('.') ? p : `${p}.`))
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function tailorPrimaryExperience(
  experience: ResumeExperienceLike[],
  ctx: JobCvTailorContext,
): ResumeExperienceLike[] {
  if (!experience.length) return experience;

  const keywords = uniqueTokens([
    ...ctx.matchedSkills.slice(0, 3),
    ...ctx.missingSkills.slice(0, 3),
    ...ctx.requiredSkills.slice(0, 2),
  ]);
  if (!keywords.length) return experience;

  const marker = `aligned with ${ctx.title}`.toLowerCase();
  const bullet = `• Delivered production work using ${keywords.join(', ')} aligned with ${ctx.title} responsibilities at ${ctx.company}.`;

  return experience.map((entry, index) => {
    if (index !== 0) return entry;
    const bullets = entry.bullets.trim();
    if (bullets.toLowerCase().includes(marker)) return entry;
    return {
      ...entry,
      bullets: bullets ? `${bullets}\n${bullet}` : bullet,
    };
  });
}

export type JobTailorApplyResult = {
  updates: Partial<ResumeSectionsLike>;
  appliedItems: string[];
};

export function applyJobTailorSuggestions(
  ctx: JobCvTailorContext,
  sections: ResumeSectionsLike,
  options?: { summaryOverride?: string },
): JobTailorApplyResult {
  const appliedItems: string[] = [];
  const draftText = [
    sections.summary,
    sections.skills,
    sections.basics.headline,
    ...sections.experience.map((entry) => `${entry.role} ${entry.bullets}`),
  ]
    .join('\n')
    .toLowerCase();

  const updates: Partial<ResumeSectionsLike> = {};
  const missingKw = getMissingJdKeywords(ctx, draftText);

  if (ctx.title && sections.basics.headline.trim().toLowerCase() !== ctx.title.trim().toLowerCase()) {
    updates.basics = { ...sections.basics, headline: ctx.title };
    appliedItems.push(`Headline → ${ctx.title}`);
  }

  if (missingKw.length > 0) {
    const nextSkills = appendSkillTokens(sections.skills, missingKw);
    if (nextSkills !== sections.skills) {
      updates.skills = nextSkills;
      appliedItems.push(`Skills: ${missingKw.slice(0, 6).join(', ')}`);
    }
  }

  const nextSummary =
    options?.summaryOverride?.trim() ||
    tailorSummaryForJob(ctx, sanitizeTailoredSummary(sections.summary));
  if (nextSummary.trim() && nextSummary !== sections.summary) {
    updates.summary = nextSummary.trim();
    appliedItems.push('Summary tailored to JD');
  }

  const nextExperience = tailorPrimaryExperience(sections.experience, ctx);
  if (JSON.stringify(nextExperience) !== JSON.stringify(sections.experience)) {
    updates.experience = nextExperience;
    appliedItems.push('Experience bullet updated for role fit');
  }

  return { updates, appliedItems };
}

export type CvJdMatchBreakdown = {
  score: number;
  keywordCoverage: number;
  matchedSkillsCoverage: number;
  headlineAligned: boolean;
  summaryAligned: boolean;
  missingKeywordCount: number;
  totalJdKeywords: number;
  fitLabel: 'strong' | 'good' | 'weak';
};

function scoreToFitLabel(score: number): CvJdMatchBreakdown['fitLabel'] {
  if (score >= 80) return 'strong';
  if (score >= 55) return 'good';
  return 'weak';
}

export function normalizeResumeDraftToSections(draft: Record<string, unknown> | null | undefined): CvResumeSections {
  const basics = (draft?.basics as CvResumeSections['basics']) || {
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
  };
  const skillsRaw = draft?.skills;
  return {
    basics,
    summary:
      (typeof draft?.summary === 'string' ? draft.summary : '') ||
      (typeof basics.summary === 'string' ? basics.summary : ''),
    skills: Array.isArray(skillsRaw)
      ? skillsRaw.map((s) => String(s)).join(', ')
      : typeof skillsRaw === 'string'
        ? skillsRaw
        : '',
    experience: Array.isArray(draft?.experience)
      ? (draft.experience as ResumeExperienceLike[])
      : [],
    education: Array.isArray(draft?.education)
      ? (draft.education as ResumeEducationLike[])
      : [],
  };
}

export function buildCvTextFromSections(sections: CvResumeSections): string {
  return [
    sections.summary,
    sections.skills,
    sections.basics.headline,
    sections.basics.name,
    ...sections.experience.map((entry) => `${entry.role} ${entry.company} ${entry.bullets}`),
    ...(sections.education || []).map(
      (entry) => `${entry.degree} ${entry.institution} ${entry.duration}`,
    ),
  ]
    .join('\n')
    .trim();
}

export function resumeSectionsHaveContent(sections: CvResumeSections | null | undefined): boolean {
  if (!sections) return false;
  return buildCvTextFromSections(sections).replace(/\s/g, '').length > 80;
}

export function htmlResumeToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

export function confidenceTagFromCvScore(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Good Match';
  if (score >= 35) return 'Partial Match';
  return 'Gap Identified';
}

export type ExploreJobCvMatchResult = {
  matchScore: number;
  confidenceTag: string;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  scoreColorHint: 'high' | 'medium' | 'low';
};

function buildCvMatchReasoning(
  title: string,
  matchedSkills: string[],
  missingSkills: string[],
  score: number,
): string {
  if (score >= 80) {
    return `Your CV strongly aligns with ${title} through ${
      matchedSkills.slice(0, 4).join(', ') || 'core role keywords'
    }.`;
  }
  if (missingSkills.length > 0) {
    const missing = missingSkills.slice(0, 4).join(', ');
    const matched = matchedSkills.slice(0, 3).join(', ');
    return matched
      ? `Your CV mentions ${matched}, but is missing ${missing} called out in this job description.`
      : `Your CV is missing key terms for this role: ${missing}.`;
  }
  return 'Your CV shows moderate alignment with this role based on keyword and skills coverage.';
}

/** Explore Jobs: score a listing from the candidate's saved CV draft, not profile-only signals. */
export function computeExploreJobCvMatch(
  job: JobListingLike,
  sections: CvResumeSections,
): ExploreJobCvMatchResult {
  const ctx = buildJobCvTailorContext(job);
  const breakdown = computeCvJdMatchScore(ctx, sections);
  const cvText = buildCvTextFromSections(sections).toLowerCase();
  const skillPool = ctx.jdSkillPool.length ? ctx.jdSkillPool : collectJdKeywordsForScoring(ctx);
  const matchedSkills = skillPool.filter((skill) => cvText.includes(skill.toLowerCase()));
  const missingSkills = skillPool.filter((skill) => !cvText.includes(skill.toLowerCase()));
  const score = breakdown.score;
  const scoreColorHint: ExploreJobCvMatchResult['scoreColorHint'] =
    score >= 85 ? 'high' : score >= 55 ? 'medium' : 'low';

  return {
    matchScore: score,
    confidenceTag: confidenceTagFromCvScore(score),
    matchedSkills,
    missingSkills,
    reasoning: buildCvMatchReasoning(ctx.title, matchedSkills, missingSkills, score),
    scoreColorHint,
  };
}

/** Live CV vs JD alignment score — updates as the user edits the draft. */
export function computeCvJdMatchScore(
  ctx: JobCvTailorContext,
  sections: ResumeSectionsLike,
): CvJdMatchBreakdown {
  const draftText = [
    sections.summary,
    sections.skills,
    sections.basics.headline,
    sections.basics.name,
    ...sections.experience.map((entry) => `${entry.role} ${entry.company} ${entry.bullets}`),
  ]
    .join('\n')
    .toLowerCase();

  const jdKeywords = collectJdKeywordsForScoring(ctx);
  const totalJdKeywords = jdKeywords.length || 1;
  const missingKw = jdKeywords.filter((keyword) => !draftText.includes(keyword.toLowerCase()));
  const keywordCoverage = Math.round(((totalJdKeywords - missingKw.length) / totalJdKeywords) * 100);

  const skillPool = collectJdSkillPoolFromContext(ctx);
  const pool = skillPool.length ? skillPool : jdKeywords;
  const matchedInPool = pool.filter((skill) => draftText.includes(skill.toLowerCase()));
  const missingFromPool = pool.filter((skill) => !draftText.includes(skill.toLowerCase()));
  const matchedSkillsCoverage = pool.length
    ? Math.round((matchedInPool.length / pool.length) * 100)
    : keywordCoverage;

  const titleToken = ctx.title.trim().toLowerCase().split(/\s+/)[0] || '';
  const headlineAligned =
    Boolean(titleToken) &&
    sections.basics.headline.trim().toLowerCase().includes(titleToken);

  const companyToken = ctx.company.trim().toLowerCase();
  const summaryAligned =
    (Boolean(titleToken) && sections.summary.toLowerCase().includes(titleToken)) ||
    (Boolean(companyToken) && sections.summary.toLowerCase().includes(companyToken));

  const gapPenalty = pool.length
    ? Math.min(25, Math.round((missingFromPool.length / pool.length) * 25))
    : Math.min(25, missingKw.length * 6);

  const rawScore =
    keywordCoverage * 0.4 +
    matchedSkillsCoverage * 0.3 +
    (headlineAligned ? 12 : 0) +
    (summaryAligned ? 12 : 0) +
    (sections.experience.some((e) => e.bullets.toLowerCase().includes(ctx.title.toLowerCase().split(' ')[0] || ''))
      ? 6
      : 0);

  const score = Math.max(0, Math.min(100, Math.round(rawScore - gapPenalty)));

  return {
    score,
    keywordCoverage,
    matchedSkillsCoverage,
    headlineAligned,
    summaryAligned,
    missingKeywordCount: missingKw.length,
    totalJdKeywords,
    fitLabel: scoreToFitLabel(score),
  };
}
