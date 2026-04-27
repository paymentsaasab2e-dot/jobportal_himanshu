'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Item = {
  label: string;
  path: string;
  icon: 'user' | 'edit' | 'applications' | 'assessments' | 'saved' | 'lms' | 'notifications' | 'settings' | 'help';
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  profilePhotoUrl: string | null;
  userName: string;
  userEmail: string;
  profileCompletion?: number | null;
};

const primaryActions: Item[] = [
  { label: 'View Profile', path: '/profile', icon: 'user' },
  { label: 'Edit CV', path: '/lms/resume-builder/editor', icon: 'edit' },
  { label: 'My Applications', path: '/applications', icon: 'applications' },
];

const secondaryActions: Item[] = [
  { label: 'Assessments', path: '/lms/quizzes', icon: 'assessments' },
  { label: 'Saved Jobs', path: '/explore-jobs', icon: 'saved' },
  { label: 'LMS', path: '/lms/courses', icon: 'lms' },
];

const systemActions: Item[] = [
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

const footerActions: Item[] = [
  { label: 'Help & Support', path: '/help', icon: 'help' },
];

function Icon({ icon }: Pick<Item, 'icon'>) {
  const shared = 'h-4 w-4 text-slate-600';
  switch (icon) {
    case 'user':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'applications':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'assessments':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'saved':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'lms':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'notifications':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0l-4.243 4.243m8.485 0l-4.243-4.243m-4.242 0l-4.243 4.243" />
        </svg>
      );
    case 'help':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.55 2.27c-.88.42-1.55 1.08-1.55 2.23" />
          <circle cx="12" cy="17.2" r=".7" />
        </svg>
      );
    default:
      return null;
  }
}

function DrawerItem({ item, onNavigate }: { item: Item; onNavigate: (path: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-slate-50"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100">
        <Icon icon={item.icon} />
      </span>
      <span className="text-sm font-medium text-slate-800">{item.label}</span>
    </button>
  );
}

export default function ProfilePanel({
  isOpen,
  onClose,
  onNavigate,
  profilePhotoUrl,
  userName,
  userEmail,
  profileCompletion,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const completion = typeof profileCompletion === 'number' ? Math.min(100, Math.max(0, Math.round(profileCompletion))) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10002]">
          <motion.button
            type="button"
            aria-label="Close profile panel"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute bottom-0 right-0 top-0 flex h-screen w-[96vw] flex-col rounded-l-2xl bg-white shadow-2xl sm:w-[430px] lg:w-[448px]"
          >
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-100">
                  {profilePhotoUrl ? (
                    <Image src={profilePhotoUrl} alt="User avatar" fill className="object-cover" unoptimized />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold text-slate-900">{userName || 'User'}</h3>
                  <p className="truncate text-sm text-slate-500">{userEmail || 'No email'}</p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    Job Seeker
                  </span>
                </div>
              </div>

              {completion !== null ? (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Profile completion</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                {primaryActions.map((item) => (
                  <DrawerItem key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="space-y-1">
                {secondaryActions.map((item) => (
                  <DrawerItem key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="space-y-1">
                {systemActions.map((item) => (
                  <DrawerItem key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="space-y-1 pb-4">
                {footerActions.map((item) => (
                  <DrawerItem key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
