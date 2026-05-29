import type { ReactNode } from 'react';

type ApplicationDetailSectionCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
  /** When true, render children only (no titled header bar). */
  bare?: boolean;
};

/** Section card — same chrome as profile workspace (`WorkspaceSectionCard`). */
export function ApplicationDetailSectionCard({
  title,
  children,
  className = '',
  headerExtra,
  bare = false,
}: ApplicationDetailSectionCardProps) {
  if (bare) {
    return (
      <section
        className={`rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3.5 lg:px-[18px] ${className}`.trim()}
      >
        {children}
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 lg:px-[18px]">
        <h2 className="profile-page-section-title">{title}</h2>
        {headerExtra}
      </div>
      <div className="px-4 py-3.5 lg:px-[18px]">{children}</div>
    </section>
  );
}
