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

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    if (payload.reason === 'no_push_tokens') {
      logger.warn('notifications.flush_no_push_tokens');
    } else if (__DEV__) {
      logger.info('notifications.flush_user_push', payload);
    }
  }
}
