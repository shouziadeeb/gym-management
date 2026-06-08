import type { AppNotification } from '@/domain/notifications/types';
import { routes } from '@/routing/constants';

/** Deep link target when the user opens a notification. */
export function resolveNotificationHref(notification: AppNotification): string | null {
  const requestId = notification.data.request_id;
  const gymId = notification.gymId ?? notification.data.gym_id;

  switch (notification.type) {
    case 'owner_join_request':
      if (typeof requestId === 'string') {
        return `/join-request/${encodeURIComponent(requestId)}`;
      }
      return routes.manageMembers;

    case 'member_gym_invite':
      return routes.memberships;

    case 'checkin_success':
    case 'attendance_missed':
      return routes.attendanceHistory;

    case 'payment_pending':
    case 'payment_success':
      return routes.memberships;

    default:
      if (typeof gymId === 'string') {
        return routes.gymDetail(gymId);
      }
      return null;
  }
}
