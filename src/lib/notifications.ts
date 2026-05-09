import { API_BASE_URL } from './api-base';

export type NotificationType = 'job' | 'application' | 'interview' | 'course' | 'system' | 'saved-search';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  actionButton?: string;
  actionPath?: string;
  timestamp: string;
  isRead: boolean;
  metadata?: {
    jobId?: string;
    applicationId?: string;
    interviewId?: string;
    courseId?: string;
    companyName?: string;
    position?: string;
    status?: string;
    [key: string]: unknown;
  };
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
  };
  message?: string;
}

export async function fetchNotifications(candidateId: string, type?: NotificationType): Promise<NotificationsResponse> {
  const url = new URL(`${API_BASE_URL}/notifications/${candidateId}`);
  if (type && type !== 'all') {
    url.searchParams.append('type', type);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json() as NotificationsResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch notifications');
  }

  return result;
}

export async function markNotificationAsRead(candidateId: string, notificationId: string): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/notifications/${candidateId}/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json() as { success: boolean; message?: string };

  if (!response.ok) {
    throw new Error(result.message || 'Failed to mark notification as read');
  }

  return result;
}

export async function markAllNotificationsAsRead(candidateId: string): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/notifications/${candidateId}/mark-all-read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json() as { success: boolean; message?: string };

  if (!response.ok) {
    throw new Error(result.message || 'Failed to mark all notifications as read');
  }

  return result;
}

export async function getUnreadNotificationCount(candidateId: string): Promise<{ success: boolean; count: number; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/notifications/${candidateId}/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json() as { success: boolean; count: number; message?: string };

  if (!response.ok) {
    throw new Error(result.message || 'Failed to get unread count');
  }

  return result;
}

export interface CreateNotificationInput {
  type?: NotificationType;
  title: string;
  description?: string;
  actionButton?: string | null;
  actionPath?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Custom event the rest of the app listens to so the bell badge can refresh
 * the moment a new notification is recorded — without any prop drilling.
 */
export const NOTIFICATIONS_UPDATED_EVENT = 'saasa:notifications-updated';

function emitNotificationsUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

/**
 * Fire-and-forget signal used after server-side actions that already persist
 * a notification (e.g. POST /applications). Lets the bell badge + panel
 * refresh without a second write. Safe to call on the client.
 */
export function notifyBellRefresh() {
  emitNotificationsUpdated();
}

/**
 * Records a notification for the current candidate. Silently no-ops when
 * candidateId is missing (e.g. logged-out flows) and on network errors so
 * it can be safely fire-and-forget at any toast call site.
 */
export async function recordCandidateNotification(
  candidateId: string | null | undefined,
  payload: CreateNotificationInput
): Promise<void> {
  if (!candidateId || !payload?.title) return;

  try {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || sessionStorage.getItem('token')
        : null;

    await fetch(`${API_BASE_URL}/notifications/${candidateId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: payload.type || 'system',
        title: payload.title,
        description: payload.description || '',
        actionButton: payload.actionButton || null,
        actionPath: payload.actionPath || null,
        metadata: payload.metadata || {},
      }),
    });

    emitNotificationsUpdated();
  } catch {
    // Bell is a side channel; never fail the calling UI flow because of it.
  }
}
