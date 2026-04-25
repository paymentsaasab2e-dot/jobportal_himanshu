'use client';

import { useState } from 'react';
import DocumentViewerModal from '@/components/modals/DocumentViewerModal';
import type { WorkExperienceEntry } from '@/components/modals/WorkExperienceModal';
import {
  PreviewChip,
  PreviewChipRow,
  PreviewDocCount,
  PreviewEntryShell,
  PreviewMetaItem,
  textSnippet,
} from './PreviewPrimitives';

type Props = {
  entry: WorkExperienceEntry;
  formatEnum: (v: string | null | undefined) => string;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function fmtRange(start?: string, end?: string, current?: boolean) {
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

export function WorkExperienceEntryCard({
  entry,
  formatEnum,
  getDocumentName,
  resolveDocHref,
  isExpanded,
  onEdit,
  onDelete,
}: Props) {
  const docCount = entry.documents?.length ?? 0;
  const snippet = textSnippet(
    [entry.keyResponsibilities, entry.achievements].filter(Boolean).join(' · '),
    220,
  );
  const skillPreview = (entry.workSkills || []).slice(0, 5);

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  const handlePreview = (url: string, name: string) => {
    setPreviewModal({
      isOpen: true,
      url,
      name,
    });
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.target = "_blank";
      link.click();
    }
  };

  return (
    <PreviewEntryShell accent="blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {entry.jobTitle || '—'}
            </h4>
            <p className="text-sm font-semibold text-blue-600">
              {entry.companyName || '—'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {entry.employmentType ? (
              <PreviewChip tone="blue">
                {formatEnum(entry.employmentType)}
              </PreviewChip>
            ) : null}
            {entry.workMode ? (
              <PreviewChip tone="green">
                {formatEnum(entry.workMode)}
              </PreviewChip>
            ) : null}
            {entry.currentlyWorkHere ? (
              <PreviewChip tone="orange">Current role</PreviewChip>
            ) : null}
            {entry.industryDomain ? (
              <PreviewChip tone="neutral">{entry.industryDomain}</PreviewChip>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">
              {fmtRange(
                entry.startDate,
                entry.endDate,
                entry.currentlyWorkHere,
              )}
            </span>
            {entry.workLocation ? (
              <>
                {' · '}
                {entry.workLocation}
              </>
            ) : null}
            {entry.numberOfReportees ? (
              <>
                {' · '}
                {entry.numberOfReportees} reportees
              </>
            ) : null}
          </p>
          {skillPreview.length > 0 ? (
            <PreviewChipRow label="Skills">
              {skillPreview.map((s, i) => (
                <PreviewChip key={i} tone="blue">
                  {s}
                </PreviewChip>
              ))}
              {(entry.workSkills?.length || 0) > 5 ? (
                <span className="self-center text-[11px] text-gray-400">
                  +{(entry.workSkills!.length || 0) - 5} more
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
            {docCount === 1 && entry.documents && (
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(resolveDocHref(entry.documents![0]), getDocumentName(entry.documents![0]));
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(resolveDocHref(entry.documents![0]), getDocumentName(entry.documents![0]));
                  }}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Download
                </button>
              </div>
            )}
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
            aria-label="Delete work experience"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <PreviewMetaItem
            label="Key responsibilities"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {entry.keyResponsibilities || '—'}
              </p>
            }
          />
          <PreviewMetaItem
            label="Achievements"
            value={
              <p className="whitespace-pre-wrap font-normal text-gray-700">
                {entry.achievements || '—'}
              </p>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewMetaItem
              label="Company profile"
              value={
                <p className="whitespace-pre-wrap font-normal text-gray-700">
                  {entry.companyProfile || '—'}
                </p>
              }
            />
            <PreviewMetaItem
              label="Company turnover"
              value={entry.companyTurnover || '—'}
            />
          </div>
          {entry.workSkills && entry.workSkills.length > 0 ? (
            <PreviewChipRow label="All skills">
              {entry.workSkills.map((s, i) => (
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
                {entry.documents!.map((doc, docIndex) => {
                  const docName = getDocumentName(doc);
                  const fullUrl = resolveDocHref(doc);
                  return (
                    <div
                      key={docIndex}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="truncate flex-1 font-medium">{docName}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(fullUrl, docName);
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="View Document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(fullUrl, docName);
                          }}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          title="Download Document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <DocumentViewerModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        documentUrl={previewModal.url}
        documentName={previewModal.name}
      />
    </PreviewEntryShell>
  );
}
