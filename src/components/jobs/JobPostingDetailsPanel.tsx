'use client'

import type { ReactNode } from 'react'
import {
  Briefcase,
  Building2,
  Clock3,
  Globe2,
  IndianRupee,
  Languages,
  MapPin,
  Users,
} from 'lucide-react'
import type { JobLanguageRow } from '@/lib/map-portal-job'
import { displayJobField } from '@/lib/map-portal-job'
import {
  buildJobDescriptionSections,
  sectionVisibleOnPortal,
  type JobDescriptionSection,
} from '@/lib/job-description'
import {
  isJobFieldPubliclyVisible,
  parseJobPublicFieldVisibility,
  type JobPublicVisibilityField,
} from '@/lib/job-public-field-visibility'

export type JobPostingDetailsJob = {
  title: string
  company: string
  location?: string
  salary?: string
  workMode?: string
  postedDate?: string
  nationality?: string
  openings?: number
  state?: string
  country?: string
  city?: string
  industryType?: string
  employmentType?: string
  experienceMin?: number | null
  experienceMax?: number | null
  experienceLevel?: string
  experienceDisplay?: string | null
  salaryCurrency?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  languages?: JobLanguageRow[]
  skills?: string[]
  requiredSkills?: string[]
  responsibilities?: string[]
  preferredQualifications?: string[]
  candidateRequirements?: string[]
  education?: string
  benefits?: string[]
  fullDescription?: string
  description?: string
  jobOverview?: string
  showClientNamePublicly?: boolean
  publicFieldVisibility?: Record<string, boolean> | null
}

function formatExperienceRange(job: JobPostingDetailsJob): { min: string; max: string } {
  if (job.experienceMin != null || job.experienceMax != null) {
    return {
      min: job.experienceMin != null ? String(job.experienceMin) : '—',
      max: job.experienceMax != null ? String(job.experienceMax) : '—',
    }
  }
  const raw = String(job.experienceLevel || job.experienceDisplay || '').trim()
  if (!raw || raw === 'Not specified') return { min: '—', max: '—' }
  const range = raw.match(/^(\d+)\s*[-–]\s*(\d+)/)
  if (range) return { min: range[1], max: range[2] }
  const single = raw.match(/^(\d+)/)
  if (single) return { min: single[1], max: '—' }
  return { min: raw, max: '—' }
}

/** Format experience for the detail header subtitle line (e.g. `5–6 yrs`). */
export function formatJobExperienceHeader(job: JobPostingDetailsJob): string | null {
  const { min, max } = formatExperienceRange(job)
  if (min !== '—' && max !== '—') return `${min}–${max} yrs`
  if (min !== '—') return `${min}+ yrs`
  if (max !== '—') return `Up to ${max} yrs`
  const raw = String(job.experienceLevel || job.experienceDisplay || '').trim()
  if (!raw || raw === 'Not specified') return null
  return raw
}

/** Compact salary for header line (e.g. `10 · USD` or `5–10 · USD`). */
export function formatJobHeaderSalary(job: JobPostingDetailsJob): string | null {
  const currency = String(job.salaryCurrency || 'USD').trim()
  const min = job.salaryMin != null ? String(job.salaryMin) : ''
  const max = job.salaryMax != null ? String(job.salaryMax) : ''
  if (min && max) return `${min}–${max} · ${currency}`
  if (min) return `${min} · ${currency}`
  if (max) return `Up to ${max} · ${currency}`
  const raw = String(job.salary || '').trim()
  if (!raw || raw === 'Salary not specified') return null
  return raw
}

/** Company • location subtitle for the detail header. */
export function formatJobHeaderCompanyLocation(
  job: JobPostingDetailsJob,
  show: (field: JobPublicVisibilityField) => boolean,
): string | null {
  const company = show('client') ? String(job.company || '').trim() : ''
  const location = show('location') ? formatLocationLabel(job) : ''
  if (location === 'Not disclosed') {
    return company || null
  }
  if (company && location) return `${company} • ${location}`
  return company || location || null
}

/**
 * Detail header meta lines under the title:
 * line 1 — Company • Location
 * line 2 — Salary • Experience
 */
export function JobDetailHeaderMeta({ job }: { job: JobPostingDetailsJob }) {
  const { show } = useJobVisibility(job)
  const companyLocation = formatJobHeaderCompanyLocation(job, show)
  const salary = show('salary') ? formatJobHeaderSalary(job) : null
  const experience = show('experience') ? formatJobExperienceHeader(job) : null
  const salaryExperience = [salary, experience].filter(Boolean).join(' • ')

  if (!companyLocation && !salaryExperience) return null

  return (
    <div className="mt-1 space-y-1">
      {companyLocation ? (
        <p className="text-sm leading-relaxed text-slate-500 wrap-break-word">{companyLocation}</p>
      ) : null}
      {salaryExperience ? (
        <p className="text-sm leading-relaxed text-slate-500 wrap-break-word">{salaryExperience}</p>
      ) : null}
    </div>
  )
}

function formatLocationLabel(job: JobPostingDetailsJob): string {
  const parts = [job.city, job.state, job.country].map((p) => String(p || '').trim()).filter(Boolean)
  if (parts.length) return parts.join(', ')
  return String(job.location || '').trim() || 'Not disclosed'
}

function formatSalaryLabel(job: JobPostingDetailsJob): string {
  if (job.salary?.trim()) return job.salary.trim()
  const currency = job.salaryCurrency || 'USD'
  const min = job.salaryMin != null ? String(job.salaryMin) : ''
  const max = job.salaryMax != null ? String(job.salaryMax) : ''
  if (min && max) return `${currency} ${min} - ${max}`
  if (min) return `${currency} ${min}+`
  if (max) return `Up to ${currency} ${max}`
  return 'Not disclosed'
}

function useJobVisibility(job: JobPostingDetailsJob) {
  const visibility = parseJobPublicFieldVisibility(job.publicFieldVisibility)
  const show = (field: JobPublicVisibilityField) =>
    isJobFieldPubliclyVisible(visibility, field, job.showClientNamePublicly)
  return { visibility, show }
}

function HighlightChip({ icon, label }: { icon: ReactNode; label: string }) {
  if (!label || label === 'Not disclosed') return null
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  )
}

/** Naukri-style icon highlight row — experience, salary, location, job type. */
export function JobDetailHighlights({ job }: { job: JobPostingDetailsJob }) {
  const { show } = useJobVisibility(job)
  const chips: ReactNode[] = []

  const experienceLabel = show('experience') ? formatJobExperienceHeader(job) : null
  if (experienceLabel) {
    chips.push(
      <HighlightChip
        key="exp"
        icon={<Briefcase size={16} strokeWidth={2} />}
        label={experienceLabel}
      />,
    )
  }
  if (show('salary')) {
    chips.push(
      <HighlightChip
        key="salary"
        icon={<IndianRupee size={16} strokeWidth={2} />}
        label={formatSalaryLabel(job)}
      />,
    )
  }
  if (show('location')) {
    chips.push(
      <HighlightChip
        key="loc"
        icon={<MapPin size={16} strokeWidth={2} />}
        label={formatLocationLabel(job)}
      />,
    )
  }
  if (show('employmentType') && job.employmentType) {
    chips.push(
      <HighlightChip
        key="type"
        icon={<Building2 size={16} strokeWidth={2} />}
        label={String(job.employmentType).replace(/_/g, ' ')}
      />,
    )
  }
  if (job.workMode?.trim()) {
    chips.push(
      <HighlightChip
        key="mode"
        icon={<Globe2 size={16} strokeWidth={2} />}
        label={job.workMode}
      />,
    )
  }
  if (show('openings') && job.openings != null) {
    chips.push(
      <HighlightChip
        key="openings"
        icon={<Users size={16} strokeWidth={2} />}
        label={`${job.openings} Opening${job.openings === 1 ? '' : 's'}`}
      />,
    )
  }

  if (chips.length === 0) return null
  return <div className="mt-4 flex flex-wrap gap-2">{chips}</div>
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-bold text-slate-900 sm:text-lg">{children}</h2>
  )
}

function BulletList({ items }: { items: string[] }) {
  const filtered = items.map((item) => String(item).trim()).filter(Boolean)
  if (!filtered.length) return null
  return (
    <ul className="mt-3 space-y-2.5">
      {filtered.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-3">
          <span
            className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#28A8E1]"
            aria-hidden
          />
          <span className="text-sm leading-7 text-slate-600">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ParagraphBlock({ paragraphs }: { paragraphs: string[] }) {
  if (!paragraphs.length) return null
  return (
    <div className="mt-3 space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className="text-sm leading-7 text-slate-600">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function DescriptionSectionBlock({ section }: { section: JobDescriptionSection }) {
  return (
    <>
      <ParagraphBlock paragraphs={section.paragraphs} />
      {section.paragraphs.length === 0 ? <BulletList items={section.bullets} /> : null}
    </>
  )
}

function ContentSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-1">{children}</div>
    </section>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  )
}

/** Naukri-style job posting body — readable sections, no form inputs. */
export function JobPostingDetailsPanel({ job }: { job: JobPostingDetailsJob }) {
  const { show } = useJobVisibility(job)

  const skills = show('skills')
    ? [
        ...new Set(
          [...(job.requiredSkills || []), ...(job.skills || [])]
            .map((s) => String(s).trim())
            .filter(Boolean),
        ),
      ]
    : []
  const languages = show('languages') && Array.isArray(job.languages) ? job.languages : []

  const rawDesc =
    job.fullDescription?.trim() || job.description?.trim() || job.jobOverview?.trim() || ''

  const descriptionSections = buildJobDescriptionSections(rawDesc, {
    responsibilities: show('keyResponsibilities') ? job.responsibilities : [],
    preferredQualifications: show('qualifications') ? job.preferredQualifications : [],
    candidateRequirements: show('candidateRequirements') ? job.candidateRequirements : [],
    benefits: job.benefits,
  }).filter((section) => sectionVisibleOnPortal(section.id, show))

  const metaRows: { label: string; value: string }[] = []
  if (show('nationality') && job.nationality) {
    metaRows.push({ label: 'Nationality', value: displayJobField(job.nationality) })
  }
  if (show('industryType') && job.industryType) {
    metaRows.push({ label: 'Industry', value: displayJobField(job.industryType) })
  }
  if (show('employmentType') && job.employmentType) {
    metaRows.push({
      label: 'Employment Type',
      value: String(job.employmentType).replace(/_/g, ' '),
    })
  }
  if (job.education && job.education !== '-') {
    metaRows.push({ label: 'Education', value: job.education })
  }

  return (
    <div className="space-y-6">
      {descriptionSections.length > 0 ? (
        descriptionSections.map((section) => (
          <ContentSection key={section.id} title={section.title}>
            <DescriptionSectionBlock section={section} />
          </ContentSection>
        ))
      ) : show('jobDescription') ? (
        <ContentSection title="Job description">
          <p className="text-sm text-slate-500">No description provided for this role.</p>
        </ContentSection>
      ) : null}

      {skills.length > 0 ? (
        <ContentSection title="Key skills">
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {languages.length > 0 ? (
        <ContentSection title="Languages">
          <div className="mt-3 flex flex-wrap gap-2">
            {languages.map((row, index) => (
              <span
                key={`${row.language}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <Languages size={13} className="text-slate-400" />
                {row.language}
                <span className="text-slate-300">·</span>
                {row.proficiency}
              </span>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {metaRows.length > 0 ? (
        <ContentSection title="Job details">
          <dl className="mt-3 space-y-3">
            {metaRows.map((row) => (
              <MetaRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
        </ContentSection>
      ) : null}

      {job.postedDate ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock3 size={13} />
          Posted {job.postedDate}
        </p>
      ) : null}
    </div>
  )
}

/** Compact chips for job list cards (candidate-facing only) */
export function JobCardMetaChips({ job }: { job: JobPostingDetailsJob }) {
  const { show } = useJobVisibility(job)

  const chips: string[] = []
  if (show('location') && job.city) chips.push(job.city)
  if (show('employmentType') && job.employmentType) {
    chips.push(String(job.employmentType).replace(/_/g, ' '))
  }
  if (chips.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip}
          className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
        >
          {chip}
        </span>
      ))}
    </div>
  )
}
