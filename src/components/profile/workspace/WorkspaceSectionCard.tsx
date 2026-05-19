import type { ReactNode } from 'react';

export type WorkspaceSectionCardProps = {
  title: string;
  incomplete?: boolean;
  onEdit: () => void;
  onAdd: () => void;
  children: ReactNode;
  /** When false, hides Edit (e.g. empty single-record section). */
  showEdit?: boolean;
  /** When false, hides Add. */
  showAdd?: boolean;
  /** Emphasize Add for multi-entry sections. */
  addEmphasized?: boolean;
  /** Anchor for scroll / observer (optional). */
  sectionId?: string;
  className?: string;
};

export function WorkspaceSectionCard({
  title,
  incomplete,
  onEdit,
  onAdd,
  children,
  showEdit = true,
  showAdd = true,
  addEmphasized = false,
  sectionId,
  className = '',
}: WorkspaceSectionCardProps) {
  return (
    <div
      id={sectionId}
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm scroll-mt-[120px] ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 lg:px-[18px]">
        <div className="flex min-w-0 items-center gap-2">
          {incomplete ? (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
              title="Needs attention"
              aria-hidden
            />
          ) : null}
          <h3 className="profile-page-section-title truncate">
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-gray-200 p-2 text-blue-600 transition-all duration-200 hover:bg-blue-50"
              aria-label={`Edit ${title}`}
              title="Edit"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          ) : null}
          {showAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className={`rounded-lg border p-2 transition-all duration-200 ${
                addEmphasized
                  ? 'border-orange-400 bg-orange-50 text-orange-800 hover:bg-orange-100'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={`Add to ${title}`}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      <div className="px-4 py-3.5 lg:px-[18px]">{children}</div>
    </div>
  );
}
