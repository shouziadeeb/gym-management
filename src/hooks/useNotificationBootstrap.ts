import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  registerForPushNotifications,
  savePushToken,
} from '@/services/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queries/keys';

export function useNotificationBootstrap() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    void (async () => {
      const result = await registerForPushNotifications();
      if (result.granted) {
        await savePushToken(userId, result.token, Platform.OS);
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root(userId) });
    };

    const receivedSub = addNotificationReceivedListener(() => invalidate());
    const responseSub = addNotificationResponseListener((response) => {
      invalidate();
      const notificationId = response.notification.request.content.data?.notificationId;
      if (typeof notificationId === 'string') {
        router.push('/notifications' as never);
      }
    });

    void getLastNotificationResponse().then((response) => {
      if (!response) return;
      invalidate();
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [queryClient, userId]);
}
