'use client';

import { useState } from 'react';
import type { BasicInfoData } from '@/components/modals/BasicInfoModal';
import type { ResumeData as BaseResumeData } from '@/components/modals/ResumeModal';
import type { InternshipData } from '@/components/modals/InternshipModal';
import type { GapExplanationData } from '@/components/modals/GapExplanationModal';
import type { SkillsData } from '@/components/modals/SkillsModal';
import type { LanguagesData } from '@/components/modals/LanguagesModal';
import type { ProjectData } from '@/components/modals/ProjectModal';
import type { PortfolioLinksData } from '@/components/modals/PortfolioLinksModal';
import type { CareerPreferencesData } from '@/components/modals/CareerPreferencesModal';
import type { VisaWorkAuthorizationData } from '@/components/modals/VisaWorkAuthorizationModal';
import type { VaccinationData } from '@/components/modals/VaccinationModal';
import type { AcademicAchievementData } from '@/components/modals/AcademicAchievementModal';
import type { CompetitiveExamsData } from '@/components/modals/CompetitiveExamsModal';
import {
  PreviewChip,
  PreviewChipRow,
  PreviewDocCount,
  PreviewEntryShell,
  PreviewExpandableText,
  PreviewMetaGrid,
  PreviewMetaItem,
  textSnippet,
} from './PreviewPrimitives';

type ResumeViewData = BaseResumeData & {
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  atsScore?: number;
};

function fullName(d: BasicInfoData) {
  return [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ').trim() || '—';
}

function fmtRangeShort(start?: string, end?: string, current?: boolean) {
  const a = start
    ? new Date(start).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const b = current
    ? 'Present'
    : end
      ? new Date(end).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : '—';
  return `${a} – ${b}`;
}

export function ProfileBasicInfoFilled({ data }: { data: BasicInfoData }) {
  // Strip country name from phoneCode (e.g., "+237 (Cameroon)" -> "+237")
  const cleanPhoneCode = (data.phoneCode || '').split(' ')[0];
  
  // Decide if we should show the phoneCode separately
  // If data.phone starts with '+' or already has a long enough prefix that looks like a country code
  const phoneHasPlus = (data.phone || '').startsWith('+');
  
  const phoneDisplay = phoneHasPlus 
    ? data.phone 
    : (cleanPhoneCode && data.phone ? `${cleanPhoneCode} ${data.phone}` : data.phone || '—');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Full name
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-bold text-gray-900">{fullName(data)}</p>
            {data.whatsappNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                WhatsApp: {data.whatsappNumber}
              </span>
            )}
          </div>
        </div>
        {data.employment ? (
          <span className="inline-flex w-fit shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900">
            {data.employment}
          </span>
        ) : null}
      </div>
      <PreviewMetaGrid>
        <PreviewMetaItem label="Email" value={data.email || '—'} />
        <PreviewMetaItem label="Phone" value={phoneDisplay} />
        {data.whatsappNumber && (
          <PreviewMetaItem label="WhatsApp No" value={data.whatsappNumber} />
        )}
        <PreviewMetaItem label="Gender" value={data.gender || '—'} />
        <PreviewMetaItem label="Date of birth" value={data.dob || '—'} />
        <PreviewMetaItem label="City" value={data.city || '—'} />
        <PreviewMetaItem label="Country" value={data.country || '—'} />
      </PreviewMetaGrid>
      {data.passportNumber ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Passport
          </p>
          <p className="mt-0.5 font-mono text-sm text-gray-800">
            {data.passportNumber}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileResumeFilled({
  resumeData,
  scorePercent,
  onReplace,
  onEdit,
}: {
  resumeData: ResumeViewData;
  scorePercent: number;
  onReplace: () => void;
  onEdit: () => void;
}) {
  const displayName =
    resumeData.fileName ||
    resumeData.fileUrl?.split('/').pop() ||
    'Resume on file';
  const uploaded = resumeData.uploadedDate
    ? new Date(resumeData.uploadedDate).toLocaleDateString()
    : null;
  const ext =
    resumeData.mimeType?.split('/').pop()?.toUpperCase() ||
    displayName.split('.').pop()?.toUpperCase();

  return (
    <div className="rounded-xl border border-gray-200/80 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#28A8E1"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${Math.min(100, Math.max(0, scorePercent)) * 2.83} 283`}
              strokeLinecap="round"
              className="-rotate-90 origin-center"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
            {Math.round(scorePercent)}%
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {uploaded ? <span>Uploaded {uploaded}</span> : null}
              {ext ? <span>{ext}</span> : null}
              {resumeData.fileSize != null ? (
                <span>{(resumeData.fileSize / 1024).toFixed(1)} KB</span>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            ATS-style readiness score — upload or refresh to improve matching.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onReplace}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Edit / view details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileProfessionalSummaryFilled({
  summaryText,
}: {
  summaryText: string;
}) {
  return (
    <PreviewExpandableText text={summaryText} lineClamp={5} />
  );
}

export function ProfileInternshipFilled({
  data,
  formatEnum,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: {
  data: InternshipData;
  formatEnum: (v: string | null | undefined) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
}) {
  const docCount = data.documents?.length ?? 0;
  const snippet = textSnippet(
    [data.responsibilities, data.learnings].filter(Boolean).join(' · '),
    200,
  );
  const skills = (data.skills || []).slice(0, 5);

  return (
    <PreviewEntryShell accent="blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {data.internshipTitle || '—'}
            </h4>
            <p className="text-sm font-semibold text-blue-600">
              {data.companyName || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.internshipType ? (
              <PreviewChip tone="blue">{formatEnum(data.internshipType)}</PreviewChip>
            ) : null}
            {data.workMode ? (
              <PreviewChip tone="green">{formatEnum(data.workMode)}</PreviewChip>
            ) : null}
            {data.currentlyWorking ? (
              <PreviewChip tone="orange">Current</PreviewChip>
            ) : null}
            {data.domainDepartment ? (
              <PreviewChip tone="neutral">{data.domainDepartment}</PreviewChip>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            {fmtRangeShort(data.startDate, data.endDate, data.currentlyWorking)}
            {data.location ? <> · {data.location}</> : null}
          </p>
          {skills.length > 0 ? (
            <PreviewChipRow label="Skills">
              {skills.map((s, i) => (
                <PreviewChip key={i} tone="blue">
                  {s}
                </PreviewChip>
              ))}
              {(data.skills?.length || 0) > 5 ? (
                <span className="self-center text-[11px] text-gray-400">
                  +{(data.skills!.length || 0) - 5} more
                </span>
              ) : null}
            </PreviewChipRow>
          ) : null}
          {snippet ? (
            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
              {snippet}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete internship"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <PreviewMetaItem
            label="Responsibilities"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.responsibilities || '—'}
              </p>
            }
          />
          <PreviewMetaItem
            label="Learnings"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.learnings || '—'}
              </p>
            }
          />
          {data.skills && data.skills.length > 0 ? (
            <PreviewChipRow label="All skills">
              {data.skills.map((s, i) => (
                <PreviewChip key={i} tone="blue">
                  {s}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Documents
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <a
                        href={resolveDocHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <a
                        href={resolveDocHref(doc)}
                        download={getDocumentName(doc)}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

export function ProfileGapExplanationFilled({
  data,
  formatEnum,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  data: GapExplanationData;
  formatEnum: (v: string | null | undefined) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reasonSnippet = data.reasonForGap
    ? formatEnum(data.reasonForGap)
    : '';
  const desc = textSnippet(data.coursesText, 160);

  return (
    <PreviewEntryShell accent="amber">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {data.gapCategory ? (
              <PreviewChip tone="amber">{data.gapCategory}</PreviewChip>
            ) : null}
            {reasonSnippet ? (
              <PreviewChip tone="neutral">{reasonSnippet}</PreviewChip>
            ) : null}
            {data.gapDuration ? (
              <span className="text-xs text-gray-500">{data.gapDuration}</span>
            ) : null}
          </div>
          {desc ? (
            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
              {desc}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete gap explanation"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm text-gray-700">
          <PreviewMetaItem
            label="Skills during gap"
            value={
              data.selectedSkills?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.selectedSkills.map((s, i) => (
                    <PreviewChip key={i} tone="blue">
                      {s}
                    </PreviewChip>
                  ))}
                </div>
              ) : (
                '—'
              )
            }
          />
          <PreviewMetaItem
            label="Courses / trainings"
            value={
              <p className="whitespace-pre-wrap font-normal">
                {data.coursesText || '—'}
              </p>
            }
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Preferred support
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.preferredSupport?.flexibleRole ? (
                <PreviewChip tone="green">Flexible role</PreviewChip>
              ) : null}
              {data.preferredSupport?.hybridRemote ? (
                <PreviewChip tone="green">Hybrid / remote</PreviewChip>
              ) : null}
              {data.preferredSupport?.midLevelReEntry ? (
                <PreviewChip tone="green">Mid-level re-entry</PreviewChip>
              ) : null}
              {data.preferredSupport?.skillRefresher ? (
                <PreviewChip tone="green">Skill refresher</PreviewChip>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

const SKILL_CATS = ['Hard Skills', 'Soft Skills', 'Tools / Technologies'] as const;

export function ProfileSkillsFilled({
  data,
  onEdit,
  onDelete,
}: {
  data: SkillsData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const notes = (data.additionalNotes || '').trim();
  const notesLong = notes.length > 200;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {data.skills.length} skills
          </p>
          <p className="text-xs text-gray-500">Grouped by category</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete skills"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {SKILL_CATS.map((cat) => {
        const list = data.skills.filter((s) => s.category === cat);
        if (!list.length) return null;
        return (
          <div key={cat}>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((skill, i) => (
                <span
                  key={`${cat}-${skill.name}-${i}`}
                  className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-xs font-medium text-blue-900"
                >
                  {skill.name}
                  <span className="shrink-0 rounded bg-white/80 px-1 text-[10px] text-gray-600">
                    {skill.proficiency}
                  </span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {notes ? (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Additional notes
          </p>
          <p
            className={`mt-1 text-xs leading-relaxed text-gray-600 whitespace-pre-wrap ${
              !notesOpen && notesLong ? 'line-clamp-3' : ''
            }`}
          >
            {notes}
          </p>
          {notesLong ? (
            <button
              type="button"
              onClick={() => setNotesOpen(!notesOpen)}
              className="mt-1 text-xs font-semibold text-orange-700 hover:text-orange-800"
            >
              {notesOpen ? 'Show less' : 'Read more'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileLanguagesFilled({
  data,
  onDelete,
  getDocumentName,
  getApiDocumentHref,
}: {
  data: LanguagesData;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  getApiDocumentHref: (doc: unknown) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {data.languages.length} languages
          </p>
          <p className="text-xs text-gray-500">Proficiency & modes</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete languages"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {data.languages.map((lang, index) => (
          <div
            key={lang.id || index}
            className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {lang.name || '—'}
                  {lang.proficiency ? ` - ${lang.proficiency}` : ''}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {lang.speak ? <PreviewChip tone="green">Speak</PreviewChip> : null}
                  {lang.read ? <PreviewChip tone="purple">Read</PreviewChip> : null}
                  {lang.write ? <PreviewChip tone="amber">Write</PreviewChip> : null}
                </div>
              </div>
              {lang.documents && lang.documents.length > 0 ? (
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={getApiDocumentHref(lang.documents[0])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    title="View Proof"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View ({lang.documents.length})
                  </a>
                  <span className="text-gray-300">|</span>
                  <a
                    href={getApiDocumentHref(lang.documents[0])}
                    download={getDocumentName(lang.documents[0])}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    title="Download Proof"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    DL
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileProjectFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getDocumentName,
  getApiDocumentHref,
}: {
  data: ProjectData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  getApiDocumentHref: (doc: unknown) => string;
}) {
  const snippet = textSnippet(
    [data.projectDescription, data.projectOutcome].filter(Boolean).join(' · '),
    220,
  );
  const tech = (data.technologies || []).slice(0, 6);
  const docCount = data.documents?.length ?? 0;

  return (
    <PreviewEntryShell accent="blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {data.projectTitle || '—'}
            </h4>
            <p className="text-sm text-gray-600">{data.organizationClient || '—'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.projectType ? (
              <PreviewChip tone="blue">{data.projectType}</PreviewChip>
            ) : null}
            {data.currentlyWorking ? (
              <PreviewChip tone="orange">In progress</PreviewChip>
            ) : (
              <PreviewChip tone="neutral">Completed</PreviewChip>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {fmtRangeShort(data.startDate, data.endDate, data.currentlyWorking)}
          </p>
          {tech.length > 0 ? (
            <PreviewChipRow label="Tech">
              {tech.map((t, i) => (
                <PreviewChip key={i} tone="purple">
                  {t}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {data.projectLink ? (
            <a
              href={data.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block max-w-full truncate text-xs font-semibold text-orange-700 hover:underline"
            >
              {data.projectLink}
            </a>
          ) : null}
          {snippet ? (
            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
              {snippet}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete project"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <PreviewMetaItem
            label="Description"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.projectDescription || '—'}
              </p>
            }
          />
          <PreviewMetaItem
            label="Responsibilities"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.responsibilities || '—'}
              </p>
            }
          />
          <PreviewMetaItem
            label="Outcome"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.projectOutcome || '—'}
              </p>
            }
          />
          {data.technologies && data.technologies.length > 0 ? (
            <PreviewChipRow label="All technologies">
              {data.technologies.map((t, i) => (
                <PreviewChip key={i} tone="purple">
                  {t}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Documents
              </p>
              <div className="flex flex-wrap gap-2">
                {data.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <a
                        href={getApiDocumentHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <a
                        href={getApiDocumentHref(doc)}
                        download={getDocumentName(doc)}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

function truncateUrl(url: string, max = 48) {
  const u = url.trim();
  if (u.length <= max) return u;
  return `${u.slice(0, max)}…`;
}

export function ProfilePortfolioLinksFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onEditLink,
  onDelete,
}: {
  data: PortfolioLinksData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onEditLink: (link: PortfolioLink) => void;
  onDelete: () => void;
}) {
  const visible = isExpanded ? data.links : data.links.slice(0, 4);
  const hidden = data.links.length - visible.length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {data.links.length} links
          </p>
          <p className="text-xs text-gray-500">Portfolio & professional URLs</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete portfolio links"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {visible.map((link, index) => (
          (() => {
            const typeLabel = (link.linkType || '').trim().toLowerCase();
            const titleLabel = (link.title || '').trim().toLowerCase();
            return (
              <li
                key={link.id || index}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLink(link);
                }}
                className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 cursor-pointer hover:bg-gray-100 transition-all hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {link.linkType || 'Link'}
                  </p>
                  {link.title && (
                    <p className="truncate text-base font-bold text-gray-900">
                      {link.title}
                    </p>
                  )}
                  {link.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-sm font-bold !text-gray-700 hover:text-blue-600 hover:underline break-all !opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link.url}
                    </a>
                  )}
                </div>
              </li>
            );
          })()
        ))}
      </ul>
      {data.links.length > 4 ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? 'Show fewer' : `Show all (${hidden} more)`}
        </button>
      ) : null}
    </div>
  );
}

type CareerPrefsExtended = CareerPreferencesData & Record<string, unknown>;

export function ProfileCareerPreferencesFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  data: CareerPrefsExtended;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const titles =
    data.preferredJobTitles?.length
      ? data.preferredJobTitles
      : (data.preferredRoles as string[] | undefined) || [];

  const workModes =
    data.workModes?.length
      ? data.workModes
      : data.preferredWorkMode
        ? [String(data.preferredWorkMode)]
        : [];

  const prefSalary =
    (data.preferredSalary as string | undefined) || data.salaryAmount;
  const prefCurr =
    (data.preferredCurrency as string | undefined) || data.salaryCurrency;
  const prefType =
    (data.preferredSalaryType as string | undefined) || data.salaryFrequency;

  return (
    <PreviewEntryShell accent="orange">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          {titles.length > 0 ? (
            <PreviewChipRow label="Target roles">
              {titles.map((t, i) => (
                <PreviewChip key={i} tone="blue">
                  {t}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          <PreviewMetaGrid>
            <PreviewMetaItem
              label="Industry"
              value={data.preferredIndustry || '—'}
            />
            <PreviewMetaItem
              label="Functional area"
              value={data.functionalArea || '—'}
            />
          </PreviewMetaGrid>
          {data.jobTypes && data.jobTypes.length > 0 ? (
            <PreviewChipRow label="Job types">
              {data.jobTypes.map((j, i) => (
                <PreviewChip key={i} tone="green">
                  {j}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {workModes.length > 0 ? (
            <PreviewChipRow label="Work modes">
              {workModes.map((m, i) => (
                <PreviewChip key={i} tone="purple">
                  {m}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {data.preferredLocations && data.preferredLocations.length > 0 ? (
            <PreviewChipRow label="Locations">
              {data.preferredLocations.map((loc, i) => (
                <PreviewChip key={i} tone="amber">
                  {loc}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          <PreviewMetaGrid>
            <PreviewMetaItem
              label="Relocation"
              value={data.relocationPreference || '—'}
            />
            <PreviewMetaItem
              label="Salary expectation"
              value={
                prefSalary
                  ? `${prefCurr || 'USD'} ${prefSalary}${prefType ? ` (${prefType})` : ''}`
                  : '—'
              }
            />
            <PreviewMetaItem
              label="Availability"
              value={data.availabilityToStart || '—'}
            />
            <PreviewMetaItem
              label="Notice period"
              value={data.noticePeriod || '—'}
            />
          </PreviewMetaGrid>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete career preferences"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm">
          <PreviewMetaGrid>
            <PreviewMetaItem
              label="Current salary"
              value={
                <span>
                  {(data.currentCurrency as string) || 'USD'}{' '}
                  {(data.currentSalary as string) || '—'}
                  {(data.currentSalaryType as string)
                    ? ` (${data.currentSalaryType})`
                    : ''}
                </span>
              }
            />
            <PreviewMetaItem
              label="Current location"
              value={(data.currentLocation as string) || '—'}
            />
          </PreviewMetaGrid>
          {Array.isArray(data.currentBenefits) &&
          (data.currentBenefits as string[]).length > 0 ? (
            <PreviewChipRow label="Current benefits">
              {(data.currentBenefits as string[]).map((b, i) => (
                <PreviewChip key={i} tone="neutral">
                  {b}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {Array.isArray(data.preferredBenefits) &&
          (data.preferredBenefits as string[]).length > 0 ? (
            <PreviewChipRow label="Preferred benefits">
              {(data.preferredBenefits as string[]).map((b, i) => (
                <PreviewChip key={i} tone="green">
                  {b}
                </PreviewChip>
              ))}
            </PreviewChipRow>
          ) : null}
          {data.passportNumbersByLocation &&
          typeof data.passportNumbersByLocation === 'object' &&
          Object.keys(data.passportNumbersByLocation as object).length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Passport numbers by location
              </p>
              <div className="space-y-1 text-xs text-gray-700">
                {Object.entries(
                  data.passportNumbersByLocation as Record<string, string>,
                ).map(([loc, num]) => (
                  <div key={loc} className="flex gap-2">
                    <span className="w-28 shrink-0 text-gray-400">{loc}</span>
                    <span className="font-mono">{num || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

function countVisaDocs(v: VisaWorkAuthorizationData): number {
  let n = 0;
  const exp = v.visaDetailsExpected?.documents;
  if (Array.isArray(exp)) n += exp.length;
  const init = v.visaDetailsInitial?.documents;
  if (Array.isArray(init)) n += init.length;
  if (Array.isArray(v.visaEntries)) {
    for (const e of v.visaEntries) {
      const d = e?.visaDetails?.documents;
      if (Array.isArray(d)) n += d.length;
    }
  }
  return n;
}

export function ProfileVisaFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getDocumentName,
  getApiDocumentHref,
}: {
  data: VisaWorkAuthorizationData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  getApiDocumentHref: (doc: unknown) => string;
}) {
  const docCount = countVisaDocs(data);
  const dest =
    data.openForAll || !data.selectedDestination
      ? 'Open for all destinations'
      : data.selectedDestination;
  const remarks = textSnippet(data.additionalRemarks, 160);
  const firstEntry = data.visaEntries?.[0];
  const expected = data.visaDetailsExpected;

  return (
    <PreviewEntryShell accent="purple">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PreviewChip tone="purple">{dest}</PreviewChip>
            {data.visaWorkpermitRequired ? (
              <PreviewChip tone="amber">
                {data.visaWorkpermitRequired}
              </PreviewChip>
            ) : null}
          </div>
          {expected ? (
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-800">Expected: </span>
              {expected.visaType || '—'} · {expected.visaStatus || '—'}
              {expected.visaExpiryDate
                ? ` · exp. ${new Date(expected.visaExpiryDate).toLocaleDateString()}`
                : ''}
            </p>
          ) : firstEntry ? (
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-800">
                {firstEntry.countryName || firstEntry.country || 'Country'}
                :{' '}
              </span>
              {firstEntry.visaDetails?.visaType || '—'} ·{' '}
              {firstEntry.visaDetails?.visaStatus || '—'}
            </p>
          ) : null}
          {remarks ? (
            <p className="text-xs leading-relaxed text-gray-500 line-clamp-2">
              {remarks}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete visa"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-sm text-gray-700">
          <PreviewMetaItem
            label="Selected destination"
            value={data.selectedDestination || '—'}
          />
          <PreviewMetaItem
            label="Open for all"
            value={data.openForAll ? 'Yes' : 'No'}
          />
          {data.additionalRemarks ? (
            <PreviewMetaItem
              label="Remarks"
              value={
                <p className="whitespace-pre-wrap font-normal">
                  {data.additionalRemarks}
                </p>
              }
            />
          ) : null}
          {expected && (
            <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
              <p className="text-[11px] font-medium uppercase text-gray-400">
                Visa (expected)
              </p>
              <p className="mt-1 text-xs">
                {expected.visaType} · {expected.visaStatus}
              </p>
              {expected.documents?.map((doc, i) => (
                <div
                  key={i}
                  className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <a
                      href={getApiDocumentHref(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="View Document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <a
                      href={getApiDocumentHref(doc)}
                      download={getDocumentName(doc)}
                      className="text-orange-600 hover:text-orange-700 transition-colors"
                      title="Download Document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.visaEntries?.map((entry, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs"
            >
              <p className="font-semibold text-gray-900">
                {entry.countryName || entry.country || 'Entry'}
              </p>
              <p className="mt-1 text-gray-600">
                {entry.visaDetails?.visaType} · {entry.visaDetails?.visaStatus}
              </p>
              {entry.visaDetails?.documents?.map((doc: unknown, i: number) => (
              <div
                key={i}
                className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <a
                    href={getApiDocumentHref(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="View Document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <a
                    href={getApiDocumentHref(doc)}
                    download={getDocumentName(doc)}
                    className="text-orange-600 hover:text-orange-700 transition-colors"
                    title="Download Document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

export function ProfileVaccinationFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  certificateHref,
  certificateLabel,
}: {
  data: VaccinationData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  certificateHref?: string;
  certificateLabel?: string;
}) {
  const hasCert = Boolean(data.certificate);
  const validity =
    data.validityMonth || data.validityYear
      ? `${data.validityMonth || '—'} / ${data.validityYear || '—'}`
      : '—';

  return (
    <PreviewEntryShell accent="green">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <PreviewMetaGrid cols={2}>
            <PreviewMetaItem label="Vaccine" value={data.vaccineType || '—'} />
            <PreviewMetaItem
              label="Last dose"
              value={
                data.lastVaccinationDate
                  ? new Date(data.lastVaccinationDate).toLocaleDateString()
                  : '—'
              }
            />
            <PreviewMetaItem label="Valid through" value={validity} />
            <PreviewMetaItem
              label="Certificate"
              value={
                hasCert ? (
                  certificateHref ? (
                    <div className="mt-1 flex items-center gap-3">
                      <a
                        href={certificateHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        title="View Certificate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                      <span className="text-gray-300">|</span>
                      <a
                        href={certificateHref}
                        download={certificateLabel || 'VaccinationCertificate'}
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                        title="Download Certificate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  ) : (
                    <PreviewChip tone="green">Uploaded</PreviewChip>
                  )
                ) : (
                  <PreviewChip tone="neutral">Not uploaded</PreviewChip>
                )
              }
            />
          </PreviewMetaGrid>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete vaccination"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Compliance summary only — edit the form to update medical records.
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

export function ProfileAcademicAchievementFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: {
  data: AcademicAchievementData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
}) {
  const docCount = data.documents?.length ?? 0;
  const snip = textSnippet(data.description, 180);

  return (
    <PreviewEntryShell accent="blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {data.achievementTitle || '—'}
            </h4>
            <p className="text-sm font-semibold text-blue-600">
              {data.awardedBy || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.categoryType ? (
              <PreviewChip tone="blue">{data.categoryType}</PreviewChip>
            ) : null}
            {data.yearReceived ? (
              <PreviewChip tone="neutral">{data.yearReceived}</PreviewChip>
            ) : null}
          </div>
          {snip ? (
            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
              {snip}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete academic achievement"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <PreviewMetaItem
            label="Description"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.description || '—'}
              </p>
            }
          />
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Documents
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <a
                        href={resolveDocHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <a
                        href={resolveDocHref(doc)}
                        download={getDocumentName(doc)}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}

export function ProfileCompetitiveExamFilled({
  data,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: {
  data: CompetitiveExamsData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
}) {
  const docCount = data.documents?.length ?? 0;

  return (
    <PreviewEntryShell accent="green">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {data.examName || '—'}
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {data.resultStatus ? (
                <PreviewChip tone="green">{data.resultStatus}</PreviewChip>
              ) : null}
              {data.yearTaken ? (
                <PreviewChip tone="neutral">{data.yearTaken}</PreviewChip>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Score{' '}
            <span className="font-semibold text-gray-900">
              {data.scoreMarks || '—'}
            </span>
            {data.scoreType ? (
              <span className="text-gray-500"> ({data.scoreType})</span>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete competitive exam"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 text-sm">
          <PreviewMetaItem label="Valid until" value={data.validUntil || '—'} />
          <PreviewMetaItem
            label="Notes"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {data.additionalNotes || '—'}
              </p>
            }
          />
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Certificates
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <a
                        href={resolveDocHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <a
                        href={resolveDocHref(doc)}
                        download={getDocumentName(doc)}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}
