'use client';

import { JOB_PORTAL_STATUS_CATALOG } from '@/lib/portal-status-copy';
import { LmsEmptyState } from '@/app/lms/components/states/LmsEmptyState';
import { LmsInlineError } from '@/app/lms/components/states/LmsInlineError';

export default function JobPortalStatusScreensPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Portal status catalog</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Status screens and alerts</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Title plus short message for connection delays and Job Portal screens. Employer alerts live on
          Phase 2 at /status-screens.
        </p>
      </header>

      {JOB_PORTAL_STATUS_CATALOG.map((group) => (
        <section key={group.heading}>
          <h2 className="mb-4 text-lg font-bold text-slate-900">{group.heading}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <div key={item.id}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.trigger}
                </p>
                {item.id === 'lmsFetchFailed' ? (
                  <LmsInlineError title={item.copy.title} message={item.copy.message} />
                ) : (
                  <LmsEmptyState title={item.copy.title} body={item.copy.message} />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
