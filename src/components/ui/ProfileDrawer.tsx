'use client';

import { useEffect, useState } from 'react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  footer,
  children,
  widthClassName = 'w-full md:w-[50vw] md:max-w-[50vw]',
}: ProfileDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => setIsVisible(true));
      
      // Scroll Lock
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);

      return () => {
        cancelAnimationFrame(frame);
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener('keydown', handleEscape);
      };
    }
    setIsVisible(false);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close drawer"
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black/30 opacity-100' : 'bg-black/0 opacity-0'}`}
      />
      <aside
        className={`modal-placeholder-black absolute right-0 top-0 h-full ${widthClassName} rounded-l-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#9095A1] transition-colors hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">{children}</div>
          </div>

          {footer && (
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
