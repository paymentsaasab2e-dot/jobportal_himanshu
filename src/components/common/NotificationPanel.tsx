'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import { fetchNotifications, type Notification } from '@/lib/notifications';

const FILTERS = ['All', 'Jobs', 'Applications', 'Interviews', 'Courses', 'System'] as const;

const PAGE_SIZE = 4;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
};

const getFilterType = (filter: (typeof FILTERS)[number]): string | null => {
  const filterMap: Record<(typeof FILTERS)[number], string | null> = {
    All: null,
    Jobs: 'job',
    Applications: 'application',
    Interviews: 'interview',
    Courses: 'course',
    System: 'system',
  };
  return filterMap[filter];
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4";
  switch (type) {
    case 'job':
    case 'saved-search':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'application':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'interview':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'course':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'system':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    default:
      return <Bell className={iconClass} />;
  }
}

function getNotificationColor(type: string): { barColor: string; barColorValue: string } {
  switch (type) {
    case 'job':
    case 'saved-search':
      return { barColor: 'bg-blue-100', barColorValue: '#3B82F6' };
    case 'application':
      return { barColor: 'bg-purple-100', barColorValue: '#A855F7' };
    case 'interview':
      return { barColor: 'bg-green-100', barColorValue: '#22C55E' };
    case 'course':
      return { barColor: 'bg-orange-100', barColorValue: '#F97316' };
    case 'system':
      return { barColor: 'bg-gray-100', barColorValue: '#6B7280' };
    default:
      return { barColor: 'bg-gray-100', barColorValue: '#6B7280' };
  }
}

export default function NotificationPanel({ isOpen, onClose, onNavigate }: Props) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') || '' : '';

  const loadNotifications = useCallback(async () => {
    if (!candidateId) return;
    
    try {
      setLoading(true);
      setError(null);
      const type = activeFilter === 'All' ? undefined : activeFilter.toLowerCase().replace('s', '') as any;
      const response = await fetchNotifications(candidateId, type);
      
      if (response.success && response.data.notifications) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId, activeFilter]);

  useEffect(() => {
    if (!isOpen) return;
    
    loadNotifications();
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, loadNotifications]);

  const filteredNotifications = useMemo(() => {
    const filterType = getFilterType(activeFilter);
    if (!filterType) return notifications;
    return notifications.filter((item) => {
      if (activeFilter === 'Jobs') return item.type === 'job' || item.type === 'saved-search';
      return item.type === filterType;
    });
  }, [activeFilter, notifications]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter]);

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredNotifications.length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

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
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-slate-900">Notifications</h3>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
                >
                  Mark all as read
                </button>
              </div>
              <div className="mt-4 flex gap-5 overflow-x-auto pb-1">
                {FILTERS.map((filter) => {
                  const active = filter === activeFilter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`relative shrink-0 pb-2 text-sm font-medium transition-colors ${active ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {filter}
                      {active ? <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-sky-500" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-900 mb-2">No notifications</h4>
                  <p className="text-sm text-slate-500 max-w-xs">
                    {activeFilter === 'All' 
                      ? "You're all caught up! Check back later for job matches, application updates, and more."
                      : `No ${activeFilter.toLowerCase()} notifications yet.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {visibleNotifications.map((notification, index) => {
                        const colors = getNotificationColor(notification.type);
                        return (
                          <motion.article
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, delay: index * 0.03 }}
                            className={`relative rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                              notification.isRead
                                ? 'border-slate-200 bg-white'
                                : 'border-sky-100 bg-sky-50/55'
                            }`}
                          >
                            <span
                              className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl"
                              style={{ backgroundColor: colors.barColorValue }}
                            />
                            <div className="flex items-start gap-3 pl-3">
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${colors.barColor} text-slate-700`}>
                                <NotificationIcon type={notification.type} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="text-base font-medium leading-6 text-slate-900">{notification.title}</h4>
                                  <div className="shrink-0 pt-0.5 text-sm text-slate-500">{formatTimestamp(notification.timestamp)}</div>
                                </div>
                                <p className="mt-1.5 text-sm leading-6 text-slate-600">{notification.description}</p>
                                {notification.actionButton && notification.actionPath && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(notification.actionPath)}
                                    className="mt-3.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                                  >
                                    {notification.actionButton}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="pb-8 pt-6 text-center">
                    {canLoadMore ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="rounded-md bg-sky-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                      >
                        Load More
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
