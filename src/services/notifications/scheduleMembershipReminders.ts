/**
 * Membership expiry reminders (5d, 3d, 1d, expired) run on the server via
 * `supabase/functions/notification-cron` — schedule daily with Supabase Cron.
 */
export const MEMBERSHIP_REMINDER_OFFSETS_DAYS = [5, 3, 1, 0] as const;

export const NOTIFICATION_CRON_FUNCTION = 'notification-cron';
