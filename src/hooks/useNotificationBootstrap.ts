import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  flushUserPushNotifications,
  getLastNotificationResponse,
  registerForPushNotifications,
  savePushToken,
} from '@/services/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queries/keys';
import { fetchNotifications } from '@/api/notifications.api';
import { resolveNotificationHref } from '@/lib/notification-navigation';
import { supabase } from '@/lib/supabase';

const isNativePushSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export function useNotificationBootstrap() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !isNativePushSupported) return;

    void (async () => {
      const result = await registerForPushNotifications();
      if (result.granted) {
        await savePushToken(userId, result.token, Platform.OS);
        await flushUserPushNotifications();
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId || !isNativePushSupported) return;

    const flushOnActive = () => {
      if (AppState.currentState === 'active') {
        void flushUserPushNotifications();
      }
    };

    flushOnActive();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushUserPushNotifications();
      }
    });

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root(userId) });
    };

    const channel = supabase
      .channel(`notification-push:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          invalidate();
          void flushUserPushNotifications();
        },
      )
      .subscribe();

    const receivedSub = addNotificationReceivedListener(() => invalidate());
    const responseSub = addNotificationResponseListener((response) => {
      invalidate();
      void (async () => {
        const notificationId = response.notification.request.content.data?.notificationId;
        if (typeof notificationId !== 'string') {
          router.push('/notifications' as never);
          return;
        }

        try {
          const items = await fetchNotifications(100);
          const match = items.find((item) => item.id === notificationId);
          const href = match ? resolveNotificationHref(match) : null;
          router.push((href ?? '/notifications') as never);
        } catch {
          router.push('/notifications' as never);
        }
      })();
    });

    void getLastNotificationResponse().then((response) => {
      if (!response) return;
      invalidate();
    });

    return () => {
      appStateSub.remove();
      void supabase.removeChannel(channel);
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient, userId]);
}
