'use client';

/** Lightweight shell while a profile/explore modal chunk loads. */
export function ModalLoadShell() {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35"
      role="status"
      aria-live="polite"
      aria-label="Loading editor"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 h-5 w-2/5 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
