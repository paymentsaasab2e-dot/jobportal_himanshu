import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export type LmsSheetSize = 'sm' | 'md' | 'lg';

export type LmsSheetProps = {
  open: boolean;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: LmsSheetSize;
};

function sizeClass(size: LmsSheetSize) {
  if (size === 'sm') return 'max-w-md';
  if (size === 'lg') return 'max-w-2xl';
  return 'max-w-xl';
}

export function LmsSheet({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'md',
}: LmsSheetProps) {
  const canRender = open && typeof document !== 'undefined';

  // Basic usability: ESC closes, lock background scroll.
  // (Not a full focus trap; keep lightweight for LMS-only.)
  useEffect(() => {
    if (!canRender) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [canRender, onClose]);

  if (!canRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto flex sm:items-stretch justify-center sm:justify-end p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? 'Dialog'}
          className={`w-full ${sizeClass(size)} rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div className="min-w-0">
              {title ? <h2 className="text-base font-bold text-gray-900">{title}</h2> : null}
              {description ? (
                <p className="mt-1 text-sm font-normal text-gray-500 leading-relaxed">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
              aria-label="Close sheet"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="max-h-[72vh] sm:max-h-[calc(100vh-2rem)] overflow-y-auto px-5 py-4">
            {children}
          </div>

          {footer ? <div className="border-t border-gray-100 px-5 py-4 bg-white/70">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

