import type { AppNotification, AppNotificationType } from '@/domain/notifications/types';
import type { UserRole } from '@/types/models';
import { supabase } from '@/lib/supabase';

type NotificationRow = {
  id: string;
  user_id: string;
  gym_id: string | null;
  title: string;
  body: string | null;
  type: AppNotificationType | null;
  audience_role: UserRole | null;
  read_at: string | null;
  created_at: string;
  data: Record<string, unknown> | null;
};

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    gymId: row.gym_id,
    title: row.title,
    message: row.body ?? '',
    type: row.type,
    role: row.audience_role,
    isRead: row.read_at !== null,
    createdAt: row.created_at,
    data: row.data ?? {},
  };
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, gym_id, title, body, type, audience_role, read_at, created_at, data')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapNotification(row as NotificationRow));
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
