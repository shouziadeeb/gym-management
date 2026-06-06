import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const FLUSH_PUSH_FUNCTION = 'flush-user-push';

/** Flushes pending in-app notifications to Expo push for the signed-in user. */
export async function flushUserPushNotifications(): Promise<void> {
  const { data, error } = await supabase.functions.invoke(FLUSH_PUSH_FUNCTION, {
    method: 'POST',
  });

  if (error) {
    logger.warn('notifications.flush_user_push_failed', { error: error.message });
    return;
  }

  if (__DEV__ && data && typeof data === 'object') {
    logger.info('notifications.flush_user_push', data as Record<string, unknown>);
  }
}
