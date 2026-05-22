/** Map backend1 / personalized job API rows into Phase 1 listing fields. */

export type JobLanguageRow = {
  language: string
  proficiency: string
}

export type PortalJobMeta = {
  nationality?: string
  priority?: string
  openings?: number
  state?: string
  country?: string
  city?: string
  industryType?: string
  employmentType?: string
  targetHireDate?: string
  jdFileName?: string
  experienceMin?: number | null
  experienceMax?: number | null
  experienceDisplay?: string | null
  salaryCurrency?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryType?: string | null
  languages?: JobLanguageRow[]
  videoMediaLink?: string
  forecastRevenue?: string
  contactPerson?: string
  fullDescription?: string
}

function formatEmploymentTypeLabel(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

function formatDisplayDate(value: unknown): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return asString(value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function parseLanguages(raw: unknown): JobLanguageRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const language = asString((row as { language?: string; name?: string }).language || (row as { name?: string }).name)
      const proficiency = asString((row as { proficiency?: string; level?: string }).proficiency || (row as { level?: string }).level)
      if (!language) return null
      return { language, proficiency: proficiency || '—' }
    })
    .filter((r): r is JobLanguageRow => Boolean(r))
}

function parseExperienceFromApi(job: Record<string, unknown>) {
  const min = typeof job.experienceMin === 'number' ? job.experienceMin : null
  const max = typeof job.experienceMax === 'number' ? job.experienceMax : null
  if (min != null || max != null) {
    return {
      min,
      max,
      display:
        min != null && max != null
          ? `${min} – ${max} years`
          : min != null
            ? `${min}+ years`
            : max != null
              ? `Up to ${max} years`
              : null,
    }
  }
  const raw = asString(job.experienceRequired || job.experienceLevel || job.experienceDisplay)
  if (!raw) return { min: null, max: null, display: null }
  const range = raw.match(/^(\d+)\s*-\s*(\d+)$/)
  if (range) {
    return {
      min: Number(range[1]),
      max: Number(range[2]),
      display: `${range[1]} – ${range[2]} years`,
    }
  }
  const single = raw.match(/^(\d+)$/)
  if (single) return { min: Number(single[1]), max: null, display: `${single[1]}+ years` }
  return { min: null, max: null, display: raw }
}

export function extractPortalJobMeta(job: Record<string, unknown>): PortalJobMeta {
  const exp = parseExperienceFromApi(job)
  return {
    nationality: asString(job.nationality) || undefined,
    priority: asString(job.priority) || undefined,
    openings: typeof job.openings === 'number' ? job.openings : Number(job.openings) || undefined,
    state: asString(job.state) || undefined,
    country: asString(job.country) || undefined,
    city: asString(job.city) || undefined,
    industryType:
      asString(job.jobCategory || job.industry || job.department) || undefined,
    employmentType:
      formatEmploymentTypeLabel(asString(job.employmentType || job.type)) || undefined,
    targetHireDate: formatDisplayDate(job.expectedClosureDate) || undefined,
    jdFileName: asString(job.jdFileName) || undefined,
    experienceMin: exp.min,
    experienceMax: exp.max,
    experienceDisplay: exp.display || undefined,
    salaryCurrency: asString(job.salaryCurrency) || undefined,
    salaryMin: typeof job.salaryMin === 'number' ? job.salaryMin : null,
    salaryMax: typeof job.salaryMax === 'number' ? job.salaryMax : null,
    salaryType: asString(job.salaryType) || undefined,
    languages: parseLanguages(job.languages),
    videoMediaLink: asString(job.videoMediaLink) || undefined,
    forecastRevenue: asString(job.forecastRevenue) || undefined,
    contactPerson: asString(job.hiringManager) || undefined,
    fullDescription:
      asString(job.description || job.jobDescriptionHtml || job.jobDescription) || undefined,
  }
}

export function displayJobField(value: unknown, fallback = '—'): string {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  const text = String(value).trim()
  return text || fallback
}

export function formatLocationParts(meta: PortalJobMeta, fallbackLocation?: string): string {
  const parts = [meta.city, meta.state, meta.country].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return fallbackLocation || '—'
}
