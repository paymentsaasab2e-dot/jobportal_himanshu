'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import {
  profileAvatarInitialsClass,
  profileAvatarSurfaceClass,
} from '@/lib/profile-avatar';

type Item = {
  label: string;
  path: string;
  icon:
    | 'courses'
    | 'aiCv'
    | 'interview'
    | 'quizzes'
    | 'events'
    | 'settings'
    | 'help';
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  profilePhotoUrl: string | null;
  profileInitials: string;
  userName: string;
  userEmail: string;
  profileCompletion?: number | null;
};

const drawerMenuActions: Item[] = [
  { label: 'AI CV Editor', path: '/lms/resume-builder/editor', icon: 'aiCv' },
  { label: 'Help & Support', path: '/help', icon: 'help' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

function Icon({ icon }: Pick<Item, 'icon'>) {
  const shared = 'h-4 w-4 text-slate-600';
  switch (icon) {
    case 'courses':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'aiCv':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M5 19h14" />
          <path d="M8 16h8" />
        </svg>
      );
    case 'interview':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <path d="M12 19v4" />
          <path d="M8 23h8" />
        </svg>
      );
    case 'quizzes':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'events':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
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

function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4 text-rose-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function ProfilePanel({
  isOpen,
  onClose,
  onNavigate,
  profilePhotoUrl,
  profileInitials,
  userName,
  userEmail,
  profileCompletion,
}: Props) {
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    onClose();
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

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
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/55 ring-1 ring-white/80 ${profileAvatarSurfaceClass}`}
                >
                  {profilePhotoUrl ? (
                    <Image src={profilePhotoUrl} alt="User avatar" fill className="object-cover" unoptimized />
                  ) : (
                    <span className={`text-lg ${profileAvatarInitialsClass}`}>
                      {profileInitials}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-slate-900 tracking-tight">{userName || 'User'}</h3>
                  <p className="truncate text-sm font-medium text-slate-500">{userEmail || 'No email'}</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-100 uppercase tracking-wider">
                      Job Seeker
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
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

            <div className="profile-modal-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1 pb-4">
                {drawerMenuActions.map((item) => (
                  <DrawerItem key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="shrink-0 border-t border-slate-200 px-4 py-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-50">
                    <LogoutIcon />
                  </span>
                  <span className="text-sm font-medium text-rose-700">
                    {isLoggingOut ? 'Logging out…' : 'Log out'}
                  </span>
                </button>
              </div>
            ) : null}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
