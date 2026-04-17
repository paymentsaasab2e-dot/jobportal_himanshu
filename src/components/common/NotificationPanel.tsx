'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type NotificationType = 'job' | 'application' | 'interview' | 'course' | 'system' | 'saved-search';

interface NotificationItem {
  id: number;
  type: NotificationType;
  icon: 'briefcase' | 'document' | 'calendar' | 'book' | 'server' | 'folder';
  barColor: string;
  barColorValue: string;
  title: string;
  description: string;
  actionButton: string;
  actionPath: string;
  timestamp: string;
  isRead: boolean;
}

const FILTERS = ['All', 'Jobs', 'Applications', 'Interviews', 'Courses', 'System'] as const;

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'job',
    icon: 'briefcase',
    barColor: 'bg-blue-100',
    barColorValue: '#3B82F6',
    title: '3 new jobs match your profile!',
    description: 'AI recommendations for "Senior React Developer" roles in London.',
    actionButton: 'View Jobs',
    actionPath: '/explore-jobs',
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: 2,
    type: 'application',
    icon: 'document',
    barColor: 'bg-purple-100',
    barColorValue: '#A855F7',
    title: 'Application for "Product Manager" updated to "Under Review"',
    description: 'Your application for Google has moved to the next stage.',
    actionButton: 'Track Application',
    actionPath: '/applications/1',
    timestamp: '1 day ago',
    isRead: false,
  },
  {
    id: 3,
    type: 'interview',
    icon: 'calendar',
    barColor: 'bg-green-100',
    barColorValue: '#22C55E',
    title: 'Interview scheduled with Tech Solutions for "Software Engineer"',
    description: 'Date: Oct 26, 2023, 10:00 AM. Location: Virtual.',
    actionButton: 'View Interview Details',
    actionPath: '/applications/1',
    timestamp: '2 days ago',
    isRead: false,
  },
  {
    id: 4,
    type: 'course',
    icon: 'book',
    barColor: 'bg-orange-100',
    barColorValue: '#F97316',
    title: 'New course "Advanced TypeScript" available!',
    description: 'Enhance your front-end skills with our latest offering.',
    actionButton: 'View Course',
    actionPath: '/courses',
    timestamp: '3 days ago',
    isRead: false,
  },
  {
    id: 5,
    type: 'system',
    icon: 'server',
    barColor: 'bg-gray-100',
    barColorValue: '#6B7280',
    title: 'Platform update: New AI matching algorithm deployed',
    description: 'Experience even more accurate job recommendations with our enhanced system.',
    actionButton: 'Learn More',
    actionPath: '/candidate-dashboard',
    timestamp: '4 days ago',
    isRead: false,
  },
  {
    id: 6,
    type: 'saved-search',
    icon: 'folder',
    barColor: 'bg-blue-100',
    barColorValue: '#3B82F6',
    title: 'Your saved search "Data Scientist" has 5 new openings!',
    description: "Don't miss out on these exciting opportunities.",
    actionButton: 'View Jobs',
    actionPath: '/explore-jobs',
    timestamp: '1 week ago',
    isRead: false,
  },
  {
    id: 7,
    type: 'application',
    icon: 'document',
    barColor: 'bg-purple-100',
    barColorValue: '#A855F7',
    title: 'Follow-up needed for "Marketing Specialist" application',
    description: 'Consider sending a polite follow-up email to the recruiter.',
    actionButton: 'Track Application',
    actionPath: '/applications/2',
    timestamp: '1 week ago',
    isRead: false,
  },
];

const PAGE_SIZE = 4;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
};

const getFilterType = (filter: (typeof FILTERS)[number]): NotificationType | null => {
  const filterMap: Record<(typeof FILTERS)[number], NotificationType | null> = {
    All: null,
    Jobs: 'job',
    Applications: 'application',
    Interviews: 'interview',
    Courses: 'course',
    System: 'system',
  };
  return filterMap[filter];
};

function NotificationIcon({ icon }: { icon: NotificationItem['icon'] }) {
  switch (icon) {
    case 'briefcase':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'document':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'book':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'server':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case 'folder':
      return (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function NotificationPanel({ isOpen, onClose, onNavigate }: Props) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const filteredNotifications = useMemo(() => {
    const filterType = getFilterType(activeFilter);
    if (!filterType) return notifications;
    return notifications.filter((item) => item.type === filterType);
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
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {visibleNotifications.map((notification, index) => (
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
                        style={{ backgroundColor: notification.barColorValue }}
                      />
                      <div className="flex items-start gap-3 pl-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${notification.barColor} text-slate-700`}>
                          <NotificationIcon icon={notification.icon} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-base font-medium leading-6 text-slate-900">{notification.title}</h4>
                            <div className="shrink-0 pt-0.5 text-sm text-slate-500">{notification.timestamp}</div>
                          </div>
                          <p className="mt-1.5 text-sm leading-6 text-slate-600">{notification.description}</p>
                          <button
                            type="button"
                            onClick={() => onNavigate(notification.actionPath)}
                            className="mt-3.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                          >
                            {notification.actionButton}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
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
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
