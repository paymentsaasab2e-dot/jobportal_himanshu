import type { ReactNode } from 'react';
import { LMS_PAGE_EYEBROW, LMS_PAGE_SUBTITLE, LMS_PAGE_TITLE } from '../constants';

type LmsPageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

/** Page title block — same scale as candidate profile / applications (Phase 1). */
export function LmsPageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className = '',
}: LmsPageHeaderProps) {
  return (
    <div
      className={`min-w-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">
        {eyebrow ? <p className={LMS_PAGE_EYEBROW}>{eyebrow}</p> : null}
        <h1 className={`${LMS_PAGE_TITLE} ${eyebrow ? 'mt-1' : 'mb-1'}`}>{title}</h1>
        {subtitle ? <p className={LMS_PAGE_SUBTITLE}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
