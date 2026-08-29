'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  BookOpen,
  Gift,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useTokensOptional } from '@/components/tokens/TokensContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import {
  openHryantraVerifiedChatInApp,
  pushHryantraVerifiedMessage,
} from '@/lib/hryantra-verified-chat-store';
import ProfileMissingSectionNudge from '@/components/profile/ProfileMissingSectionNudge';
import {
  fetchNotifications,
  getNotificationChannel,
  sortNotificationsNewestFirst,
  NOTIFICATIONS_UPDATED_EVENT,
  type Notification,
} from '@/lib/notifications';
import { fetchProfileCompleteness } from '@/lib/profile-completion';
import {
  getMissingProfileSections,
  type ProfileMissingSection,
} from '@/lib/profile-section-routes';
import {
  AppLocale,
  localizePath,
  stripLocaleFromPathname,
} from '@/lib/i18n';
import {
  localizeEarnPath,
  resolveEarnTaskHref,
} from '@/lib/earn-lifecycle';

const POLL_MS = 45_000;
const FLOAT_DURATION_MS = 7_000;
const MAX_FLOATS = 4;
const SEEN_KEY_PREFIX = 'saasa:seen-notif-ids:';
const EARN_DISMISS_PREFIX = 'saasa:earn-float-dismissed:';
const EARN_RESHOW_MS = 30 * 60 * 1000;

type FloatItem = {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  kind: 'alert' | 'activity' | 'suggestion' | 'earn';
  type?: string;
  createdAt: number;
};

function loadSeenIds(candidateId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(`${SEEN_KEY_PREFIX}${candidateId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(candidateId: string, ids: Set<string>) {
  const list = [...ids].slice(-200);
  sessionStorage.setItem(`${SEEN_KEY_PREFIX}${candidateId}`, JSON.stringify(list));
}

function iconForFloat(item: FloatItem) {
  if (item.kind === 'earn') return Gift;
  if (item.kind === 'activity') return Activity;
  if (item.kind === 'suggestion') return AlertTriangle;
  switch (item.type) {
    case 'job':
    case 'saved-search':
      return Briefcase;
    case 'interview':
      return Calendar;
    case 'course':
      return BookOpen;
    case 'application':
      return Activity;
    default:
      return Bell;
  }
}

function shellForFloat(item: FloatItem) {
  if (item.kind === 'earn') {
    return {
      card: 'border-emerald-200/90',
      icon: 'bg-emerald-100 text-emerald-700',
      accent: 'bg-emerald-500',
      label: 'Earn',
    };
  }
  if (item.kind === 'suggestion') {
    return {
      card: 'border-amber-200/90',
      icon: 'bg-amber-100 text-amber-700',
      accent: 'bg-amber-500',
      label: 'Suggestion',
    };
  }
  if (item.kind === 'activity') {
    return {
      card: 'border-violet-200/90',
      icon: 'bg-violet-100 text-violet-700',
      accent: 'bg-violet-500',
      label: 'Activity',
    };
  }
  return {
    card: 'border-sky-200/90',
    icon: 'bg-sky-100 text-sky-700',
    accent: 'bg-sky-500',
    label: 'Alert',
  };
}

function shouldHideOnPath(pathname: string | null): boolean {
  const path = stripLocaleFromPathname(pathname || '/');
  // Public / marketing surfaces — never show Earn / Profile Alert / floats here,
  // even if a session cookie still exists.
  const exact = new Set([
    '/',
    '/login',
    '/signup',
    '/whatsapp',
    '/apply',
    '/searchjobs',
    '/courses',
    '/sa',
    '/candmain',
    '/employers',
    '/events',
    '/services',
    '/ats-check',
    '/explore-jobs',
    '/aboutus',
    '/contact',
    '/privacypolicy',
    '/terms',
    '/trust-safety',
    '/help',
    '/faq',
    '/executive-services',
  ]);
  if (exact.has(path)) return true;
  return (
    path.startsWith('/whatsapp/') ||
    path.startsWith('/apply/') ||
    path.startsWith('/searchjobs/') ||
    path.startsWith('/courses/') ||
    path.startsWith('/sa/') ||
    path.startsWith('/candmain/') ||
    path.startsWith('/employers/') ||
    path.startsWith('/events/') ||
    path.startsWith('/services/') ||
    path.startsWith('/explore-jobs/') ||
    path.startsWith('/lms/interview-prep/live-room')
  );
}

export function FloatingAlertsHost() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const tokensCtx = useTokensOptional();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const [mounted, setMounted] = useState(false);
  const [missingSections, setMissingSections] = useState<ProfileMissingSection[]>([]);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [earnVisible, setEarnVisible] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);
  const timersRef = useRef<Map<string, number>>(new Map());

  const candidateId = user?.id || '';
  const loggedIn = Boolean(mounted && !isLoading && isAuthenticated && token && candidateId);
  const hidden = shouldHideOnPath(pathname);

  const pendingEarn = useMemo(() => {
    const lifecycle = tokensCtx?.earnLifecycle || [];
    return lifecycle.filter((t) => !t.done && !t.auto && t.id !== 'welcome');
  }, [tokensCtx?.earnLifecycle]);

  const earnTotal = useMemo(
    () => pendingEarn.reduce((s, t) => s + (t.nextTokens || t.tokens || 0), 0),
    [pendingEarn],
  );

  const pushFloat = useCallback((item: Omit<FloatItem, 'createdAt'>) => {
    setFloats((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      const next: FloatItem = { ...item, createdAt: Date.now() };
      return [next, ...prev].slice(0, MAX_FLOATS);
    });
    const existing = timersRef.current.get(item.id);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setFloats((prev) => prev.filter((p) => p.id !== item.id));
      timersRef.current.delete(item.id);
    }, FLOAT_DURATION_MS);
    timersRef.current.set(item.id, timer);
  }, []);

  const dismissFloat = useCallback((id: string) => {
    setFloats((prev) => prev.filter((p) => p.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  // Profile completeness → missing sections (app-wide nudge)
  const refreshMissing = useCallback(async () => {
    if (!candidateId) {
      setMissingSections([]);
      return;
    }
    try {
      const details = await fetchProfileCompleteness(candidateId);
      const missing = getMissingProfileSections(null, details);
      setMissingSections(missing);
      if (missing.length > 0 && bootstrappedRef.current) {
        // Only float a suggestion when sections change after first load
      }
    } catch {
      /* non-fatal */
    }
  }, [candidateId]);

  // Poll + event: float every new notification / activity / alert
  const syncNotifications = useCallback(
    async (opts?: { bootstrap?: boolean }) => {
      if (!candidateId) return;
      try {
        const res = await fetchNotifications(candidateId);
        const list = sortNotificationsNewestFirst(res.data?.notifications || []);
        if (opts?.bootstrap || !bootstrappedRef.current) {
          seenRef.current = new Set(list.map((n) => n.id));
          saveSeenIds(candidateId, seenRef.current);
          bootstrappedRef.current = true;
          return;
        }

        const fresh: Notification[] = [];
        for (const n of list) {
          if (seenRef.current.has(n.id)) continue;
          seenRef.current.add(n.id);
          fresh.push(n);
        }
        if (fresh.length > 0) {
          saveSeenIds(candidateId, seenRef.current);
          // Newest first in list; push oldest→newest so stack ends with latest on top
          const ordered = sortNotificationsNewestFirst(fresh).slice(0, MAX_FLOATS);
          for (const n of [...ordered].reverse()) {
            const kindMeta = String(n.metadata?.kind || '');
            // Dedicated top-stack cards handle earn + profile — skip duplicates
            if (
              kindMeta === 'pending_earn' ||
              kindMeta === 'profile_incomplete' ||
              /pending.?earn|earn up to|complete basic details|profile incomplete/i.test(
                `${n.title} ${n.description || ''}`,
              )
            ) {
              continue;
            }

            const channel = getNotificationChannel(n);
            const isSuggestion =
              kindMeta === 'job_recommendation' ||
              kindMeta === 'profile_view' ||
              /recommend|viewed your profile/i.test(n.title);

            pushFloat({
              id:
                typeof n.metadata?.messageId === 'string' && n.metadata.messageId
                  ? `hryantra-${n.metadata.messageId}`
                  : n.id,
              title: n.title,
              description: n.description,
              actionLabel: n.actionButton,
              actionPath: n.actionPath,
              kind: isSuggestion
                ? 'suggestion'
                : channel === 'activity'
                  ? 'activity'
                  : 'alert',
              type: n.type,
            });
          }
        }
      } catch {
        /* non-fatal */
      }
    },
    [candidateId, pushFloat],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loggedIn || hidden) return;

    seenRef.current = loadSeenIds(candidateId);
    bootstrappedRef.current = seenRef.current.size > 0;

    void refreshMissing();
    void syncNotifications({ bootstrap: !bootstrappedRef.current });

    const poll = window.setInterval(() => {
      void refreshMissing();
      void syncNotifications();
    }, POLL_MS);

    const onUpdated = () => {
      window.setTimeout(() => void syncNotifications(), 350);
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);

    // Instant float when HRYantra pushes a message (before bell API round-trip).
    // Same id as API path so the poll does not stack a duplicate card.
    type ChatUpdatedDetail = {
      userId?: string;
      fromSystem?: boolean;
      messageId?: string;
      lastMessagePreview?: string;
      notificationTitle?: string;
      notificationActionButton?: string;
      notificationActionPath?: string;
    };
    const onChatUpdated = (event: Event) => {
      const d = (event as CustomEvent<ChatUpdatedDetail>).detail;
      if (!d?.fromSystem || !d.lastMessagePreview) return;
      if (d.userId && d.userId !== candidateId) return;
      const preview = String(d.lastMessagePreview).trim();
      if (!preview) return;
      const floatId = d.messageId
        ? `hryantra-${d.messageId}`
        : `hryantra-preview-${preview.slice(0, 80)}`;
      pushFloat({
        id: floatId,
        title: d.notificationTitle || 'New message from HRYantra',
        description: preview,
        actionLabel: d.notificationActionButton || 'Open chat',
        actionPath: d.notificationActionPath || '/community',
        kind: 'alert',
        type: 'system',
      });
    };
    window.addEventListener('saasa:hryantra-chat-updated', onChatUpdated as EventListener);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
      window.removeEventListener('saasa:hryantra-chat-updated', onChatUpdated as EventListener);
    };
  }, [
    loggedIn,
    candidateId,
    hidden,
    refreshMissing,
    syncNotifications,
    pushFloat,
  ]);

  // Logged out / public page → clear any leftover cards immediately
  useEffect(() => {
    if (loggedIn && !hidden) return;
    setFloats([]);
    setEarnVisible(false);
    setMissingSections([]);
    bootstrappedRef.current = false;
  }, [loggedIn, hidden]);
  // Pending earn floating nudge (dismissible, 30m cooldown)
  useEffect(() => {
    if (!loggedIn || hidden || pendingEarn.length === 0) {
      setEarnVisible(false);
      return;
    }
    const key = `${EARN_DISMISS_PREFIX}${candidateId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { at?: number; sig?: string };
        const sig = pendingEarn.map((t) => t.id).join('|');
        if (
          parsed.sig === sig &&
          typeof parsed.at === 'number' &&
          Date.now() - parsed.at < EARN_RESHOW_MS
        ) {
          setEarnVisible(false);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setEarnVisible(true);
  }, [loggedIn, candidateId, hidden, pendingEarn]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  if (!loggedIn || hidden) {
    return null;
  }

  const dismissEarn = () => {
    const sig = pendingEarn.map((t) => t.id).join('|');
    localStorage.setItem(
      `${EARN_DISMISS_PREFIX}${candidateId}`,
      JSON.stringify({ at: Date.now(), sig }),
    );
    setEarnVisible(false);
  };

  const openEarn = () => {
    const top = pendingEarn[0];
    const href = top
      ? localizeEarnPath(resolveEarnTaskHref(top), locale)
      : localizePath('/subscriptions', locale);
    dismissEarn();
    if (candidateId) {
      pushHryantraVerifiedMessage({
        userId: candidateId,
        text: top
          ? `New suggestion: ${top.name}. Tap below to continue.`
          : 'You have new suggestions waiting.',
        actionUrl: href,
      });
      openHryantraVerifiedChatInApp(candidateId);
    }
    router.push(localizePath('/community', locale));
  };

  const navigateFloat = (item: FloatItem) => {
    dismissFloat(item.id);
    if (candidateId) {
      pushHryantraVerifiedMessage({
        userId: candidateId,
        text: item.description || item.title,
        actionUrl: item.actionPath
          ? localizePath(item.actionPath, locale)
          : undefined,
      });
      openHryantraVerifiedChatInApp(candidateId);
      router.push(localizePath('/community', locale));
      return;
    }
    if (item.actionPath) {
      router.push(localizePath(item.actionPath, locale));
    }
  };

  const showEarn = earnVisible && pendingEarn.length > 0;
  const showProfile = missingSections.length > 0;
  const showStack = showEarn || showProfile || floats.length > 0;

  if (!showStack) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed right-3 z-[10900] flex w-[min(340px,calc(100vw-1.5rem))] flex-col gap-2.5 sm:right-5"
      style={{ top: 'calc(var(--app-header-height, 96px) + 0.75rem)' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {showEarn ? (
          <motion.div
            key="earn-nudge"
            layout
            initial={{ opacity: 0, y: -28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{
              layout: { type: 'spring', damping: 28, stiffness: 340 },
              type: 'spring',
              damping: 26,
              stiffness: 320,
            }}
            style={{ position: 'relative' }}
            className="pointer-events-auto overflow-hidden rounded-xl border border-emerald-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="flex">
              <span className="w-1.5 shrink-0 bg-emerald-500" aria-hidden />
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Gift className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Earn
                      </span>
                      <button
                        type="button"
                        onClick={dismissEarn}
                        className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Dismiss earn suggestion"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 text-sm font-semibold leading-snug text-slate-900">
                      Earn up to +{earnTotal}
                      <TokenCoinIcon className="h-3.5 w-3.5" />
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {pendingEarn
                        .slice(0, 2)
                        .map((t) => t.name)
                        .join(', ')}
                      {pendingEarn.length > 2 ? '…' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={openEarn}
                      className="mt-2.5 inline-flex rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Complete task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {showProfile ? (
          <motion.div
            key="profile-nudge"
            layout
            initial={{ opacity: 0, y: -28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{
              layout: { type: 'spring', damping: 28, stiffness: 340 },
              type: 'spring',
              damping: 26,
              stiffness: 320,
            }}
            style={{ position: 'relative' }}
            className="pointer-events-auto"
          >
            <ProfileMissingSectionNudge
              locale={locale}
              missingSections={missingSections}
              onNavigate={(href) => router.push(href)}
              storageKeyPrefix={`${candidateId}:profileMissingNudge`}
              placement="inline"
            />
          </motion.div>
        ) : null}

        {floats.map((item) => {
          const Icon = iconForFloat(item);
          const shell = shellForFloat(item);
          const showCoin = /\btokens?\b/i.test(item.title);
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{
                layout: { type: 'spring', damping: 28, stiffness: 340 },
                type: 'spring',
                damping: 26,
                stiffness: 320,
              }}
              style={{ position: 'relative' }}
              className={`pointer-events-auto overflow-hidden rounded-xl border bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md ${shell.card}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex">
                <span className={`w-1.5 shrink-0 ${shell.accent}`} aria-hidden />
                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${shell.icon}`}
                    >
                      {item.kind === 'earn' || showCoin ? (
                        <TokenCoinIcon className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {shell.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => dismissFloat(item.id)}
                          className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">
                        {showCoin ? (
                          <span className="inline-flex flex-wrap items-center gap-1">
                            {item.title
                              .replace(/\btokens?\b/gi, '')
                              .replace(/\s{2,}/g, ' ')
                              .trim()}
                            <TokenCoinIcon className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          item.title
                        )}
                      </p>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      ) : null}
                      {item.actionLabel && item.actionPath ? (
                        <button
                          type="button"
                          onClick={() => navigateFloat(item)}
                          className="mt-2.5 inline-flex rounded-full bg-[#176F96] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0F5A7A]"
                        >
                          {item.actionLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
