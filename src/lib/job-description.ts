/** Parse CRM / rich-text job descriptions for Phase 1 job detail UI. */

export type ParsedJobDescription = {
  summary: string
  responsibilities: string[]
  requiredSkills: string[]
  preferredQualifications: string[]
  candidateRequirements: string[]
  benefits: string[]
  location: string
  expectedSalary: string
  employmentType: string
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
}

export function looksLikeHtmlJobDescription(raw?: string | null): boolean {
  if (!raw) return false
  return /<[a-z][\s\S]*?>/i.test(raw)
}

export function stripJobDescriptionHtml(raw?: string | null): string {
  if (!raw) return ''
  let text = String(raw)
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<li[^>]*>/gi, '• ')
  text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n\n')
  text = text.replace(/<hr[^>]*>/gi, '\n\n')
  text = text.replace(/<[^>]+>/g, ' ')
  text = decodeHtmlEntities(text)
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n[ \t]+/g, '\n')
  text = text.replace(/[ \t]{2,}/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

export function toPlainJobText(raw?: string | null): string {
  if (!raw) return ''
  const value = String(raw).trim()
  if (!value) return ''
  return looksLikeHtmlJobDescription(value) ? stripJobDescriptionHtml(value) : decodeHtmlEntities(value)
}

function splitTextPoints(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(/\n|•|;/)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .map((line) => decodeHtmlEntities(line))
    .filter(Boolean)
}

function extractSection(text: string, start: string, ends: string[]) {
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const endPattern = ends.length
    ? `(?=\\b(?:${ends.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b|$)`
    : '$'
  const regex = new RegExp(`\\b${escapedStart}\\b[:\\s–-]*([\\s\\S]*?)${endPattern}`, 'i')
  const match = text.match(regex)
  return match?.[1]?.trim() || ''
}

function extractAnySection(text: string, starts: string[], ends: string[]) {
  for (const start of starts) {
    const block = extractSection(text, start, ends)
    if (block) return block
  }
  return ''
}

const BEFORE_RESP = [
  'Key Responsibilities',
  'Responsibilities',
  'Required Skills',
  'Requirements',
  'Preferred Qualifications',
  'Candidate Requirements',
  'Benefits',
  'Education',
  'Qualifications',
]

const BEFORE_SKILLS = [
  'Preferred Qualifications',
  'Candidate Requirements',
  'Benefits',
  'Education',
  'Qualifications and Experience',
  'Qualifications',
]

const BEFORE_PREFERRED = ['Candidate Requirements', 'Benefits', 'Education', 'Compensation']

export function parseStructuredJobText(rawText?: string | null): ParsedJobDescription {
  const text = toPlainJobText(rawText)
  if (!text) {
    return {
      summary: '',
      responsibilities: [],
      requiredSkills: [],
      preferredQualifications: [],
      candidateRequirements: [],
      benefits: [],
      location: '',
      expectedSalary: '',
      employmentType: '',
    }
  }

  const summary =
    extractAnySection(text, ['Job Overview', 'Overview', 'Job Summary', 'About the Role'], BEFORE_RESP) ||
    ''

  const responsibilitiesBlock = extractAnySection(
    text,
    ['Key Responsibilities', 'Responsibilities'],
    ['Required Skills', 'Requirements', 'Preferred Qualifications', 'Candidate Requirements', 'Benefits', 'Education']
  )

  const requiredSkillsBlock = extractAnySection(
    text,
    ['Required Skills', 'Requirements'],
    BEFORE_PREFERRED
  )

  const preferredBlock = extractAnySection(
    text,
    ['Preferred Qualifications', 'Preferred Qualification'],
    ['Candidate Requirements', 'Benefits', 'Education']
  )

  const candidateReqBlock = extractAnySection(
    text,
    ['Candidate Requirements'],
    ['Benefits', 'Education', 'Compensation']
  )

  const requirementsBlock = extractAnySection(
    text,
    ['Qualifications and Experience', 'Qualifications'],
    ['Preferred Qualifications', 'Benefits', 'Education']
  )

  const benefitsBlock = extractAnySection(text, ['Benefits', 'Compensation & Benefits'], ['Education'])

  const locationMatch = text.match(/Location\s*:\s*([^\n]+)/i)
  const salaryMatch = text.match(/(?:Expected\s+Salary|Salary|Compensation)\s*:\s*([^\n]+)/i)
  const typeMatch = text.match(/Employment\s+Type\s*:\s*([^\n]+)/i)

  const requiredSkills = [
    ...splitTextPoints(requiredSkillsBlock),
    ...splitTextPoints(requirementsBlock),
  ]

  return {
    summary: summary.trim(),
    responsibilities: splitTextPoints(responsibilitiesBlock),
    requiredSkills: [...new Set(requiredSkills)],
    preferredQualifications: splitTextPoints(preferredBlock),
    candidateRequirements: splitTextPoints(candidateReqBlock),
    benefits: splitTextPoints(benefitsBlock),
    location: locationMatch?.[1]?.trim() || '',
    expectedSalary: salaryMatch?.[1]?.trim() || '',
    employmentType: typeMatch?.[1]?.trim() || '',
  }
}

function resolveScalarOverviewField(
  raw: string | null | undefined,
  parsed: ParsedJobDescription
): string {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (!trimmed) return ''
  if (looksLikeHtmlJobDescription(trimmed)) {
    return parsed.summary.trim()
  }
  return toPlainJobText(trimmed)
}

export function resolveJobSummaryText(
  fields: {
    overview?: string | null
    aboutRole?: string | null
    description?: string | null
    jobDescription?: string | null
    jobSummary?: string | null
    jobDescriptionHtml?: string | null
  },
  parsed: ParsedJobDescription
): string {
  const fromScalar = [fields.overview, fields.aboutRole, fields.jobSummary]
    .map((v) => resolveScalarOverviewField(v, parsed))
    .find((v) => v.length > 0)

  if (fromScalar) return fromScalar
  if (parsed.summary) return parsed.summary

  const raw =
    fields.description || fields.jobDescription || fields.jobDescriptionHtml || ''
  const plain = toPlainJobText(raw)
  if (!plain) return 'No description available.'
  if (looksLikeHtmlJobDescription(raw)) {
    return parsed.summary || 'No job summary available.'
  }
  if (parsed.summary && /\b(?:Key Responsibilities|Required Skills)\b/i.test(plain)) {
    return parsed.summary
  }
  return plain
}

/** Paragraphs for the Job Summary section on explore-jobs detail. */
export function jobSummaryDisplayParagraphs(job: {
  description?: string | null
  companyOverview?: string | null
  jobOverview?: string | null
}): string[] {
  const overview =
    toPlainJobText(job.jobOverview) ||
    toPlainJobText(job.companyOverview) ||
    toPlainJobText(job.description) ||
    ''

  if (!overview) return []

  if (looksLikeHtmlJobDescription(overview)) {
    const parsed = parseStructuredJobText(overview)
    return summaryParagraphs(parsed.summary || 'No job summary available.')
  }

  if (/\b(?:Key Responsibilities|Required Skills)\b/i.test(overview)) {
    const parsed = parseStructuredJobText(overview)
    if (parsed.summary) return summaryParagraphs(parsed.summary)
  }

  return summaryParagraphs(overview)
}

export function summaryParagraphs(summary: string): string[] {
  return summary
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^job overview$/i.test(p))
}
