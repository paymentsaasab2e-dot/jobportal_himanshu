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
  const overviewText =
    [fields.overview, fields.aboutRole, fields.jobSummary]
      .map((v) => resolveScalarOverviewField(v, parsed))
      .find((v) => v.length > 0) || ''

  const rawDescription =
    fields.description || fields.jobDescription || fields.jobDescriptionHtml || ''
  const descriptionPlain = toPlainJobText(rawDescription)

  if (descriptionPlain) {
    const structuredDescription =
      looksLikeHtmlJobDescription(rawDescription) ||
      /\b(?:Key Responsibilities|Required Skills|Qualifications and Experience)\b/i.test(
        descriptionPlain,
      )
    if (structuredDescription && parsed.summary) {
      return parsed.summary
    }
    // CRM stores a short overview plus a fuller job description — prefer the fuller body on the portal.
    if (!overviewText || descriptionPlain.length > overviewText.length + 15) {
      return descriptionPlain
    }
  }

  if (overviewText) return overviewText
  if (parsed.summary) return parsed.summary
  if (!descriptionPlain) return 'No description available.'
  return descriptionPlain
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

export type JobDescriptionSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets: string[]
}

const PLAIN_SECTION_HEADERS: Array<{ id: string; title: string; patterns: RegExp[] }> = [
  { id: 'overview', title: 'Overview', patterns: [/^overview$/i, /^about the role$/i, /^job overview$/i] },
  {
    id: 'key-responsibilities',
    title: 'Key Responsibilities',
    patterns: [/^key responsibilities$/i, /^responsibilities$/i, /^role & responsibilities$/i],
  },
  {
    id: 'skills',
    title: 'Skills',
    patterns: [/^skills$/i, /^key skills$/i, /^required skills$/i],
  },
  {
    id: 'requirements',
    title: 'Requirements',
    patterns: [/^requirements$/i, /^qualifications and experience$/i],
  },
  {
    id: 'preferred-qualifications',
    title: 'Preferred Qualifications',
    patterns: [/^preferred qualifications?$/i, /^preferred education/i],
  },
  {
    id: 'candidate-requirements',
    title: 'Candidate Requirements',
    patterns: [/^candidate requirements?$/i],
  },
  {
    id: 'benefits',
    title: 'Benefits',
    patterns: [/^benefits$/i, /^compensation & benefits$/i, /^compensation$/i],
  },
  { id: 'job-summary', title: 'Job Summary', patterns: [/^job summary$/i] },
]

function normalizeSectionHeader(line: string): string {
  return line.replace(/[:：]\s*$/, '').trim()
}

function isSectionHeaderLine(line: string): (typeof PLAIN_SECTION_HEADERS)[number] | null {
  const normalized = normalizeSectionHeader(line)
  if (!normalized) return null
  for (const section of PLAIN_SECTION_HEADERS) {
    if (section.patterns.some((p) => p.test(normalized))) return section
  }
  return null
}

function bulletsFromBlock(block: string): string[] {
  return splitTextPoints(
    block
      .split('\n')
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .join('\n'),
  )
}

function paragraphsFromBlock(block: string): string[] {
  const bullets = bulletsFromBlock(block)
  if (bullets.length >= 2 && bullets.every((b) => b.length < 220)) {
    return []
  }
  return block
    .split(/\n{2,}/)
    .flatMap((chunk) => chunk.split('\n'))
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^[-*•]\s/.test(p))
}

function finalizeSectionBody(
  body: string,
  options?: { preferParagraphs?: boolean },
): Pick<JobDescriptionSection, 'paragraphs' | 'bullets'> {
  const trimmed = body.trim()
  if (!trimmed) return { paragraphs: [], bullets: [] }

  if (options?.preferParagraphs) {
    const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)
    if (lines.length <= 1) return { paragraphs: [trimmed], bullets: [] }
    return { paragraphs: lines, bullets: [] }
  }

  const bullets = bulletsFromBlock(trimmed)
  const paragraphs = paragraphsFromBlock(trimmed)
  if (bullets.length >= 2 && paragraphs.length <= 1) {
    return { paragraphs: paragraphs.length ? paragraphs : [], bullets }
  }
  if (paragraphs.length) return { paragraphs, bullets: [] }
  return { paragraphs: [trimmed], bullets: [] }
}

function parsePlainJobDescriptionSections(text: string): JobDescriptionSection[] {
  const lines = text.split('\n')
  const sections: JobDescriptionSection[] = []
  const introLines: string[] = []
  let current: JobDescriptionSection | null = null
  let bodyLines: string[] = []

  const flushCurrent = () => {
    if (!current) return
    const body = bodyLines.join('\n')
    const { paragraphs, bullets } = finalizeSectionBody(body)
    if (paragraphs.length || bullets.length) {
      sections.push({ ...current, paragraphs, bullets })
    }
    current = null
    bodyLines = []
  }

  for (const line of lines) {
    const header = isSectionHeaderLine(line)
    if (header) {
      flushCurrent()
      current = { id: header.id, title: header.title, paragraphs: [], bullets: [] }
      continue
    }
    if (current) {
      bodyLines.push(line)
    } else if (!/^job description$/i.test(normalizeSectionHeader(line))) {
      introLines.push(line)
    }
  }
  flushCurrent()

  const introText = introLines.join('\n').trim()
  if (introText) {
    const { paragraphs, bullets } = finalizeSectionBody(introText, { preferParagraphs: true })
    if (paragraphs.length || bullets.length) {
      sections.unshift({
        id: 'intro',
        title: 'About this role',
        paragraphs,
        bullets,
      })
    }
  }

  return sections
}

function parseHtmlJobDescriptionSections(html: string): JobDescriptionSection[] {
  if (typeof DOMParser === 'undefined') {
    return parsePlainJobDescriptionSections(stripJobDescriptionHtml(html))
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const sections: JobDescriptionSection[] = []
  let current: JobDescriptionSection | null = null
  let introParts: string[] = []

  const flush = () => {
    if (!current) return
    sections.push(current)
    current = null
  }

  const isHeading = (el: Element) => /^H[1-3]$/i.test(el.tagName)

  const matchHeader = (text: string) => {
    const line = normalizeSectionHeader(text)
    for (const def of PLAIN_SECTION_HEADERS) {
      if (def.patterns.some((p) => p.test(line))) return def
    }
    if (/^job description$/i.test(line)) return null
    return null
  }

  const walk = (nodes: NodeListOf<ChildNode>) => {
    for (const node of Array.from(nodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      const el = node as HTMLElement
      if (isHeading(el)) {
        const def = matchHeader(el.textContent || '')
        if (def) {
          flush()
          current = { id: def.id, title: def.title, paragraphs: [], bullets: [] }
          continue
        }
      }

      const tag = el.tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => toPlainJobText(li.innerHTML))
          .filter(Boolean)
        if (current) {
          current.bullets.push(...items)
        } else if (items.length) {
          introParts.push(items.join('\n'))
        }
        continue
      }

      const text = toPlainJobText(el.innerHTML)
      if (!text) continue

      if (current) {
        if (tag === 'p' || tag === 'div') current.paragraphs.push(text)
        else current.paragraphs.push(text)
      } else {
        introParts.push(text)
      }
    }
  }

  walk(doc.body.childNodes)
  flush()

  const introText = introParts.join('\n\n').trim()
  if (introText) {
    const { paragraphs, bullets } = finalizeSectionBody(introText, { preferParagraphs: true })
    sections.unshift({
      id: 'intro',
      title: 'About this role',
      paragraphs,
      bullets,
    })
  }

  return sections.filter((s) => s.paragraphs.length > 0 || s.bullets.length > 0)
}

/** Split CRM HTML or plain job description into titled sections for Phase 1 detail UI. */
export function parseJobDescriptionSections(raw?: string | null): JobDescriptionSection[] {
  const value = String(raw || '').trim()
  if (!value) return []
  if (looksLikeHtmlJobDescription(value)) {
    return parseHtmlJobDescriptionSections(value)
  }
  return parsePlainJobDescriptionSections(toPlainJobText(value))
}

function mergeSectionBullets(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming].map((s) => s.trim()).filter(Boolean))]
}

/** Merge API array fields into parsed description sections (API wins on duplicates). */
export function buildJobDescriptionSections(
  rawDescription: string | null | undefined,
  arrays: {
    responsibilities?: string[]
    preferredQualifications?: string[]
    candidateRequirements?: string[]
    benefits?: string[]
  },
): JobDescriptionSection[] {
  const parsed = parseJobDescriptionSections(rawDescription)
  const byId = new Map(parsed.map((s) => [s.id, { ...s }]))

  const upsert = (id: string, title: string, bullets: string[]) => {
    if (!bullets.length) return
    const existing = byId.get(id)
    if (existing) {
      existing.bullets = mergeSectionBullets(existing.bullets, bullets)
    } else {
      byId.set(id, { id, title, paragraphs: [], bullets })
    }
  }

  upsert('key-responsibilities', 'Key Responsibilities', arrays.responsibilities || [])
  upsert('preferred-qualifications', 'Preferred Qualifications', arrays.preferredQualifications || [])
  upsert('candidate-requirements', 'Candidate Requirements', arrays.candidateRequirements || [])
  upsert('benefits', 'Benefits', arrays.benefits || [])

  const order = [
    'intro',
    'job-summary',
    'overview',
    'key-responsibilities',
    'requirements',
    'preferred-qualifications',
    'candidate-requirements',
    'benefits',
  ]

  const ordered: JobDescriptionSection[] = []
  for (const id of order) {
    const section = byId.get(id)
    if (section && (section.paragraphs.length || section.bullets.length)) {
      ordered.push(section)
    }
    byId.delete(id)
  }
  for (const section of byId.values()) {
    if (section.paragraphs.length || section.bullets.length) ordered.push(section)
  }
  return ordered
}

export function sectionVisibleOnPortal(
  sectionId: string,
  show: (field: import('@/lib/job-public-field-visibility').JobPublicVisibilityField) => boolean,
): boolean {
  switch (sectionId) {
    case 'intro':
    case 'overview':
    case 'job-summary':
      return show('jobDescription')
    case 'key-responsibilities':
      return show('keyResponsibilities')
    case 'skills':
      return show('skills')
    case 'requirements':
    case 'preferred-qualifications':
      return show('qualifications')
    case 'candidate-requirements':
      return show('candidateRequirements')
    case 'benefits':
      return show('jobDescription')
    default:
      return show('jobDescription')
  }
}
