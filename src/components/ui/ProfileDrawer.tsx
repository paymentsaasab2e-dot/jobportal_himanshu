'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  useEffect(() => {
    if (isOpen) {
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
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              mass: 0.8
            }}
            className={`absolute right-0 top-0 h-full ${widthClassName} rounded-l-2xl bg-white shadow-2xl modal-placeholder-black`}
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
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
