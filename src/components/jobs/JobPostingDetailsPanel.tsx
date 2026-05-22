'use client'

import type { JobLanguageRow } from '@/lib/map-portal-job'
import { displayJobField } from '@/lib/map-portal-job'
import { looksLikeHtmlJobDescription, toPlainJobText } from '@/lib/job-description'

export type JobPostingDetailsJob = {
  title: string
  company: string
  location?: string
  salary?: string
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
  languages?: JobLanguageRow[]
  skills?: string[]
  videoMediaLink?: string
  forecastRevenue?: string
  contactPerson?: string
  fullDescription?: string
}

function DetailField({
  label,
  value,
  required,
}: {
  label: string
  value: string
  required?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export function JobPostingDetailsPanel({ job }: { job: JobPostingDetailsJob }) {
  const skills = Array.isArray(job.skills) ? job.skills.filter(Boolean) : []
  const languages = Array.isArray(job.languages) ? job.languages : []
  const rawDesc = job.fullDescription || ''
  const hasHtml = looksLikeHtmlJobDescription(rawDesc)
  const plainDesc = toPlainJobText(rawDesc)

  const locationLine =
    [job.city, job.state, job.country].filter(Boolean).join(', ') ||
    job.location ||
    '—'

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">Job posting details</h3>

        {rawDesc ? (
          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Job Description
            </p>
            {hasHtml ? (
              <div
                className="prose prose-sm mt-2 max-w-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
                dangerouslySetInnerHTML={{ __html: rawDesc }}
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {plainDesc}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Nationality" value={displayJobField(job.nationality)} />
          <DetailField label="Job Title" value={displayJobField(job.title)} required />
          <DetailField label="City (optional)" value={displayJobField(job.city)} />
          <DetailField label="Industry Type (optional)" value={displayJobField(job.industryType)} />
          <DetailField
            label="Employment Type (optional)"
            value={displayJobField(job.employmentType)}
          />
          <DetailField label="Other Document (optional)" value={displayJobField(job.jdFileName)} />
          <DetailField label="Location" value={locationLine} />
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Language &amp; Proficiency
          </p>
          {languages.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {languages.map((row, index) => (
                <li
                  key={`${row.language}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800"
                >
                  <span className="font-semibold">{row.language}</span>
                  <span className="text-slate-400"> · </span>
                  <span>{row.proficiency}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No languages added yet.</p>
          )}
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Skills</p>
          {skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No skills listed.</p>
          )}
        </div>
      </section>
    </div>
  )
}

/** Compact chips for job list cards (candidate-facing only) */
export function JobCardMetaChips({ job }: { job: JobPostingDetailsJob }) {
  const chips: string[] = []
  if (job.city) chips.push(job.city)
  if (job.employmentType) chips.push(String(job.employmentType).replace(/_/g, ' '))
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
