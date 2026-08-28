'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Loader2,
  RefreshCw,
  CheckCheck,
  Settings,
  Trash2,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  partitionNotifications,
  sortNotificationsNewestFirst,
  NOTIFICATIONS_UPDATED_EVENT,
  type Notification,
} from '@/lib/notifications';
import { fetchProfileCompleteness } from '@/lib/profile-completion';
import { useTokensOptional } from '@/components/tokens/TokensContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';

const ALERT_FILTERS = ['All', 'Jobs', 'Interviews', 'System'] as const;
const ACTIVITY_FILTERS = ['All', 'Applications', 'Interviews', 'Courses'] as const;

const PAGE_SIZE = 8;
const PANEL_POLL_MS = 20_000;

type PanelTab = 'notifications' | 'activity';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
};

function getAlertFilterType(filter: (typeof ALERT_FILTERS)[number]): string | null {
  const map: Record<(typeof ALERT_FILTERS)[number], string | null> = {
    All: null,
    Jobs: 'job',
    Interviews: 'interview',
    System: 'system',
  };
  return map[filter];
}

function getActivityFilterType(filter: (typeof ACTIVITY_FILTERS)[number]): string | null {
  const map: Record<(typeof ACTIVITY_FILTERS)[number], string | null> = {
    All: null,
    Applications: 'application',
    Interviews: 'interview',
    Courses: 'course',
  };
  return map[filter];
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 15) return 'Now';
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationIcon({ type }: { type: string }) {
  const iconClass = 'h-4 w-4';
  switch (type) {
    case 'job':
    case 'saved-search':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case 'application':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'interview':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case 'course':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case 'system':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      );
    default:
      return <Bell className={iconClass} />;
  }
}

function getCardTheme(notification: Notification, isLive: boolean) {
  const kind = String(notification.metadata?.kind || '').toLowerCase();
  const isToken =
    kind === 'token_earn' ||
    kind === 'pending_earn' ||
    /\btokens?\b/i.test(notification.title) ||
    /\btokens?\b/i.test(notification.description || '');

  if (isLive && kind === 'pending_earn') {
    return {
      card: 'bg-emerald-50/55 ring-1 ring-emerald-200/70 hover:bg-emerald-50/80',
      iconWrap: 'bg-emerald-50 ring-1 ring-emerald-200/80 text-emerald-700',
      chip: 'bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-200/70',
      accent: '#10B981',
      isToken: true as const,
      chipLabel: 'Earn',
    };
  }
  if (isLive) {
    return {
      card: 'bg-amber-50/55 ring-1 ring-amber-200/80 hover:bg-amber-50/80',
      iconWrap: 'bg-amber-50 ring-1 ring-amber-200/80 text-amber-700',
      chip: 'bg-amber-50/90 text-amber-800 ring-1 ring-amber-200/70',
      accent: '#F59E0B',
      isToken: false as const,
      chipLabel: 'Action needed',
    };
  }
  if (isToken) {
    return {
      card: 'bg-amber-50/50 ring-1 ring-amber-200/80 hover:bg-amber-50/75',
      iconWrap: 'bg-amber-50 ring-1 ring-amber-200/80',
      chip: 'bg-amber-50/90 text-amber-900 ring-1 ring-amber-200/80',
      accent: '#F59E0B',
      isToken: true as const,
      chipLabel: 'Tokens',
    };
  }

  switch (notification.type) {
    case 'job':
    case 'saved-search':
      return {
        card: 'bg-sky-50/55 ring-1 ring-sky-200/70 hover:bg-sky-50/80',
        iconWrap: 'bg-sky-50 ring-1 ring-sky-200/70 text-sky-700',
        chip: 'bg-sky-50/90 text-sky-800 ring-1 ring-sky-200/70',
        accent: '#0EA5E9',
        isToken: false as const,
        chipLabel: 'Job',
      };
    case 'application':
      return {
        card: 'bg-violet-50/55 ring-1 ring-violet-200/70 hover:bg-violet-50/80',
        iconWrap: 'bg-violet-50 ring-1 ring-violet-200/70 text-violet-700',
        chip: 'bg-violet-50/90 text-violet-800 ring-1 ring-violet-200/70',
        accent: '#8B5CF6',
        isToken: false as const,
        chipLabel: 'Application',
      };
    case 'interview':
      return {
        card: 'bg-emerald-50/55 ring-1 ring-emerald-200/70 hover:bg-emerald-50/80',
        iconWrap: 'bg-emerald-50 ring-1 ring-emerald-200/70 text-emerald-700',
        chip: 'bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-200/70',
        accent: '#10B981',
        isToken: false as const,
        chipLabel: 'Interview',
      };
    case 'course':
      return {
        card: 'bg-orange-50/55 ring-1 ring-orange-200/70 hover:bg-orange-50/80',
        iconWrap: 'bg-orange-50 ring-1 ring-orange-200/70 text-orange-700',
        chip: 'bg-orange-50/90 text-orange-800 ring-1 ring-orange-200/70',
        accent: '#F97316',
        isToken: false as const,
        chipLabel: 'Course',
      };
    default:
      return {
        card: 'bg-slate-50/70 ring-1 ring-slate-200/80 hover:bg-slate-50',
        iconWrap: 'bg-slate-100 ring-1 ring-slate-200/80 text-slate-600',
        chip: 'bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/80',
        accent: '#64748B',
        isToken: false as const,
        chipLabel: 'System',
      };
  }
}

function NotificationTitle({ title, showTokenIcon }: { title: string; showTokenIcon: boolean }) {
  if (!showTokenIcon) {
    return <span className="truncate">{title}</span>;
  }

  // "+2 tokens earned" → +2 [coin] earned
  const leading = title.match(/^(\+?\d+)\s*tokens?\s*(.*)$/i);
  if (leading) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 truncate">
        <span className="shrink-0">{leading[1]}</span>
        <TokenCoinIcon className="h-3.5 w-3.5 shrink-0" />
        {leading[2] ? <span className="truncate">{leading[2]}</span> : null}
      </span>
    );
  }

  const parts = title.split(/(\+?\d+)\s*tokens?/i);
  if (parts.length >= 3) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 truncate">
        {parts[0] ? <span className="truncate">{parts[0].trimEnd()}</span> : null}
        {parts[1] ? <span className="shrink-0">{parts[1]}</span> : null}
        <TokenCoinIcon className="h-3.5 w-3.5 shrink-0" />
        {parts[2] ? <span className="truncate">{parts[2].trimStart()}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate">
      <span className="truncate">
        {title.replace(/\btokens?\b/gi, '').replace(/\s{2,}/g, ' ').trim()}
      </span>
      <TokenCoinIcon className="h-3.5 w-3.5 shrink-0" />
    </span>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case 'job':
    case 'saved-search':
      return 'Job';
    case 'application':
      return 'Application';
    case 'interview':
      return 'Interview';
    case 'course':
      return 'Course';
    case 'system':
      return 'System';
    default:
      return 'Update';
  }
}

function matchesTypeFilter(item: Notification, filterType: string | null, jobsBucket = false) {
  if (!filterType) return true;
  if (jobsBucket) return item.type === 'job' || item.type === 'saved-search';
  return item.type === filterType;
}

export default function NotificationPanel({ isOpen, onClose, onNavigate }: Props) {
  const [panelTab, setPanelTab] = useState<PanelTab>('notifications');
  const [alertFilter, setAlertFilter] = useState<(typeof ALERT_FILTERS)[number]>('All');
  const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]>('All');
  const [readView, setReadView] = useState<'unread' | 'read'>('unread');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tokensCtx = useTokensOptional();
  const earnLifecycleRef = useRef(tokensCtx?.earnLifecycle || []);
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const pendingReloadRef = useRef(false);

  earnLifecycleRef.current = tokensCtx?.earnLifecycle || [];

  const candidateId =
    typeof window !== 'undefined'
      ? localStorage.getItem('candidateId') || sessionStorage.getItem('candidateId') || ''
      : '';

  const buildLiveAlerts = useCallback(async () => {
    if (!candidateId) {
      setLiveAlerts([]);
      return;
    }

    const alerts: Notification[] = [];
    // Fresh "now" so live cards rank with latest-first sorting (still pinned via metadata.live)
    const stableTs = new Date().toISOString();

    try {
      const completeness = await fetchProfileCompleteness(candidateId);
      const missing = (completeness.missingSections || []).filter(Boolean);
      if (missing.length > 0 && completeness.percentage < 100) {
        alerts.push({
          id: 'live:profile-incomplete',
          type: 'system',
          title: 'Profile data incomplete',
          description: `Missing: ${missing.slice(0, 3).join(', ')}${
            missing.length > 3 ? '…' : ''
          }`,
          actionButton: 'Complete profile',
          actionPath: '/profile',
          timestamp: stableTs,
          isRead: false,
          metadata: {
            kind: 'profile_incomplete',
            channel: 'alert',
            live: true,
            percentage: completeness.percentage,
          },
        });
      }
    } catch {
      /* optional enrichment */
    }

    const lifecycle = earnLifecycleRef.current;
    const pending = lifecycle.filter(
      (task) => !task.done && !task.auto && task.id !== 'welcome',
    );
    if (pending.length > 0) {
      const total = pending.reduce((sum, t) => sum + (t.nextTokens || t.tokens || 0), 0);
      const top = pending.slice(0, 2).map((t) => t.name);
      alerts.push({
        id: 'live:pending-earn',
        type: 'system',
        title: `Pending earn · up to +${total} tokens`,
        description: `Complete: ${top.join(', ')}${pending.length > 2 ? '…' : ''}`,
        actionButton: 'View tasks',
        actionPath: '/subscriptions',
        timestamp: stableTs,
        isRead: false,
        metadata: {
          kind: 'pending_earn',
          channel: 'alert',
          live: true,
          count: pending.length,
          total,
        },
      });
    }

    setLiveAlerts((prev) => {
      // Avoid re-render loops when content is unchanged
      if (
        prev.length === alerts.length &&
        prev.every(
          (p, i) =>
            p.id === alerts[i]?.id &&
            p.title === alerts[i]?.title &&
            p.description === alerts[i]?.description,
        )
      ) {
        return prev;
      }
      return alerts;
    });
  }, [candidateId]);

  const loadNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!candidateId) return;
      if (loadingRef.current) {
        pendingReloadRef.current = true;
        return;
      }

      const silent = Boolean(opts?.silent) && hasLoadedRef.current;
      loadingRef.current = true;
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const response = await fetchNotifications(candidateId);
        if (response.success && response.data.notifications) {
          setNotifications(sortNotificationsNewestFirst(response.data.notifications));
        } else {
          setNotifications([]);
        }
        await buildLiveAlerts();
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        if (!silent) {
          setError('Failed to load notifications');
          setNotifications([]);
        }
      } finally {
        loadingRef.current = false;
        if (!silent) setLoading(false);
        if (pendingReloadRef.current) {
          pendingReloadRef.current = false;
          void loadNotifications({ silent: true });
        }
      }
    },
    [candidateId, buildLiveAlerts],
  );

  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      return;
    }

    void loadNotifications({ silent: false });

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    let debounceTimer: number | undefined;
    const scheduleReload = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        void loadNotifications({ silent: true });
      }, 250);
    };

    const handleUpdated = () => scheduleReload();

    // Same event floating toasts use — keep panel lined up with newest at top
    const handleChatUpdated = () => scheduleReload();

    document.addEventListener('keydown', handleEsc);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdated);
    window.addEventListener('saasa:hryantra-chat-updated', handleChatUpdated as EventListener);

    const poll = window.setInterval(() => {
      void loadNotifications({ silent: true });
    }, PANEL_POLL_MS);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdated);
      window.removeEventListener(
        'saasa:hryantra-chat-updated',
        handleChatUpdated as EventListener,
      );
      window.clearTimeout(debounceTimer);
      window.clearInterval(poll);
    };
    // Intentionally omit onClose / loadNotifications identity — only rebind when panel opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Refresh live earn/profile alerts when token lifecycle updates — without re-fetching all notifications
  useEffect(() => {
    if (!isOpen || !hasLoadedRef.current) return;
    void buildLiveAlerts();
  }, [isOpen, buildLiveAlerts, tokensCtx?.earnLifecycle?.length]);

  const { alerts: storedAlerts, activity: activityItems } = useMemo(() => {
    const partitioned = partitionNotifications(notifications);
    return {
      alerts: sortNotificationsNewestFirst(partitioned.alerts),
      activity: sortNotificationsNewestFirst(partitioned.activity),
    };
  }, [notifications]);

  const alertPool = useMemo(() => {
    // Prefer live profile/earn cards; hide duplicate stored pending_earn / profile alerts
    const liveKinds = new Set(
      liveAlerts.map((a) => String(a.metadata?.kind || '')).filter(Boolean),
    );
    const filteredStored = storedAlerts.filter((item) => {
      const kind = String(item.metadata?.kind || '');
      if (liveKinds.has(kind) && (kind === 'pending_earn' || kind === 'profile_incomplete')) {
        return false;
      }
      return true;
    });
    return sortNotificationsNewestFirst([...liveAlerts, ...filteredStored]);
  }, [liveAlerts, storedAlerts]);

  const categoryNotifications = useMemo(() => {
    if (panelTab === 'activity') {
      const filterType = getActivityFilterType(activityFilter);
      return sortNotificationsNewestFirst(
        activityItems.filter((item) => matchesTypeFilter(item, filterType)),
      );
    }
    const filterType = getAlertFilterType(alertFilter);
    return sortNotificationsNewestFirst(
      alertPool.filter((item) =>
        matchesTypeFilter(item, filterType, alertFilter === 'Jobs'),
      ),
    );
  }, [panelTab, activityFilter, alertFilter, activityItems, alertPool]);

  const unreadTotal = useMemo(
    () => categoryNotifications.filter((item) => !item.isRead).length,
    [categoryNotifications],
  );
  const readTotal = useMemo(
    () => categoryNotifications.filter((item) => item.isRead).length,
    [categoryNotifications],
  );

  const filteredNotifications = useMemo(() => {
    if (panelTab === 'activity') return categoryNotifications;
    return sortNotificationsNewestFirst(
      categoryNotifications.filter((item) =>
        readView === 'read' ? item.isRead : !item.isRead,
      ),
    );
  }, [categoryNotifications, readView, panelTab]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [panelTab, alertFilter, activityFilter, readView]);

  const firstNotificationId = filteredNotifications[0]?.id;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [firstNotificationId, panelTab, alertFilter, activityFilter]);

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredNotifications.length;

  const markAllAsRead = useCallback(async () => {
    if (!candidateId) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setLiveAlerts((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsAsRead(candidateId);
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (e) {
      console.warn('mark-all-read failed', e);
    }
  }, [candidateId]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!candidateId || notification.isRead || notification.metadata?.live) return;
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      try {
        await markNotificationAsRead(candidateId, notification.id);
        window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
      } catch (e) {
        console.warn('mark-as-read failed', e);
      }
    },
    [candidateId],
  );

  const handleDeleteNotification = useCallback(
    async (notification: Notification) => {
      if (!candidateId) return;
      if (notification.metadata?.live) {
        setLiveAlerts((prev) => prev.filter((item) => item.id !== notification.id));
        return;
      }
      setDeletingId(notification.id);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      try {
        await deleteNotification(candidateId, notification.id);
        window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
      } catch (e) {
        console.warn('delete notification failed', e);
        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === notification.id);
          return exists ? prev : [notification, ...prev];
        });
      } finally {
        setDeletingId(null);
      }
    },
    [candidateId],
  );

  const typeFilters = panelTab === 'notifications' ? ALERT_FILTERS : ACTIVITY_FILTERS;
  const activeTypeFilter = panelTab === 'notifications' ? alertFilter : activityFilter;

  const alertUnreadBadge = useMemo(
    () => alertPool.filter((n) => !n.isRead).length,
    [alertPool],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001]">
          <motion.button
            type="button"
            aria-label="Close notifications panel"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute bottom-0 right-0 top-0 flex h-screen w-[96vw] flex-col rounded-l-2xl bg-white shadow-2xl sm:w-[430px] lg:w-[448px]"
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 pt-5 pb-3.5 backdrop-blur-sm sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[22px]">
                  {panelTab === 'notifications' ? 'Notifications' : 'Activity'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void loadNotifications({ silent: false })}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-sky-600"
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('/settings#section-notifications');
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-sky-600"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  {panelTab === 'notifications' ? (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="ml-1 inline-flex h-8 items-center gap-1 rounded-full bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Read all</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1">
                <button
                  type="button"
                  onClick={() => setPanelTab('notifications')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    panelTab === 'notifications'
                      ? 'bg-white text-[#08428c] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {alertUnreadBadge > 0 ? (
                    <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                      {alertUnreadBadge}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('activity')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    panelTab === 'activity'
                      ? 'bg-white text-[#08428c] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Activity
                  <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {activityItems.length}
                  </span>
                </button>
              </div>

              <div className="mt-3.5 flex gap-1 overflow-x-auto pb-0.5">
                {typeFilters.map((filter) => {
                  const active = filter === activeTypeFilter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        if (panelTab === 'notifications') {
                          setAlertFilter(filter as (typeof ALERT_FILTERS)[number]);
                        } else {
                          setActivityFilter(filter as (typeof ACTIVITY_FILTERS)[number]);
                        }
                      }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-[#08428c] text-white shadow-sm'
                          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {panelTab === 'notifications' ? (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setReadView('unread')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      readView === 'unread'
                        ? 'bg-white text-sky-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Unread
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        readView === 'unread'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {unreadTotal}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadView('read')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      readView === 'read'
                        ? 'bg-white text-sky-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Read
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        readView === 'read'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {readTotal}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/40 px-3 py-3 sm:px-4" ref={scrollContainerRef}>
              {error ? (
                <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
              ) : null}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                    {panelTab === 'activity' ? (
                      <Activity className="h-7 w-7 text-slate-400" />
                    ) : (
                      <Bell className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <h4 className="mb-1.5 text-base font-semibold text-slate-900">
                    {panelTab === 'activity'
                      ? 'No activity yet'
                      : readView === 'read'
                        ? 'No read notifications'
                        : 'No unread notifications'}
                  </h4>
                  <p className="max-w-[240px] text-sm text-slate-500">
                    {panelTab === 'activity'
                      ? 'Applications, courses, and interviews you take will show up here.'
                      : readView === 'read'
                        ? 'Opened notifications appear here.'
                        : 'You’re all caught up for now.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {visibleNotifications.map((notification, index) => {
                        const isLive = Boolean(notification.metadata?.live);
                        const kind = String(notification.metadata?.kind || '');
                        const unread = !notification.isRead;
                        const theme = getCardTheme(notification, isLive);
                        const chipLabel = theme.chipLabel || typeLabel(notification.type);
                        const hasAction = Boolean(
                          notification.actionButton && notification.actionPath,
                        );
                        // Prefer action over body copy to keep cards uncluttered
                        const secondary = hasAction
                          ? null
                          : notification.description
                            ? notification.description
                            : null;

                        return (
                          <motion.article
                            key={notification.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15, delay: Math.min(index, 6) * 0.015 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`group relative cursor-pointer overflow-hidden rounded-xl px-3 py-2.5 transition ${theme.card}`}
                          >
                            {unread ? (
                              <span
                                className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full"
                                style={{ backgroundColor: theme.accent }}
                              />
                            ) : null}

                            <div className="flex gap-3">
                              <div
                                className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.iconWrap}`}
                              >
                                {theme.isToken ? (
                                  <TokenCoinIcon className="h-4 w-4" />
                                ) : isLive && kind === 'pending_earn' ? (
                                  <Gift className="h-4 w-4" />
                                ) : isLive ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : (
                                  <NotificationIcon type={notification.type} />
                                )}
                                {unread ? (
                                  <span
                                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white"
                                    style={{ backgroundColor: theme.accent }}
                                  />
                                ) : null}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold leading-4 ${theme.chip}`}
                                  >
                                    {chipLabel}
                                  </span>
                                  <span className="ml-auto shrink-0 text-[11px] font-medium text-slate-400">
                                    {isLive ? 'Now' : formatTimestamp(notification.timestamp)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeleteNotification(notification);
                                    }}
                                    disabled={deletingId === notification.id}
                                    className="shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-white/70 hover:text-rose-500 disabled:opacity-50 sm:opacity-50 sm:group-hover:opacity-100"
                                    title={isLive ? 'Dismiss' : 'Delete'}
                                    aria-label={isLive ? 'Dismiss' : 'Delete'}
                                  >
                                    {deletingId === notification.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>

                                <h4 className="mt-1.5 truncate text-sm font-semibold leading-5 text-slate-900">
                                  <NotificationTitle
                                    title={notification.title}
                                    showTokenIcon={theme.isToken}
                                  />
                                </h4>

                                {secondary ? (
                                  <p className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-slate-500">
                                    {secondary}
                                  </p>
                                ) : null}

                                {hasAction ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleNotificationClick(notification);
                                      onNavigate(notification.actionPath as string);
                                    }}
                                    className="mt-1.5 inline-flex items-center text-xs font-semibold text-[#08428c] hover:underline"
                                  >
                                    {notification.actionButton}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="pb-8 pt-5 text-center">
                    {canLoadMore ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-[#08428c]"
                      >
                        Load more
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
