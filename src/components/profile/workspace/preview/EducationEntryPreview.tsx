'use client';

import type { EducationData as EducationEntryData } from '@/components/modals/EducationModal';
import {
  PreviewChip,
  PreviewDocCount,
  PreviewEntryShell,
  PreviewMetaItem,
} from './PreviewPrimitives';

type Entry = EducationEntryData & { documents?: unknown[] };

type Props = {
  entry: Entry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
};

export function EducationEntryPreview({
  entry,
  isExpanded,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: Props) {
  const docCount = entry.documents?.length ?? 0;
  const yearRange = `${entry.startYear || '—'} – ${entry.currentlyStudying ? 'Present' : entry.endYear || '—'}`;

  return (
    <PreviewEntryShell accent="blue">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {entry.degreeProgram || '—'}
            </h4>
            <p className="text-sm font-semibold text-blue-600">
              {entry.institutionName || '—'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {entry.educationLevel ? (
              <PreviewChip tone="blue">{entry.educationLevel}</PreviewChip>
            ) : null}
            {entry.modeOfStudy ? (
              <PreviewChip tone="green">{entry.modeOfStudy}</PreviewChip>
            ) : null}
            {entry.currentlyStudying ? (
              <PreviewChip tone="orange">Currently studying</PreviewChip>
            ) : (
              <PreviewChip tone="neutral">Completed</PreviewChip>
            )}
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">{yearRange}</span>
            {entry.fieldOfStudy ? (
              <>
                {' · '}
                {entry.fieldOfStudy}
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {entry.grade ? (
              <span>
                <span className="text-gray-400">Grade: </span>
                {entry.grade}
              </span>
            ) : null}
            {entry.courseDuration ? (
              <span>
                <span className="text-gray-400">Duration: </span>
                {entry.courseDuration}
              </span>
            ) : null}
          </div>
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
            aria-label="Delete education"
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
            label="Field of study / major"
            value={entry.fieldOfStudy || '—'}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewMetaItem label="Grade / GPA" value={entry.grade || '—'} />
            <PreviewMetaItem
              label="Course duration"
              value={entry.courseDuration || '—'}
            />
          </div>
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Documents
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {entry.documents!.map((doc, i) => (
                  <a
                    key={i}
                    href={resolveDocHref(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate">{getDocumentName(doc)}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PreviewEntryShell>
  );
}
