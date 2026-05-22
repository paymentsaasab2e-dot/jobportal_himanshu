'use client'

import type { ReactNode } from 'react'
import { jobSummaryDisplayParagraphs } from '@/lib/job-description'

export type JobDescriptionCardsJob = {
  description?: string
  companyOverview?: string
  jobOverview?: string
  responsibilities?: string[]
  requiredSkills?: string[]
  skills?: string[]
  preferredQualifications?: string[]
  candidateRequirements?: string[]
  experienceLevel?: string
  experienceDisplay?: string | null
  education?: string
  salary?: string
  benefits?: string[]
}

function JobDetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function BulletItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-2 inline-block h-2 w-2 shrink-0 rounded-[2px] bg-[#28A8E1]"
        aria-hidden
      />
      <p className="text-sm leading-7 text-slate-600">{children}</p>
    </div>
  )
}

function BulletList({ items, emptyMessage }: { items: string[]; emptyMessage: string }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <BulletItem key={`${item}-${idx}`}>{item}</BulletItem>
      ))}
    </div>
  )
}

function formatExperienceLabel(job: JobDescriptionCardsJob): string {
  if (job.experienceDisplay && job.experienceDisplay !== 'Not specified') {
    return job.experienceDisplay
  }
  const level = job.experienceLevel?.trim()
  if (!level || level === 'Not specified') return '—'
  return level
}

function formatEducation(value?: string): string {
  const text = String(value || '').trim()
  if (!text || text === '-') return '—'
  return text
}

export function JobDescriptionCards({ job }: { job: JobDescriptionCardsJob }) {
  const summaryParagraphs = jobSummaryDisplayParagraphs(job)
  const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities.filter(Boolean) : []
  const preferred = Array.isArray(job.preferredQualifications)
    ? job.preferredQualifications.filter(Boolean)
    : []
  const candidateReq = Array.isArray(job.candidateRequirements)
    ? job.candidateRequirements.filter(Boolean)
    : []
  const skillTags = [
    ...new Set(
      [...(job.requiredSkills || []), ...(job.skills || [])]
        .map((s) => String(s).trim())
        .filter(Boolean),
    ),
  ]
  const benefits = Array.isArray(job.benefits) ? job.benefits.filter(Boolean) : []

  return (
    <div className="space-y-6 min-w-0">
      <JobDetailCard title="Job Summary">
        {summaryParagraphs.length > 0 ? (
          <div className="space-y-3">
            {summaryParagraphs.map((paragraph, idx) => (
              <p key={idx} className="text-sm leading-7 text-slate-600">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No job summary available.</p>
        )}
      </JobDetailCard>

      <JobDetailCard title="Key Responsibilities">
        <BulletList items={responsibilities} emptyMessage="No key responsibilities available." />
      </JobDetailCard>

      <JobDetailCard title="Preferred Qualifications">
        <BulletList items={preferred} emptyMessage="No preferred qualifications listed." />
      </JobDetailCard>

      <JobDetailCard title="Candidate Requirements">
        <BulletList items={candidateReq} emptyMessage="No candidate requirements listed." />
      </JobDetailCard>

      <JobDetailCard title="Qualifications and Experience">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Experience</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{formatExperienceLabel(job)}</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Education</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{formatEducation(job.education)}</p>
          </div>
        </div>
        {skillTags.length > 0 ? (
          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Required Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillTags.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </JobDetailCard>

      <JobDetailCard title="Compensation & Benefits">
        <p className="text-sm font-semibold text-slate-700">
          Compensation: {job.salary?.trim() || '—'}
        </p>
        <div className="mt-3">
          {benefits.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                >
                  {benefit}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No additional benefits listed.</p>
          )}
        </div>
      </JobDetailCard>
    </div>
  )
}
