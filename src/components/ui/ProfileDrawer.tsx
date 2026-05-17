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

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}

            onClick={onClose}

            className="absolute inset-0 bg-black/30 backdrop-blur-sm"

          />



          <motion.aside

            initial={{ x: '100%' }}

            animate={{ x: 0 }}

            exit={{ x: '100%' }}

            transition={{

              type: 'spring',

              damping: 25,

              stiffness: 200,

              mass: 0.8,

            }}

            className={`absolute right-0 top-0 h-full ${widthClassName} profile-modal-chrome rounded-l-2xl bg-white shadow-2xl`}

            onClick={(e) => e.stopPropagation()}

          >

            <div className="profile-modal-typography flex h-full flex-col">

              <div className="sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white px-5 py-4">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h2 className="profile-modal-title">{title}</h2>

                    {subtitle ? (

                      <p className="profile-modal-helper mt-1 text-slate-500">{subtitle}</p>

                    ) : null}

                  </div>

                  <button

                    type="button"

                    onClick={onClose}

                    className="profile-modal-close-btn shrink-0"

                    aria-label="Close"

                  >

                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                    </svg>

                  </button>

                </div>

              </div>



              <div className="profile-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">

                <div className="profile-modal-drawer-body">{children}</div>

              </div>



              {footer ? (

                <div className="profile-modal-footer sticky bottom-0 shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">

                  {footer}

                </div>

              ) : null}

            </div>

          </motion.aside>

        </div>

      )}

    </AnimatePresence>

  );

}

