'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { useTokensOptional } from '@/components/tokens/TokensContext';
import {
  profileAvatarInitialsClass,
  profileAvatarSurfaceClass,
} from '@/lib/profile-avatar';

type ItemIcon = 'aiCv' | 'subscriptions' | 'community' | 'help' | 'settings';

type Item = {
  label: string;
  path: string;
  icon: ItemIcon;
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
  { label: 'Tokens', path: '/subscriptions', icon: 'subscriptions' },
  { label: 'Office Gossips', path: '/community', icon: 'community' },
  { label: 'Help & Support', path: '/help', icon: 'help' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

/** Compact tinted shells — amber only for coin / subscriptions. */
const ICON_SHELL: Record<ItemIcon, string> = {
  aiCv: 'bg-sky-50 ring-1 ring-sky-200/70',
  subscriptions: 'bg-amber-50 ring-1 ring-amber-200/80',
  community: 'bg-orange-50 ring-1 ring-orange-200/70',
  help: 'bg-emerald-50 ring-1 ring-emerald-200/70',
  settings: 'bg-slate-100 ring-1 ring-slate-200/80',
};

const ASSET_ICONS: Partial<Record<ItemIcon, { src: string; alt: string }>> = {
  aiCv: { src: '/icons/edit.png', alt: 'AI CV Editor' },
  community: { src: '/icons/chat.png', alt: 'Office Gossips' },
  settings: { src: '/icons/control.png', alt: 'Settings' },
};

function MenuIcon({ icon }: { icon: ItemIcon }) {
  const asset = ASSET_ICONS[icon];
  if (asset) {
    return (
      <Image
        src={asset.src}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 object-contain"
        aria-hidden
      />
    );
  }
  if (icon === 'subscriptions') {
    return <TokenCoinIcon className="h-4 w-4" />;
  }
  return <CircleHelp className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2.2} aria-hidden />;
}

function DrawerItem({
  item,
  onNavigate,
  trailing,
}: {
  item: Item;
  onNavigate: (path: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${ICON_SHELL[item.icon]}`}
      >
        <MenuIcon icon={item.icon} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{item.label}</span>
      {trailing}
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
  const tokensCtx = useTokensOptional();
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
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
                      {userName || 'User'}
                    </h3>
                    <button
                      type="button"
                      title="Verified"
                      aria-label="Verified"
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <Image
                        src="/icons/correct.png"
                        alt="Verified"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-cover"
                        title="Verified"
                      />
                    </button>
                    {tokensCtx ? (
                      <span
                        title="Token balance"
                        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold tabular-nums text-amber-900 ring-1 ring-amber-200"
                      >
                        <TokenCoinIcon className="h-5 w-5" />
                        {tokensCtx.balance}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-medium text-slate-500">{userEmail || 'No email'}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      Employee
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
                  <DrawerItem
                    key={item.label}
                    item={item}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="shrink-0 border-t border-slate-200 px-4 py-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-rose-400 bg-rose-50">
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
