'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, FileText, Calendar, BookOpen, Bell, Folder, Loader2, RefreshCw } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/components/common/toast/toast';
import {
  type Notification,
  type NotificationType,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications';

const notificationConfig: Record<NotificationType | string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  job: { icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-l-blue-500' },
  'saved-search': { icon: Folder, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-l-blue-500' },
  application: { icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-l-purple-500' },
  interview: { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-l-green-500' },
  course: { icon: BookOpen, color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500' },
  system: { icon: Bell, color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-l-slate-500' },
};

// Fallback/mock data when backend is unavailable
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'job',
    title: '3 new jobs match your profile!',
    description: 'AI recommendations for "Senior React Developer" roles in London.',
    actionButton: 'View Jobs',
    actionPath: '/explore-jobs',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '2',
    type: 'application',
    title: 'Application "Under Review" - Product Manager at Google',
    description: 'Your application has moved to the next stage. Good luck!',
    actionButton: 'Track Application',
    actionPath: '/applications',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '3',
    type: 'interview',
    title: 'Interview scheduled with Tech Solutions',
    description: 'Position: Software Engineer. Date: Oct 26, 2023 at 10:00 AM (Virtual)',
    actionButton: 'View Details',
    actionPath: '/interviews',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '4',
    type: 'course',
    title: 'New course "Advanced TypeScript" available!',
    description: 'Enhance your front-end skills with our latest offering.',
    actionButton: 'View Course',
    actionPath: '/courses',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') || '' : '';

  const loadNotifications = useCallback(async () => {
    if (!candidateId) {
      setError('Please log in to view notifications');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const type = activeTab === 'All' ? undefined : activeTab.toLowerCase().replace('s', '') as NotificationType;
      const response = await fetchNotifications(candidateId, type);
      
      if (response.success && response.data.notifications) {
        setNotifications(response.data.notifications);
        setUsingMockData(false);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setUsingMockData(true);
      setNotifications(mockNotifications);
      setError('Using offline mode - backend connection failed');
    } finally {
      setLoading(false);
    }
  }, [candidateId, activeTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const tabs = ['All', 'Jobs', 'Applications', 'Interviews', 'Courses', 'System'];

  const getTabType = (tab: string): NotificationType | null => {
    const tabMap: Record<string, NotificationType | null> = {
      'All': null,
      'Jobs': 'job',
      'Applications': 'application',
      'Interviews': 'interview',
      'Courses': 'course',
      'System': 'system',
    };
    return tabMap[tab] || null;
  };

  const filteredNotifications = activeTab === 'All'
    ? notifications
    : notifications.filter(n => {
        if (activeTab === 'Jobs') return n.type === 'job' || n.type === 'saved-search';
        return n.type === getTabType(activeTab);
      });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      if (!usingMockData && candidateId) {
        await markAllNotificationsAsRead(candidateId);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showSuccessToast('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      showErrorToast('Failed to mark notifications as read');
    }
  };

  const handleAction = (path?: string) => {
    if (path) {
      router.push(path);
    }
  };

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    try {
      if (!usingMockData && candidateId) {
        await markNotificationAsRead(candidateId, id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {usingMockData && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                Offline Mode
              </span>
            )}
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === 'All' 
              ? notifications.filter(n => !n.isRead).length
              : notifications.filter(n => {
                  if (tab === 'Jobs') return (n.type === 'job' || n.type === 'saved-search') && !n.isRead;
                  return n.type === getTabType(tab) && !n.isRead;
                }).length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-xl">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = notificationConfig[notification.type] || notificationConfig.system;
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    !notification.isRead ? `border-l-4 ${config.borderColor}` : ''
                  }`}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      {notification.actionButton && notification.actionPath && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notification.actionPath);
                          }}
                          className="mt-3 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {notification.actionButton}
                        </button>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More */}
        {!loading && filteredNotifications.length > 0 && (
          <div className="flex justify-center mt-6">
            <button className="px-6 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors">
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
