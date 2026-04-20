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
