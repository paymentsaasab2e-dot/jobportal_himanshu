'use client';

type PreviewEntryActionButtonsProps = {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: () => void;
  editAriaLabel?: string;
  onDelete: () => void;
  deleteAriaLabel: string;
};

/** Expand, edit, and delete actions shared by profile entry cards. */
export function PreviewEntryActionButtons({
  isExpanded = false,
  onToggleExpand,
  onEdit,
  editAriaLabel = 'Edit entry',
  onDelete,
  deleteAriaLabel,
}: PreviewEntryActionButtonsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      {onToggleExpand ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded-lg border border-gray-200 p-2 text-blue-600 transition-all duration-200 hover:bg-blue-50"
          aria-label={editAriaLabel}
          title="Edit"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
        aria-label={deleteAriaLabel}
        title="Delete"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

