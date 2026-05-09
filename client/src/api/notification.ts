import request from './request';

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content?: string;
  is_read: number;
  created_at: string;
}

export const apiNotificationList = (params?: Record<string, any>): Promise<{ list: NotificationItem[]; total: number }> =>
  request.get('/notifications', { params });

export const apiUnreadCount = (): Promise<{ count: number }> =>
  request.get('/notifications/unread-count');

export const apiMarkRead = (ids: number[]) =>
  request.post('/notifications/read', { ids });

export const apiMarkAllRead = () =>
  request.post('/notifications/read-all');
