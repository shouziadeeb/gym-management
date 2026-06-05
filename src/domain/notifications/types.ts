import type { UserRole } from '@/types/models';

export type AppNotificationType =
  | 'membership_expiry_5d'
  | 'membership_expiry_3d'
  | 'membership_expiry_1d'
  | 'membership_expired'
  | 'payment_pending'
  | 'payment_success'
  | 'checkin_success'
  | 'attendance_missed'
  | 'class_upcoming'
  | 'trainer_assigned'
  | 'schedule_changed'
  | 'class_cancelled'
  | 'announcement_offer'
  | 'announcement_holiday'
  | 'announcement_gym_update'
  | 'owner_new_member'
  | 'owner_membership_renewed'
  | 'owner_membership_expired'
  | 'owner_payment_received'
  | 'owner_payment_pending'
  | 'owner_payment_failed'
  | 'owner_join_request'
  | 'owner_new_inquiry'
  | 'owner_attendance_summary'
  | 'owner_low_attendance'
  | 'owner_trainer_added'
  | 'owner_trainer_request'
  | 'owner_revenue_summary'
  | 'owner_weekly_report'
  | 'owner_plan_expiry';

export type NotificationFilterCategory =
  | 'all'
  | 'membership'
  | 'payment'
  | 'attendance'
  | 'classes'
  | 'announcements'
  | 'business';

export type AppNotification = {
  id: string;
  userId: string;
  gymId: string | null;
  title: string;
  message: string;
  type: AppNotificationType | null;
  role: UserRole | null;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
};

export const NOTIFICATION_FILTER_OPTIONS: {
  id: NotificationFilterCategory;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'membership', label: 'Membership' },
  { id: 'payment', label: 'Payment' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'classes', label: 'Classes' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'business', label: 'Business' },
];

const MEMBERSHIP_TYPES: AppNotificationType[] = [
  'membership_expiry_5d',
  'membership_expiry_3d',
  'membership_expiry_1d',
  'membership_expired',
  'owner_new_member',
  'owner_membership_renewed',
  'owner_membership_expired',
  'owner_join_request',
];

const PAYMENT_TYPES: AppNotificationType[] = [
  'payment_pending',
  'payment_success',
  'owner_payment_received',
  'owner_payment_pending',
  'owner_payment_failed',
];

const ATTENDANCE_TYPES: AppNotificationType[] = [
  'checkin_success',
  'attendance_missed',
  'owner_attendance_summary',
  'owner_low_attendance',
];

const CLASS_TYPES: AppNotificationType[] = [
  'class_upcoming',
  'trainer_assigned',
  'schedule_changed',
  'class_cancelled',
  'owner_trainer_added',
  'owner_trainer_request',
];

const ANNOUNCEMENT_TYPES: AppNotificationType[] = [
  'announcement_offer',
  'announcement_holiday',
  'announcement_gym_update',
  'owner_new_inquiry',
];

const BUSINESS_TYPES: AppNotificationType[] = [
  'owner_revenue_summary',
  'owner_weekly_report',
  'owner_plan_expiry',
];

export function matchesNotificationFilter(
  type: AppNotificationType | null,
  filter: NotificationFilterCategory,
): boolean {
  if (filter === 'all' || !type) return filter === 'all';

  const map: Record<Exclude<NotificationFilterCategory, 'all'>, AppNotificationType[]> = {
    membership: MEMBERSHIP_TYPES,
    payment: PAYMENT_TYPES,
    attendance: ATTENDANCE_TYPES,
    classes: CLASS_TYPES,
    announcements: ANNOUNCEMENT_TYPES,
    business: BUSINESS_TYPES,
  };

  return map[filter].includes(type);
}
